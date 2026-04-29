import { eq } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import { post } from "@modular-vsa/db/schema/home";
import { ApiError } from "@modular-vsa/utils/server/apiError";

import { normalizeUpdatePostValues, requirePayload } from "../helpers/post";
import type { UpdatePostBody } from "../types";

export const updatePost = async (postId: number, postData: UpdatePostBody) => {
  const values = requirePayload(normalizeUpdatePostValues(postData), "No update fields provided");
  const rows = await db.update(post).set(values).where(eq(post.id, postId)).returning();

  if (!rows.length || !rows[0]) {
    throw new ApiError("Not Found", "Post not found");
  }

  return rows[0];
};
