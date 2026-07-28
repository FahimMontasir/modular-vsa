import { useLingui } from "@lingui/react/macro";
import { LinkIcon, RefreshCwIcon, UnlinkIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { PageContainer } from "@modular-vsa/shared/web/components/page-container";
import { SectionHeader } from "@modular-vsa/shared/web/components/section-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@modular-vsa/ui/alert-dialog";
import { Badge } from "@modular-vsa/ui/badge";
import { Button } from "@modular-vsa/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@modular-vsa/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@modular-vsa/ui/empty";
import { toast } from "@modular-vsa/ui/sonner";
import { Spinner } from "@modular-vsa/ui/spinner";

import { authClient } from "../client";

type Account = Awaited<ReturnType<typeof authClient.listAccounts>>[number];

export function AccountConnectionsPage() {
  const { t } = useLingui();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      setAccounts(await authClient.listAccounts());
    } catch {
      toast.error(t`Connected accounts could not be loaded`);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  return (
    <PageContainer>
      <SectionHeader
        kind="account"
        eyebrow={t`Account`}
        title={t`Connections`}
        description={t`Inspect credential and external accounts linked to your identity.`}
        badge={t`${accounts.length} connected`}
      />
      <Card>
        <CardHeader>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>{t`Connected accounts`}</CardTitle>
              <CardDescription>
                {t`OAuth linking becomes available here when a provider is configured on the server.`}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadAccounts()}
              disabled={loading}
            >
              {loading ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <RefreshCwIcon data-icon="inline-start" />
              )}
              {t`Refresh`}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {accounts.map((account) => (
            <article key={account.id} className="flex flex-col gap-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium capitalize">{account.providerId}</p>
                  <p className="truncate text-xs text-muted-foreground">{account.accountId}</p>
                </div>
                <Badge variant="secondary">
                  {account.providerId === "credential" ? t`Password` : t`External`}
                </Badge>
              </div>
              {account.providerId !== "credential" && accounts.length > 1 && (
                <AlertDialog>
                  <AlertDialogTrigger
                    render={<Button variant="outline" size="sm" className="self-start" />}
                  >
                    <UnlinkIcon data-icon="inline-start" />
                    {t`Unlink`}
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t`Unlink ${account.providerId}?`}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t`You will no longer be able to sign in through this provider.`}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t`Cancel`}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await authClient.unlinkAccount({
                            providerId: account.providerId,
                            accountId: account.accountId,
                          });
                          await loadAccounts();
                          toast.success(t`Account unlinked`);
                        }}
                      >
                        {t`Unlink account`}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </article>
          ))}
          {!loading && accounts.length === 0 && (
            <Empty className="md:col-span-2">
              <EmptyMedia variant="icon">
                <LinkIcon />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>{t`No connected accounts`}</EmptyTitle>
                <EmptyDescription>
                  {t`No credential or external provider accounts were returned.`}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
