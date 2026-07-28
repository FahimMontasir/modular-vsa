import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

// import { t } from "@lingui/core/macro";
import { createApiClient } from "@modular-vsa/shared/web/api-client";
import { useUploadFileMutation } from "@modular-vsa/storage/web/hooks";
import { toast } from "@modular-vsa/ui/sonner";

import type { APIHomeType } from "../../server/controllers/routes";

const homeKeys = {
  root: ["home"],
  post: (pid: string) => ["home", "post", pid],
  comment: (pid: string) => ["home", "comment", pid],
} as const;

const apiClient = createApiClient<APIHomeType>();

async function getAllPosts() {
  const { data, error } = await apiClient.home.get();

  if (error) {
    toast.error("Failed to fetch posts");
    throw error;
  }

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

export function useUploadMutation() {
  return useUploadFileMutation(async (file) => {
    const { data, error } = await apiClient.home.upload.post({ file });

    if (error) throw error;
    return data!;
  });
}

export function useCreatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    async mutationFn(values: { title: string; content: string; published: boolean }) {
      const { data, error } = await apiClient.home.post(values);
      if (error) throw error;
      return data;
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: homeKeys.root });
      toast.success("Post created");
    },
    onError() {
      toast.error("Post could not be created");
    },
  });
}

export function useUpdatePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    async mutationFn(values: { id: number; published: boolean }) {
      const { data, error } = await apiClient.home({ id: values.id }).patch({
        published: values.published,
      });
      if (error) throw error;
      return data;
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: homeKeys.root });
      toast.success("Post updated");
    },
    onError() {
      toast.error("Post could not be updated");
    },
  });
}

export function useDeletePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    async mutationFn(id: number) {
      const { data, error } = await apiClient.home({ id }).delete();
      if (error) throw error;
      return data;
    },
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: homeKeys.root });
      toast.success("Post deleted");
    },
    onError() {
      toast.error("Post could not be deleted");
    },
  });
}
