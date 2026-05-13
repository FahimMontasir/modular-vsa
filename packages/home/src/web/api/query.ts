import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

// import { t } from "@lingui/core/macro";
import { createApiClient } from "@modular-vsa/shared/web/api-client";

import type { APIHomeType } from "../../server/controllers/routes";

const homeKeys = {
  root: ["home"],
  post: (pid: string) => ["home", "post", pid],
  comment: (pid: string) => ["home", "comment", pid],
} as const;

const apiClient = createApiClient<APIHomeType>();

async function getAllPosts() {
  const { data, error } = await apiClient.home.get();

  if (error) throw error;

  if (!data) throw new Error("No posts found");

  return data;
}
export type AllPost = Awaited<ReturnType<typeof getAllPosts>>;

function getAllPostsQueryOptions() {
  return queryOptions({
    queryKey: homeKeys.root,
    queryFn: getAllPosts,
    // meta: { errorMessage: t`User not found` },
  });
}

export function useGetAllPostsQuery() {
  return useSuspenseQuery(getAllPostsQueryOptions());
}
