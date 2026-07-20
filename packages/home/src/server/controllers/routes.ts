import { secureAPI } from "@modular-vsa/auth/server/secure-api";
import { StorageRoutes } from "@modular-vsa/storage/server/routes";

import { ENDPOINTS_PATH } from "../helpers/path";
import { CreateRoutes } from "./create";
import { DeleteRoutes } from "./delete";
import { ReadRoutes } from "./read";
import { UpdateRoutes } from "./update";

export const HomeRoutes = secureAPI({
  name: "Home",
  prefix: ENDPOINTS_PATH.prefix,
  detail: {
    tags: ["Home"],
    summary: "Home routes",
  },
})
  .use(CreateRoutes)
  .use(ReadRoutes)
  .use(UpdateRoutes)
  .use(DeleteRoutes)
  .use(StorageRoutes);

export type APIHomeType = typeof HomeRoutes;
