"use client";

import { Button } from "@/components/ui/button";
import type { Category, Item, Plan } from "@/lib/types";
import { isPro } from "@/lib/plans";
import { getDialCode } from "@/lib/countries";
import { formatPrice } from "@/lib/utils";
import { Download } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  items: Item[];
  categories: Category[];
  storeName: string;
  currency: string | null;
  plan: Plan;
  logoUrl: string | null;
  phone?: string | null;
  country?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  socials?: {
    facebook: string | null;
    instagram: string | null;
    tiktok: string | null;
  };
  disabled?: boolean;
}

// Format the owner's phone as it appears on the public catalog: prepend the
// dial code derived from their country, falling back to the raw number.
function formatPhone(
  phone: string | null | undefined,
  country: string | null | undefined,
): string | null {
  if (!phone) return null;
  const dialCode = getDialCode(country);
  if (!dialCode) return phone;
  return `+${dialCode} ${phone}`;
}

// Strip protocol/www so a social URL reads as a compact handle in the PDF.
function socialLabel(url: string): string {
  return url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

export function ExportButton({
  items,
  categories,
  storeName,
  currency,
  plan,
  logoUrl,
  phone,
  country,
  contactEmail,
  address,
  socials,
  disabled = false,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const { jsPDF, GState } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageW = 210;
      const pageH = 297;
      const margin = 14;
      const colCount = 4;
      const gap = 4;
      const cardW = (pageW - margin * 2 - gap * (colCount - 1)) / colCount;
      // Match catalog card behavior: square media area with object-cover cropping
      const imageAreaH = cardW;
      const cardH = imageAreaH + 26;
      const categoryById = new Map(
        categories.map((category) => [category.id, category.name]),
      );

      // Title page header
      doc.setFillColor(37, 99, 235); // blue-600
      doc.rect(0, 0, pageW, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(storeName, pageW / 2, 13, { align: "center" });

      // Pro: draw the owner's logo at the left of the header band.
      if (isPro(plan) && logoUrl) {
        try {
          const logoData = await fetchImageAsDataUrl(logoUrl);
          const { w: lw, h: lh } = await getImageSize(logoData);
          const maxH = 14;
          const drawH = maxH;
          const drawW = (lw / lh) * drawH;
          doc.addImage(logoData, "JPEG", margin, 3, drawW, drawH);
        } catch {
          // If the logo can't be fetched, just skip it — the title still shows.
        }
      }

      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(date, pageW / 2, 18, { align: "center" });

      // Contact line (all plans) — phone • email • address, centered below the
      // header. Drawn only when at least one field is set; the items grid starts
      // lower to make room.
      const contactParts = [
        formatPhone(phone, country),
        contactEmail,
        address,
      ].filter((part): part is string => Boolean(part));
      const hasContact = contactParts.length > 0;
      if (hasContact) {
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(contactParts.join("   •   "), pageW / 2, 26, {
          align: "center",
        });
      }

      // Group items by category
      const categoryHeaderH = 10;
      const grouped = new Map<string, Item[]>();
      for (const item of items) {
        const label =
          item.categories?.name ??
          (item.category_id ? categoryById.get(item.category_id) : undefined) ??
          "Uncategorized";
        if (!grouped.has(label)) grouped.set(label, []);
        grouped.get(label)!.push(item);
      }
      // Sort groups alphabetically, "Uncategorized" last
      const sortedGroups = [...grouped.entries()].sort(([a], [b]) => {
        if (a === "Uncategorized") return 1;
        if (b === "Uncategorized") return -1;
        return a.localeCompare(b);
      });

      let y = hasContact ? 33 : 28;
      let col = 0;

      for (const [categoryName, groupItems] of sortedGroups) {
        // If mid-row, flush to next row
        if (col > 0) {
          col = 0;
          y += cardH + gap;
        }

        // Ensure space for header + at least one card row
        if (y + categoryHeaderH + cardH > pageH - margin - 8) {
          doc.addPage();
          y = margin;
        }

        // Category section header
        doc.setFillColor(239, 246, 255); // blue-50
        doc.setDrawColor(191, 219, 254); // blue-200
        doc.roundedRect(
          margin,
          y,
          pageW - margin * 2,
          categoryHeaderH,
          2,
          2,
          "FD",
        );
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(37, 99, 235);
        doc.text(categoryName, margin + 4, y + 6.5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128);
        doc.text(
          `${groupItems.length} item${groupItems.length !== 1 ? "s" : ""}`,
          pageW - margin - 4,
          y + 6.5,
          { align: "right" },
        );

        y += categoryHeaderH + gap;

        for (const item of groupItems) {
          if (y + cardH > pageH - margin - 8) {
            doc.addPage();
            y = margin;
            col = 0;
          }

          const x = margin + col * (cardW + gap);

          // Card shell
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(229, 231, 235);
          doc.roundedRect(x, y, cardW, cardH, 3, 3, "FD");

          // Image area — object-cover: fill the area, crop overflow via clip
          doc.setFillColor(249, 250, 251);
          doc.rect(x, y, cardW, imageAreaH, "F");

          if (item.image_url) {
            try {
              // Images are pre-sized, compressed, and EXIF-corrected on upload,
              // so embed the JPEG bytes directly (no PNG re-encode = small PDF).
              const imgData = await fetchImageAsDataUrl(item.image_url);
              const { w: natW, h: natH } = await getImageSize(imgData);
              // cover: scale up until both dimensions fill the area
              const scale = Math.max(cardW / natW, imageAreaH / natH);
              const drawW = natW * scale;
              const drawH = natH * scale;
              const drawX = x + (cardW - drawW) / 2;
              const drawY = y + (imageAreaH - drawH) / 2;
              // clip to the image area so overflow is hidden
              doc.saveGraphicsState();
              doc.rect(x, y, cardW, imageAreaH, null); // defines clip path only
              doc.clip();
              doc.discardPath();
              doc.addImage(imgData, "JPEG", drawX, drawY, drawW, drawH);
              doc.restoreGraphicsState();
            } catch {
              drawImagePlaceholder(doc, x, y, cardW, imageAreaH);
            }
          } else {
            drawImagePlaceholder(doc, x, y, cardW, imageAreaH);
          }

          const textX = x + 3;
          const textW = cardW - 6;
          let textY = y + imageAreaH + 5;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(17, 24, 39);
          const nameLines = doc.splitTextToSize(item.name, textW);
          doc.text(nameLines.slice(0, 2), textX, textY);
          textY += nameLines.slice(0, 2).length * 3.5;

          if (item.description) {
            textY += 2;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(6.5);
            doc.setTextColor(107, 114, 128);
            const descLines = doc.splitTextToSize(item.description, textW);
            doc.text(descLines.slice(0, 2), textX, textY);
            textY += descLines.slice(0, 2).length * 3;
          }

          textY += 3;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(37, 99, 235);
          doc.text(formatPrice(item.price, currency), textX, textY);

          col++;
          if (col >= colCount) {
            col = 0;
            y += cardH + gap;
          }
        }

        // After group, add spacing before next category header
        if (col > 0) {
          col = 0;
          y += cardH + gap;
        }
        y += 4;
      }

      // Pro-only: social handles to show in the footer (Free has no socials).
      const socialParts = isPro(plan)
        ? [socials?.facebook, socials?.instagram, socials?.tiktok]
            .filter((url): url is string => Boolean(url))
            .map(socialLabel)
        : [];

      // Free catalogs are watermarked: a large translucent diagonal stamp on
      // every page, plus a clickable "Made with Cataloo" link in the footer.
      // Pro omits both.
      const free = !isPro(plan);
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);

        if (free) {
          // Diagonal watermark drawn over the content at low opacity.
          doc.saveGraphicsState();
          doc.setGState(new GState({ opacity: 0.12 }));
          doc.setTextColor(37, 99, 235); // blue-600
          doc.setFont("helvetica", "bold");
          doc.setFontSize(42);
          doc.text("Made with Cataloo", pageW / 2, pageH / 2, {
            align: "center",
            angle: 35,
          });
          doc.restoreGraphicsState();
        }

        // Footer (full opacity).
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        if (free) {
          doc.setTextColor(156, 163, 175);
          doc.text(`${items.length} products`, margin, pageH - 6);
          doc.setTextColor(37, 99, 235); // blue-600
          const label = "Made with Cataloo";
          const labelW = doc.getTextWidth(label);
          doc.textWithLink(label, pageW - margin - labelW, pageH - 6, {
            url: "https://cataloo.app",
          });
        } else {
          doc.setTextColor(156, 163, 175);
          const footerLine = [`${items.length} products`, ...socialParts].join(
            "   •   ",
          );
          doc.text(footerLine, pageW / 2, pageH - 6, {
            align: "center",
          });
        }
      }

      const slug =
        storeName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") || "catalog";
      doc.save(`${slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error("PDF export failed", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading || disabled}
      className="bg-blue-600 hover:bg-blue-700"
    >
      <Download className="w-4 h-4" />
      {loading ? "Generating PDF…" : "Export PDF"}
    </Button>
  );
}

function drawImagePlaceholder(
  doc: InstanceType<typeof import("jspdf").jsPDF>,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  doc.setFillColor(229, 231, 235);
  doc.rect(x, y, w, h, "F");
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(6);
  doc.text("No Image", x + w / 2, y + h / 2 + 2, { align: "center" });
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(
    `/api/proxy-image?url=${encodeURIComponent(url)}`,
  );
  if (!response.ok) throw new Error("Failed to fetch image");
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Reads an image's natural dimensions (needed for object-cover scaling) without
 * re-encoding it. Orientation is already baked in by sharp at upload time.
 */
function getImageSize(dataUrl: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}
