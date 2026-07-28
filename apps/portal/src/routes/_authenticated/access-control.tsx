import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/access-control")({
  beforeLoad: ({ context }) => {
    if (!context.auth.hasPermission({ user: ["list"] })) {
      throw new Error("User listing permission required");
    }
  },
  component: Outlet,
});
