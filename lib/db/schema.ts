import { relations } from "drizzle-orm";
import {
  boolean,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// `profiles.id` equals the Supabase `auth.users.id`. Drizzle's schemaFilter is
// ["public"], so the FK to auth.users is added in the raw migration script
// (scripts/apply-migration.mjs), not here.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  catalogName: text("catalog_name").notNull(),
  phone: text("phone"),
  country: text("country"),
  contactEmail: text("contact_email"),
  address: text("address"),
  currency: text("currency"),
  // Subscription tier. Free is enforced (item limit, random handle, share
  // badge, watermarked PDF); Pro unlocks them. Activated manually for now —
  // see scripts/set-plan.mjs — until a payment provider is wired in.
  plan: text("plan").notNull().default("free"),
  // Pro-only: logo shown on PDF exports in place of the Cataloo branding.
  logoUrl: text("logo_url"),
  offersDelivery: boolean("offers_delivery").notNull().default(false),
  offersPickup: boolean("offers_pickup").notNull().default(false),
  deliveryPaymentUpfront: boolean("delivery_payment_upfront")
    .notNull()
    .default(false),
  deliveryPaymentCod: boolean("delivery_payment_cod").notNull().default(false),
  deliveryFee: numeric("delivery_fee", {
    precision: 10,
    scale: 2,
    mode: "number",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("categories_owner_slug_key").on(table.ownerId, table.slug),
  ],
);

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
  unit: text("unit"),
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  hidden: boolean("hidden").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profilesRelations = relations(profiles, ({ many }) => ({
  categories: many(categories),
  items: many(items),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [categories.ownerId],
    references: [profiles.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  owner: one(profiles, {
    fields: [items.ownerId],
    references: [profiles.id],
  }),
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
}));
