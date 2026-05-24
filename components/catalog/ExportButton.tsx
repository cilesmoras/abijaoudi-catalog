"use client";

import { Button } from "@/components/ui/button";
import type { Category, Item } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Download } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  items: Item[];
  categories: Category[];
  disabled?: boolean;
}

export function ExportButton({
  items,
  categories,
  disabled = false,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
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
      const imageAreaH = 32;
      const cardH = imageAreaH + 26;
      const categoryById = new Map(
        categories.map((category) => [category.id, category.name]),
      );

      // Title page header
      doc.setFillColor(5, 150, 105); // emerald-600
      doc.rect(0, 0, pageW, 20, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Product Catalog", pageW / 2, 13, { align: "center" });

      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(date, pageW / 2, 18, { align: "center" });

      let y = 28;
      let col = 0;

      for (const item of items) {
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
            const imgData = await fetchImageAsDataUrl(item.image_url);
            const dims = await getImageDimensions(imgData);
            // cover: scale up until both dimensions fill the area
            const scale = Math.max(cardW / dims.w, imageAreaH / dims.h);
            const drawW = dims.w * scale;
            const drawH = dims.h * scale;
            const drawX = x + (cardW - drawW) / 2;
            const drawY = y + (imageAreaH - drawH) / 2;
            // clip to the image area so overflow is hidden
            doc.saveGraphicsState();
            doc.rect(x, y, cardW, imageAreaH, "S"); // defines clip path
            doc.clip();
            doc.addImage(
              imgData,
              getImageFormatFromDataUrl(imgData),
              drawX,
              drawY,
              drawW,
              drawH,
            );
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

        const categoryLabel =
          item.categories?.name ??
          (item.category_id ? categoryById.get(item.category_id) : undefined) ??
          "Uncategorized";
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(5, 150, 105);
        doc.text(categoryLabel.toUpperCase(), textX, textY);

        textY += 4;
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
        doc.setTextColor(5, 150, 105);
        doc.text(formatPrice(item.price), textX, textY);

        col++;
        if (col >= colCount) {
          col = 0;
          y += cardH + gap;
        }
      }

      // Footer on last page
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.setFont("helvetica", "normal");
      doc.text(`${items.length} products`, pageW / 2, pageH - 6, {
        align: "center",
      });

      doc.save(`catalog-${new Date().toISOString().slice(0, 10)}.pdf`);
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
      className="bg-emerald-600 hover:bg-emerald-700"
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

function getImageFormatFromDataUrl(dataUrl: string): "JPEG" | "PNG" {
  return dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
}

function getImageDimensions(
  dataUrl: string,
): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = dataUrl;
  });
}
