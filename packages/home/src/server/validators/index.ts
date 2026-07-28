import { createInsertSchema, createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";

import { post, comment } from "@modular-vsa/db/schema/home";

/** Base schemas derived from database table */
export const PostInsertSchema = createInsertSchema(post);
export const PostSelectSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  content: t.String(),
  published: t.Boolean(),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});
export const CommentInsertSchema = createInsertSchema(comment);
export const CommentSelectSchema = createSelectSchema(comment);

/** Home validation schemas */
export const HomeSchema = {
  /** Posts list schema */
  PostsList: t.Array(PostSelectSchema),

  /** Single post schema */
  Post: PostSelectSchema,

  /** Create post schema */
  CreatePost: t.Omit(PostInsertSchema, ["id", "createdAt", "updatedAt"]),

  /** Update post schema */
  UpdatePost: t.Partial(t.Omit(PostInsertSchema, ["id", "createdAt", "updatedAt"])),

  /** Post ID parameter schema */
  PostId: t.Object({
    id: t.Number(),
  }),

  /** Get posts query schema */
  GetPostsQuery: t.Partial(t.Pick(PostSelectSchema, ["title", "published"])),

  /** Delete post response schema */
  DeletePostResponse: t.Object({
    success: t.Boolean(),
    message: t.String(),
  }),

  /** Comment validation schemas */
  Comment: CommentSelectSchema,
  CreateComment: t.Omit(CommentInsertSchema, ["id", "createdAt", "updatedAt"]),
  UpdateComment: t.Partial(t.Omit(CommentInsertSchema, ["id", "createdAt", "updatedAt"])),
  CommentId: t.Object({
    id: t.Number(),
  }),
};
