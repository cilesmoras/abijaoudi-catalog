export type Plan = "free" | "pro";

export type Profile = {
  id: string;
  handle: string;
  catalog_name: string;
  phone: string | null;
  country: string | null;
  contact_email: string | null;
  address: string | null;
  currency: string | null;
  plan: Plan;
  pro_expires_at: string | null;
  upgrade_requested_at: string | null;
  upgrade_request_message: string | null;
  logo_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  offers_delivery: boolean;
  offers_pickup: boolean;
  delivery_payment_upfront: boolean;
  delivery_payment_cod: boolean;
  delivery_fee: number | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type ItemCategoryPreview = Pick<Category, "id" | "name" | "slug">;

export type ItemImage = {
  id: string;
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
};

// A priced choice in an item's single option group (e.g. "Small" in "Size").
export type ItemOption = {
  id: string;
  name: string;
  price: number;
  sort_order: number;
};

export type Item = {
  id: string;
  owner_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  // For items with options this is the denormalized min(choice prices);
  // the presence of options is signaled by `options`, never by price.
  price: number;
  unit: string | null;
  // Label for the option group (e.g. "Size"). Null when the item has no options.
  options_label: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  hidden: boolean;
  created_at: string;
  categories?: ItemCategoryPreview | null;
  // Pro-only additional photos beyond the cover (image_url). Empty for Free.
  images?: ItemImage[];
  options?: ItemOption[];
};

// A single gallery photo in an item create/update payload.
export type ItemImageValue = {
  url: string;
  thumbnail_url: string | null;
  sort_order: number;
};

// A choice in an item create/update payload.
export type ItemOptionValue = {
  name: string;
  price: number;
  sort_order: number;
};

// The payload shape produced by the item form and consumed by the create/update
// mutations (Server Actions + the legacy /api/items route handlers).
export type ItemFormValues = {
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  category_id: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  images?: ItemImageValue[] | null;
  options_label?: string | null;
  options?: ItemOptionValue[] | null;
};
