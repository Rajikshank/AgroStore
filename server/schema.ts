import {
  boolean,
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  pgEnum,
  serial,
  real,
  index,
} from "drizzle-orm/pg-core";

// import { drizzle } from "drizzle-orm/postgres-js";
import type { AdapterAccountType } from "next-auth/adapters";
import { createId } from "@paralleldrive/cuid2";
import { InferSelectModel, relations } from "drizzle-orm";

export const RoleEnum = pgEnum("roles", ["user", "admin"]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  twoFactorEnabled: boolean("twoFactorEnabled").default(false),
  role: RoleEnum("roles").default("user"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const emailtokens = pgTable(
  "email_Tokens",
  {
    id: text("id")
      .notNull()
      .$default(() => createId()),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    email: text("email").notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.id, vt.token],
    }),
  })
);

export const PasswordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: text("id")
      .notNull()
      .$defaultFn(() => createId()),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    email: text("email").notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.id, vt.token],
    }),
  })
);

export const twoFactorTokens = pgTable(
  "two_factor_tokens",
  {
    id: text("id")
      .notNull()
      .$defaultFn(() => createId()),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
    email: text("email").notNull(),
    userID: text("userID").references(() => users.id, { onDelete: "cascade" }),
  },
  (vt) => ({
    compoundKey: primaryKey({
      columns: [vt.id, vt.token],
    }),
  })
);

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  title: text("title").notNull(),
  created: timestamp("created").defaultNow(),
  price: real("price").notNull(),
});

export const productVariants = pgTable("productVariants", {
  id: serial("id").primaryKey(),
  color: text("color").notNull(),
  productType: text("productType").notNull(),
  updated: timestamp("updated").defaultNow(),
  productID: serial("productID")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
});

export const variantImages = pgTable("variantImages", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  size: real("size").notNull(),
  name: text("name").notNull(),
  order: real("order").notNull(),
  variantID: serial("variantID")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
});

export const variantTags = pgTable("variantTags", {
  id: serial("id").primaryKey(),
  tag: text("tag").notNull(),

  variantID: serial("variantID")
    .notNull()
    .references(() => productVariants.id, { onDelete: "cascade" }),
});

export const productRelations = relations(products, ({ many }) => ({
  productVariants: many(productVariants, { relationName: "productVariants" }),
  reviews: many(reviews, { relationName: "reviews" }),
}));

export const productVariantsRelations = relations(
  productVariants,
  ({ many, one }) => ({
    product: one(products, {
      fields: [productVariants.productID],
      references: [products.id],
      relationName: "productVariants",
    }),
    variantImages: many(variantImages, { relationName: "variantImages" }),
    variantTags: many(variantTags, { relationName: "variantTags" }),
  })
);

export const variantImagesRelations = relations(variantImages, ({ one }) => ({
  productVariants: one(productVariants, {
    fields: [variantImages.variantID],
    references: [productVariants.id],
    relationName: "variantImages",
  }),
}));

export const variantTagsRelations = relations(variantTags, ({ one }) => ({
  productVariants: one(productVariants, {
    fields: [variantTags.variantID],
    references: [productVariants.id],
    relationName: "variantTags",
  }),
}));

export type Products = InferSelectModel<typeof products>;

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    rating: real("rating").notNull(),
    userID: text("userID")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productID: serial("productID")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    comment: text("comment").notNull(),
    created: timestamp("created").defaultNow(),
  },
  (table) => {
    return {
      productIdx: index("productIdx").on(table.productID),
      userIdx: index("userIdx").on(table.userID),
    };
  }
);

export const reviewRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userID],
    references: [users.id],
    relationName: "user_reviews",
  }),
  product: one(products, {
    fields: [reviews.productID],
    references: [products.id],
    relationName: "reviews",
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  reviews: many(reviews, { relationName: "user_reviews" }),
  // orders: many(orders, { relationName: "user_orders" }),
}));
