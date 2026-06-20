export type Profile = {
  id: string;
  handle: string;
  catalog_name: string;
  phone: string | null;
  contact_email: string | null;
  address: string | null;
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
  image_url: string | null;
  thumbnail_url: string | null;
  hidden: boolean;
  created_at: string;
  categories?: ItemCategoryPreview | null;
};
