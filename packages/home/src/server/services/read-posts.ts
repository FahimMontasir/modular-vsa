import { and, desc, eq, ilike } from "drizzle-orm";
import type { SQL } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import { post } from "@modular-vsa/db/schema/home";

import { normalizePostListQuery } from "../helpers/post";
import type { GetPostsQuery } from "../types";

export const readPosts = async (query: GetPostsQuery) => {
  const normalized = normalizePostListQuery(query);
  const filters: SQL[] = [];

  if (normalized.title) {
    filters.push(ilike(post.title, `%${normalized.title}%`));
  }

  if (typeof normalized.published === "boolean") {
    filters.push(eq(post.published, normalized.published));
  }

  const baseQuery = db.select().from(post);

  if (filters.length === 0) {
    return await baseQuery.orderBy(desc(post.createdAt));
  }

  return await baseQuery.where(and(...filters)).orderBy(desc(post.createdAt));
};
