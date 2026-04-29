import { ApiError } from "@modular-vsa/utils/server/apiError";

import type { GetPostsQuery, PostBody, UpdatePostBody } from "../types";

export function normalizeCreatePostValues(postData: PostBody) {
  return {
    title: postData.title.trim(),
    content: postData.content,
    published: postData.published ?? false,
  };
}

export function normalizeUpdatePostValues(postData: UpdatePostBody) {
  const values: Partial<Pick<PostBody, "title" | "content" | "published">> = {};

  if (postData.title !== undefined) {
    values.title = postData.title.trim();
  }

  if (postData.content !== undefined) {
    values.content = postData.content;
  }

  if (postData.published !== undefined) {
    values.published = postData.published;
  }

  return values;
}

export function normalizePostListQuery(query: GetPostsQuery) {
  return {
    title: query.title?.trim(),
    published: query.published,
  };
}

export function requireOne<T>(items: T[], message: string) {
  if (items.length === 0) {
    throw new ApiError("Not Found", message);
  }

  return items[0] as T;
}

export function requirePayload<T extends Record<string, unknown>>(payload: T, message: string) {
  if (Object.keys(payload).length === 0) {
    throw new ApiError("Bad Request", message);
  }

  return payload;
}
