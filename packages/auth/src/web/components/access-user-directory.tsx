"use no memo";

import { useLingui } from "@lingui/react/macro";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { RefreshCwIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useMemo } from "react";

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
import { Field, FieldLabel } from "@modular-vsa/ui/field";
import { Input } from "@modular-vsa/ui/input";
import { NativeSelect, NativeSelectOption } from "@modular-vsa/ui/native-select";
import { Spinner } from "@modular-vsa/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@modular-vsa/ui/table";

import { authClient } from "../client";

type UsersResponse = Awaited<ReturnType<typeof authClient.admin.listUsers>>;
export type ManagedUser = UsersResponse["users"][number] & {
  username?: string | null;
  displayUsername?: string | null;
};

type AccessUserDirectoryProps = {
  users: ManagedUser[];
  total: number;
  search: string;
  onSearchChange: (value: string) => void;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  selectedId?: string;
  onSelect: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
};

export function AccessUserDirectory({
  users,
  total,
  search,
  onSearchChange,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  selectedId,
  onSelect,
  loading,
  onRefresh,
}: AccessUserDirectoryProps) {
  const { t } = useLingui();
  const columns = useMemo<Array<ColumnDef<ManagedUser>>>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>
            {t`Name`}
          </Button>
        ),
        cell: ({ row }) => (
          <Button
            variant="ghost"
            className="h-auto max-w-64 justify-start px-0 text-left"
            aria-label={`${row.original.name} ${row.original.email}`}
            onClick={() => onSelect(row.original.id)}
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{row.original.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                @{row.original.displayUsername ?? row.original.username ?? t`not set`}
              </span>
            </span>
          </Button>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>
            {t`Email`}
          </Button>
        ),
      },
      {
        accessorKey: "role",
        header: t`Role`,
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={row.original.banned ? "destructive" : "secondary"}>
            {row.original.banned
              ? t`Banned`
              : row.original.role === "admin"
                ? t`Administrator`
                : t`Director`}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <Button variant="ghost" size="sm" onClick={column.getToggleSortingHandler()}>
            {t`Created`}
          </Button>
        ),
        cell: ({ getValue }) => new Date(getValue<Date>()).toLocaleDateString(),
      },
    ],
    [onSelect, t]
  );
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    rowCount: total,
    state: { pagination, sorting },
    onPaginationChange,
    onSortingChange,
    getRowId: (row) => row.id,
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <CardTitle>{t`User directory`}</CardTitle>
            <CardDescription>{t`${total} identities`}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Field className="min-w-0 sm:w-72">
              <FieldLabel className="sr-only" htmlFor="user-search">
                {t`Search users`}
              </FieldLabel>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="user-search"
                  value={search}
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={t`Search names`}
                  className="pl-8"
                />
              </div>
            </Field>
            <Button variant="outline" size="icon" onClick={onRefresh} disabled={loading}>
              {loading ? <Spinner /> : <RefreshCwIcon />}
              <span className="sr-only">{t`Refresh users`}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.original.id === selectedId ? "selected" : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!loading && users.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <UsersIcon />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{t`No users found`}</EmptyTitle>
              <EmptyDescription>{t`Change the search or create a managed user.`}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            {t`Page ${pagination.pageIndex + 1} of ${Math.max(table.getPageCount(), 1)}`}
          </p>
          <div className="flex items-center gap-2">
            <NativeSelect
              aria-label={t`Users per page`}
              value={String(pagination.pageSize)}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
            >
              {[10, 20, 50].map((size) => (
                <NativeSelectOption key={size} value={size}>
                  {size}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || loading}
            >
              {t`Previous`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || loading}
            >
              {t`Next`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
