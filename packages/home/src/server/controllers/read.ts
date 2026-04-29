import { StatusMap } from "elysia";

import { secureAPI } from "@modular-vsa/utils/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import { readPost } from "../services/read-post";
import { readPosts } from "../services/read-posts";
import { HomeSchema } from "../validators";

export const PostReadRoutes = secureAPI()
  .get(
    ENDPOINTS_PATH.root,
    async ({ query }) => {
      return await readPosts(query);
    },
    {
      authenticate: true,
      query: HomeSchema.GetPostsQuery,
      response: {
        [StatusMap.OK]: HomeSchema.PostsList,
      },
      detail: {
        summary: "Read posts",
        description: "Get all posts, optionally filtered by title or published status",
      },
    }
  )
  .get(
    ENDPOINTS_PATH.byId,
    async ({ params }) => {
      return await readPost(params.id);
    },
    {
      authenticate: true,
      params: HomeSchema.PostId,
      response: {
        [StatusMap.OK]: HomeSchema.Post,
      },
      detail: {
        summary: "Read post by id",
        description: "Get a single post by its identifier",
      },
    }
  );
