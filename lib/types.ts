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
  logo_url: string | null;
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

export type Item = {
  id: string;
  owner_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  hidden: boolean;
  created_at: string;
  categories?: ItemCategoryPreview | null;
};
