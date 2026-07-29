import { secureAPI } from "@modular-vsa/auth/server/secure-api";

import { ENDPOINTS_PATH } from "../helpers/path";
import { CreateRoutes } from "./create";
import { DeleteRoutes } from "./delete";
import { ReadRoutes } from "./read";
import { UpdateRoutes } from "./update";

export const NotificationRoutes = secureAPI({
  name: "Notification",
  prefix: ENDPOINTS_PATH.prefix,
  detail: {
    tags: ["Notification"],
    summary: "Notification and messenger routes",
  },
})
  .use(CreateRoutes)
  .use(ReadRoutes)
  .use(UpdateRoutes)
  .use(DeleteRoutes);

export type APINotificationType = typeof NotificationRoutes;
