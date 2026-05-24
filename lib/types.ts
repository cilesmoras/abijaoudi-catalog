export type Category = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type ItemCategoryPreview = Pick<Category, "id" | "name" | "slug">;

export type Item = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  created_at: string;
  categories?: ItemCategoryPreview | null;
};

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id" | "created_at">>;
      };
      items: {
        Row: Item;
        Insert: Omit<Item, "id" | "created_at" | "categories">;
        Update: Partial<Omit<Item, "id" | "created_at" | "categories">>;
      };
    };
  };
};
