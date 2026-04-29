import { StatusMap } from "elysia";

import { secureAPI } from "@modular-vsa/utils/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import { deletePost } from "../services/delete-post";
import { HomeSchema } from "../validators";

export const PostDeleteRoutes = secureAPI().delete(
  ENDPOINTS_PATH.byId,
  async ({ params }) => {
    return await deletePost(params.id);
  },
  {
    authenticate: true,
    params: HomeSchema.PostId,
    response: {
      [StatusMap.OK]: HomeSchema.DeletePostResponse,
    },
    detail: {
      summary: "Delete a post",
      description: "Delete a post by its identifier",
    },
  }
);
