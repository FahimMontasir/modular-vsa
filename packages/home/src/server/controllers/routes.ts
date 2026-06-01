import { secureAPI } from "@modular-vsa/auth/server/secure-api";
import { StorageRoutes } from "@modular-vsa/storage/server/routes";

import { ENDPOINTS_PATH } from "../helpers/path";
import { PostCreateRoutes } from "./create";
import { PostDeleteRoutes } from "./delete";
import { PostReadRoutes } from "./read";
import { PostUpdateRoutes } from "./update";

export const HomeRoutes = secureAPI({
  name: "Home",
  prefix: ENDPOINTS_PATH.prefix,
  detail: {
    tags: ["Home"],
    summary: "Home routes",
  },
})
  .use(PostCreateRoutes)
  .use(PostReadRoutes)
  .use(PostUpdateRoutes)
  .use(PostDeleteRoutes)
  .use(StorageRoutes);

export type APIHomeType = typeof HomeRoutes;
