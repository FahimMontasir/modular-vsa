import { relations } from "drizzle-orm";
import { pgTable, varchar, timestamp, boolean, index, integer } from "drizzle-orm/pg-core";

export const post = pgTable(
  "post",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    title: varchar("title", { length: 200 }).notNull(),
    content: varchar("content", { length: 5000 }).notNull(),
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("post_title_idx").on(table.title)]
);

export const comment = pgTable(
  "comment",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("post_id")
      .notNull()
      .references(() => post.id, { onDelete: "cascade" }),
    content: varchar("content", { length: 2000 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("comment_postId_idx").on(table.postId)]
);

export const postRelations = relations(post, ({ many }) => ({
  comments: many(comment),
}));

export const commentRelations = relations(comment, ({ one }) => ({
  post: one(post, {
    fields: [comment.postId],
    references: [post.id],
  }),
}));
