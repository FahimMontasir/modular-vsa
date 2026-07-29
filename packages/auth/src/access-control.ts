import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const applicationActions = {
  post: {
    read: "read",
    create: "create",
    update: "update",
    delete: "delete",
  },
  storage: {
    upload: "upload",
  },
  notification: {
    read: "read",
    send: "send",
    delete: "delete",
    announce: "announce",
  },
} as const;

export const accessControlStatement = {
  ...defaultStatements,
  post: Object.values(applicationActions.post),
  storage: Object.values(applicationActions.storage),
  notification: Object.values(applicationActions.notification),
} as const;

export const ac = createAccessControl(accessControlStatement);

export const admin = ac.newRole({
  ...adminAc.statements,
  post: [...accessControlStatement.post],
  storage: [...accessControlStatement.storage],
  notification: [...accessControlStatement.notification],
});

export const director = ac.newRole({
  user: ["list", "get"],
  session: ["list"],
  post: [applicationActions.post.read],
  notification: [
    applicationActions.notification.read,
    applicationActions.notification.send,
    applicationActions.notification.delete,
  ],
});

export const roles = { admin, director } as const;
export const roleNames = ["admin", "director"] as const;

export type RoleName = (typeof roleNames)[number];
export type AccessControlResource = keyof typeof accessControlStatement;
export type AccessControlPermissions = {
  [Resource in AccessControlResource]?: (typeof accessControlStatement)[Resource][number][];
};

export function isRoleName(role: string): role is RoleName {
  return roleNames.includes(role as RoleName);
}

export function roleHasPermission(role: string, permissions: AccessControlPermissions) {
  return role
    .split(",")
    .some((roleName) =>
      isRoleName(roleName) ? roles[roleName].authorize(permissions).success : false
    );
}
