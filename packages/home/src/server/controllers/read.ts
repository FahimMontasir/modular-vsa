import { StatusMap } from "elysia";

import { applicationActions } from "@modular-vsa/auth/access-control";
import { secureAPI } from "@modular-vsa/auth/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import { readPost } from "../services/read-post";
import { readPosts } from "../services/read-posts";
import { HomeSchema } from "../validators";

export const ReadRoutes = secureAPI()
  .get(
    ENDPOINTS_PATH.root,
    async ({ query }) => {
      return await readPosts(query);
    },
    {
      authorize: { post: [applicationActions.post.read] },
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
      authorize: { post: [applicationActions.post.read] },
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
