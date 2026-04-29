import { eq } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import { post } from "@modular-vsa/db/schema/home";
import { ApiError } from "@modular-vsa/utils/server/apiError";

export const deletePost = async (postId: number) => {
  const rows = await db.delete(post).where(eq(post.id, postId)).returning({ id: post.id });

  if (rows.length === 0) {
    throw new ApiError("Not Found", "Post not found");
  }

  return {
    success: true,
    message: "Post deleted successfully",
  };
};
