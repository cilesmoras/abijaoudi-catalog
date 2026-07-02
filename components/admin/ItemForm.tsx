"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCategoryAction } from "@/app/dashboard/categories/actions";
import type {
  Category,
  ItemFormValues,
  ItemImage,
  ItemImageValue,
  Plan,
} from "@/lib/types";
import { isPro } from "@/lib/plans";
import { getItemImageSrc } from "@/lib/utils";
import { ArrowDown, ArrowUp, Star, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

// Re-exported so existing importers (api-client, form wrappers) keep working;
// the canonical definitions now live in lib/types.ts.
export type { ItemFormValues, ItemImageValue };

interface ItemFormProps {
  categories: Category[];
  initialValues?: Partial<ItemFormValues> & { images?: ItemImage[] | null };
  submitLabel: string;
  submitting: boolean;
  /** Pro unlocks multiple, full-quality photos. Defaults to "free". */
  plan?: Plan;
  onSubmit: (values: ItemFormValues) => Promise<void>;
}

// A photo in the Pro gallery editor. `coverUrl` is the compressed variant shown
// in the grid/PDF; `fullUrl` is the full-quality variant for the lightbox.
type Photo = {
  coverUrl: string;
  thumbUrl: string | null;
  fullUrl: string | null;
};

const EMPTY_CATEGORY = "__none__";

export function ItemForm({
  categories,
  initialValues,
  submitLabel,
  submitting,
  plan = "free",
  onSubmit,
}: ItemFormProps) {
  const pro = isPro(plan);
  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [price, setPrice] = useState(initialValues?.price?.toString() ?? "");
  const [unit, setUnit] = useState(initialValues?.unit ?? "");
  const [categoryId, setCategoryId] = useState(
    initialValues?.category_id ?? EMPTY_CATEGORY,
  );
  const [createdCategories, setCreatedCategories] = useState<Category[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [imageUrl, setImageUrl] = useState(initialValues?.image_url ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialValues?.thumbnail_url ?? "",
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pro gallery editor. Seeded from saved gallery photos, or the cover alone.
  const [photos, setPhotos] = useState<Photo[]>(() => {
    const saved = initialValues?.images;
    if (saved && saved.length > 0) {
      return [...saved]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((image) => ({
          coverUrl: image.thumbnail_url ?? image.url,
          thumbUrl: image.thumbnail_url,
          fullUrl: image.url,
        }));
    }
    if (initialValues?.image_url) {
      return [
        {
          coverUrl: initialValues.image_url,
          thumbUrl: initialValues.thumbnail_url ?? null,
          fullUrl: initialValues.image_url,
        },
      ];
    }
    return [];
  });
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  async function handleAddPhotos(files: FileList) {
    setUploadingPhotos(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("full", "1");
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Photo upload failed");
        }
        const payload = (await response.json()) as {
          url: string;
          thumbnailUrl: string;
          fullUrl?: string;
        };
        setPhotos((current) => [
          ...current,
          {
            coverUrl: payload.url,
            thumbUrl: payload.thumbnailUrl,
            fullUrl: payload.fullUrl ?? null,
          },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingPhotos(false);
    }
  }

  function movePhoto(index: number, direction: -1 | 1) {
    setPhotos((current) => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }

  // Free cover: clear the pending upload and the saved image so submit sends a
  // null cover (the server then deletes the old storage objects).
  function clearImage() {
    setSelectedFile(null);
    setImageUrl("");
    setThumbnailUrl("");
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }

  // useEffect(() => {
  //   setName(initialValues?.name ?? "");
  //   setDescription(initialValues?.description ?? "");
  //   setPrice(initialValues?.price?.toString() ?? "");
  //   setCategoryId(initialValues?.category_id ?? EMPTY_CATEGORY);
  //   setImageUrl(initialValues?.image_url ?? "");
  //   setSelectedFile(null);
  //   setPreviewUrl((current) => {
  //     if (current) URL.revokeObjectURL(current);
  //     return null;
  //   });
  // }, [initialValues]);

  // Categories load asynchronously in the parent; merge in any created from
  // within this form so a just-added category isn't dropped on re-render.
  const seenCategoryIds = new Set(categories.map((category) => category.id));
  const categoryOptions = [
    ...categories,
    ...createdCategories.filter((category) => !seenCategoryIds.has(category.id)),
  ];

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleCreateCategory() {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setError("Category name is required");
      return;
    }

    setCreatingCategory(true);
    setError(null);
    try {
      const result = await createCategoryAction(trimmed);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      const created = result.data;
      setCreatedCategories((current) =>
        current.some((category) => category.id === created.id)
          ? current
          : [...current, created],
      );
      setCategoryId(created.id);
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    let response: Response;
    try {
      response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
    } catch {
      return { error: "Image upload failed" } as const;
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      return { error: payload?.error ?? "Image upload failed" } as const;
    }

    const payload = (await response.json()) as {
      url: string;
      thumbnailUrl: string;
    };
    return { url: payload.url, thumbnailUrl: payload.thumbnailUrl } as const;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedPrice = Number(price);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!Number.isFinite(parsedPrice)) {
      setError("A valid price is required");
      return;
    }

    if (categoryId === EMPTY_CATEGORY) {
      setError("Category is required");
      return;
    }

    const base = {
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      price: parsedPrice,
      unit: unit.trim() ? unit.trim() : null,
      category_id: categoryId,
    };

    // Pro: the gallery is the source of truth; the first photo is the cover
    // (compressed for the grid/PDF), and every photo is stored full-quality.
    if (pro) {
      const cover = photos[0] ?? null;
      await onSubmit({
        ...base,
        image_url: cover?.coverUrl ?? null,
        thumbnail_url: cover?.thumbUrl ?? null,
        images: photos.map((photo, index) => ({
          url: photo.fullUrl ?? photo.coverUrl,
          thumbnail_url: photo.coverUrl,
          sort_order: index,
        })),
      });
      return;
    }

    // Free: a single compressed cover, uploaded on submit.
    let finalImageUrl = imageUrl.trim() ? imageUrl.trim() : null;
    let finalThumbnailUrl = thumbnailUrl.trim() ? thumbnailUrl.trim() : null;

    if (selectedFile) {
      setUploadingImage(true);
      const uploadResult = await uploadImage(selectedFile);
      if ("error" in uploadResult) {
        setUploadingImage(false);
        setError(uploadResult.error ?? "Image upload failed");
        return;
      }
      finalImageUrl = uploadResult.url;
      finalThumbnailUrl = uploadResult.thumbnailUrl;
      setImageUrl(uploadResult.url);
      setThumbnailUrl(uploadResult.thumbnailUrl);
      setSelectedFile(null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setUploadingImage(false);
    }

    await onSubmit({
      ...base,
      image_url: finalImageUrl,
      thumbnail_url: finalThumbnailUrl,
      images: null,
    });
  }

  const displayImageUrl = previewUrl || getItemImageSrc(imageUrl);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Milk 1L"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Fresh full-cream milk"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit">Unit of measurement</Label>
        <Input
          id="unit"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          placeholder="e.g. kg, L, piece, dozen"
        />
        <p className="text-xs text-gray-500">
          Optional. Shown next to the price (e.g. “$5.00 / kg”).
        </p>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_CATEGORY} disabled>
              Select a category
            </SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showNewCategory ? (
          <div className="flex items-center gap-2">
            <Input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateCategory();
                }
              }}
              placeholder="New category name"
              autoFocus
            />
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCategory}
              disabled={creatingCategory}
            >
              {creatingCategory ? "Adding…" : "Add"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowNewCategory(false);
                setNewCategoryName("");
              }}
              disabled={creatingCategory}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowNewCategory(true)}
          >
            + New category
          </Button>
        )}
      </div>

      {pro ? (
        <div className="space-y-2">
          <Label htmlFor="photos">Photos</Label>
          <p className="text-xs text-gray-500">
            Add multiple full-quality photos. The first is the cover shown in
            your catalog grid and PDF; all photos appear in the gallery.
          </p>
          {photos.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((photo, index) => (
                <li
                  key={`${photo.coverUrl}-${index}`}
                  className="relative overflow-hidden rounded-md border"
                >
                  <img
                    src={photo.coverUrl}
                    alt={`Photo ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  {index === 0 ? (
                    <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      <Star className="h-3 w-3" />
                      Cover
                    </span>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/40 px-1 py-0.5">
                    <div className="flex gap-0.5">
                      <button
                        type="button"
                        aria-label="Move left"
                        onClick={() => movePhoto(index, -1)}
                        disabled={index === 0}
                        className="rounded p-0.5 text-white disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        aria-label="Move right"
                        onClick={() => movePhoto(index, 1)}
                        disabled={index === photos.length - 1}
                        className="rounded p-0.5 text-white disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                      </button>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => removePhoto(index)}
                      className="rounded p-0.5 text-white hover:text-red-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          <Input
            id="photos"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              const files = event.target.files;
              if (files && files.length > 0) {
                void handleAddPhotos(files);
              }
              event.target.value = "";
            }}
          />
          {uploadingPhotos ? (
            <p className="text-sm text-gray-500">Uploading photos…</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="image">Product image</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setError(null);
                setSelectedFile(file);
                const nextPreviewUrl = URL.createObjectURL(file);
                setPreviewUrl((current) => {
                  if (current) URL.revokeObjectURL(current);
                  return nextPreviewUrl;
                });
              }
            }}
          />
          <img
            src={displayImageUrl}
            alt="Uploaded preview"
            className="h-28 w-28 rounded-md border object-cover"
          />
          {previewUrl || imageUrl ? (
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearImage}
              >
                Remove image
              </Button>
            </div>
          ) : null}
          {uploadingImage ? (
            <p className="text-sm text-gray-500">Uploading image…</p>
          ) : null}
        </div>
      )}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button
        type="submit"
        disabled={submitting || uploadingImage || uploadingPhotos}
      >
        {uploadingImage || uploadingPhotos
          ? "Uploading…"
          : submitting
            ? "Saving…"
            : submitLabel}
      </Button>
    </form>
  );
}
