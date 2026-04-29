import type { post, comment } from "@modular-vsa/db/schema/home";

import type { HomeSchema } from "./validators/index";

/** Common type definitions */
export type Post = typeof post.$inferSelect;
export type Comment = typeof comment.$inferSelect;

/** Validation schema types */
export type PostBody = typeof HomeSchema.CreatePost.static;
export type UpdatePostBody = typeof HomeSchema.UpdatePost.static;
export type CommentBody = typeof HomeSchema.CreateComment.static;
export type UpdateCommentBody = typeof HomeSchema.UpdateComment.static;

/** Route parameter types */
export type PostIdParam = typeof HomeSchema.PostId.static;
export type CommentIdParam = typeof HomeSchema.CommentId.static;
export type GetPostsQuery = typeof HomeSchema.GetPostsQuery.static;
