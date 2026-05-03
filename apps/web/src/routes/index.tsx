import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@modular-vsa/home/pages/home-page";

export const Route = createFileRoute("/")({
  component: HomePage,
});
