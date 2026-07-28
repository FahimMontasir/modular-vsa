import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginPage } from "@modular-vsa/auth/pages/login-page";

function sanitizeRedirect(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";
}

export const Route = createFileRoute("/login")({
  validateSearch: (search) => ({ redirect: sanitizeRedirect(search.redirect) }),
  beforeLoad: ({ context, search }) => {
    if (context.auth.session) throw redirect({ to: search.redirect });
  },
  component: LoginRoute,
});

function LoginRoute() {
  const search = Route.useSearch();
  return <LoginPage redirectTo={search.redirect} />;
}
