import { eq } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import { post } from "@modular-vsa/db/schema/home";
import { ApiError } from "@modular-vsa/utils/server/apiError";

export const readPost = async (postId: number) => {
  const rows = await db.select().from(post).where(eq(post.id, postId)).limit(1);

  if (!rows.length || !rows[0]) {
    throw new ApiError("Not Found", "Post not found");
  }

  return rows[0];
};
