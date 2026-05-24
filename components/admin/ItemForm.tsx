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
import type { Category } from "@/lib/types";
import { getItemImageSrc } from "@/lib/utils";
import { FormEvent, useEffect, useState } from "react";

export type ItemFormValues = {
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
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
  const [categoryId, setCategoryId] = useState(
    initialValues?.category_id ?? EMPTY_CATEGORY,
  );
  const [imageUrl, setImageUrl] = useState(initialValues?.image_url ?? "");
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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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

    const payload = (await response.json()) as { url: string };
    return { url: payload.url } as const;
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

    if (selectedFile) {
      setUploadingImage(true);
      const uploadResult = await uploadImage(selectedFile);
      if ("error" in uploadResult) {
        setUploadingImage(false);
        setError(uploadResult.error ?? "Image upload failed");
        return;
      }
      finalImageUrl = uploadResult.url;
      setImageUrl(uploadResult.url);
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
      category_id: categoryId,
      image_url: finalImageUrl,
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
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_CATEGORY} disabled>
              Select a category
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
