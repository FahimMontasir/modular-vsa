import { db } from "@modular-vsa/db";
import { post } from "@modular-vsa/db/schema/home";

import { normalizeCreatePostValues, requireOne } from "../helpers/post";
import type { PostBody } from "../types";

export const createPost = async (postData: PostBody) => {
  const values = normalizeCreatePostValues(postData);

  const newPost = await db.insert(post).values(values).returning();

  return requireOne(newPost, "Failed to create post");
};
