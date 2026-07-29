import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "@modular-vsa/ui/toast";

export function useUploadFileMutation(
  uploadFn: (file: File) => Promise<{ key: string; url: string }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadFn,
    onSuccess: () => {
      toast.success("File uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["storage"] });
    },
    onError: () => {
      toast.error("Failed to upload file");
    },
  });
}
