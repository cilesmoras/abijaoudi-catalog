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
import { createCategory } from "@/lib/api-client";
import type { Category } from "@/lib/types";
import { getItemImageSrc } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";

export type ItemFormValues = {
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  category_id: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
};

interface ItemFormProps {
  categories: Category[];
  initialValues?: Partial<ItemFormValues>;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: ItemFormValues) => Promise<void>;
}

const EMPTY_CATEGORY = "__none__";

export function ItemForm({
  categories,
  initialValues,
  submitLabel,
  submitting,
  onSubmit,
}: ItemFormProps) {
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
      const created = await createCategory(trimmed);
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
      name: name.trim(),
      description: description.trim() ? description.trim() : null,
      price: parsedPrice,
      unit: unit.trim() ? unit.trim() : null,
      category_id: categoryId,
      image_url: finalImageUrl,
      thumbnail_url: finalThumbnailUrl,
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
        {uploadingImage ? (
          <p className="text-sm text-gray-500">Uploading image…</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={submitting || uploadingImage}>
        {uploadingImage
          ? "Uploading image…"
          : submitting
            ? "Saving…"
            : submitLabel}
      </Button>
    </form>
  );
}
