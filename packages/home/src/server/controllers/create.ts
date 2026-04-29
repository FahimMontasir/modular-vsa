import { StatusMap } from "elysia";

import { secureAPI } from "@modular-vsa/utils/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import { createPost } from "../services/create-post";
import { HomeSchema } from "../validators";

export const PostCreateRoutes = secureAPI().post(
  ENDPOINTS_PATH.root,
  async ({ body }) => {
    return await createPost(body);
  },
  {
    authenticate: true,
    body: HomeSchema.CreatePost,
    response: {
      [StatusMap.Created]: HomeSchema.Post,
    },
    detail: {
      summary: "Create a new post",
      description: "Add a new post to the system",
    },
  }
);
