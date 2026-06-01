import { Trans } from "@lingui/react/macro";

import { setAppLanguage } from "@modular-vsa/i18n/i18n";
import { logger } from "@modular-vsa/shared/common/logger";
import { Button } from "@modular-vsa/ui/button";
import { toast } from "@modular-vsa/ui/sonner";
import { ThemeToggle } from "@modular-vsa/ui/theme";

import { useGetAllPostsQuery } from "../api/query";

export function HomePage() {
  const { data } = useGetAllPostsQuery();
  logger.info("HomePage data", data);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">
            <Trans>API Status</Trans>
          </h2>
          <Button onClick={() => toast("hello")}>
            <Trans>Check</Trans>
          </Button>
          <ThemeToggle />
          <Button onClick={() => setAppLanguage("bn")}>
            <Trans>Language change</Trans>
          </Button>
        </section>
      </div>
    </div>
  );
}
