import { eq, or } from "drizzle-orm";

import { db } from "@modular-vsa/db";
import { user } from "@modular-vsa/db/schema/auth";
import { env } from "@modular-vsa/env/server";
import { logger } from "@modular-vsa/shared/common/logger";

import { appInstance } from ".";
import { ensureBootstrapAdminWith } from "./bootstrap-admin-core";

export async function ensureBootstrapAdmin() {
  const result = await ensureBootstrapAdminWith(
    {
      async findCandidates(identity) {
        return await db
          .select()
          .from(user)
          .where(or(eq(user.email, identity.email), eq(user.username, identity.username)))
          .limit(2);
      },
      async createAdmin(input) {
        const result = await appInstance.api.createUser({
          body: {
            name: input.name,
            email: input.email,
            password: input.password,
            role: "admin",
            data: {
              username: input.username,
              displayUsername: input.displayUsername,
            },
          },
        });
        return {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          emailVerified: result.user.emailVerified,
          image: result.user.image ?? null,
          username: input.username,
          displayUsername: input.displayUsername,
          role: result.user.role ?? "admin",
          banned: result.user.banned ?? false,
          banReason: result.user.banReason ?? null,
          banExpires: result.user.banExpires ?? null,
          createdAt: result.user.createdAt,
          updatedAt: result.user.updatedAt,
        };
      },
    },
    {
      name: env.BOOTSTRAP_ADMIN_NAME,
      email: env.BOOTSTRAP_ADMIN_EMAIL,
      username: env.BOOTSTRAP_ADMIN_USERNAME,
      displayUsername: env.BOOTSTRAP_ADMIN_USERNAME,
      password: env.BOOTSTRAP_ADMIN_PASSWORD,
    }
  );

  if (result.created) logger.info("[Auth] Bootstrap administrator created");
  else if (result.raced) {
    logger.info("[Auth] Bootstrap administrator created by another server instance");
  } else logger.info("[Auth] Bootstrap administrator already exists");

  return result.candidate;
}
