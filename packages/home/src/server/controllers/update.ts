import { StatusMap } from "elysia";

import { secureAPI } from "@modular-vsa/utils/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import { updatePost } from "../services/update-post";
import { HomeSchema } from "../validators";

export const PostUpdateRoutes = secureAPI().patch(
  ENDPOINTS_PATH.byId,
  async ({ params, body }) => {
    return await updatePost(params.id, body);
  },
  {
    authenticate: true,
    params: HomeSchema.PostId,
    body: HomeSchema.UpdatePost,
    response: {
      [StatusMap.OK]: HomeSchema.Post,
    },
    detail: {
      summary: "Update a post",
      description: "Update a post by its identifier",
    },
  }
);
