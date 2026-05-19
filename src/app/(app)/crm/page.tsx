"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Pencil, Trash2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/shared/section-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { listClients } from "@/services/clients.service";
import { ClientListQuery, ClientProfile } from "@/features/crm/types";
import { ClientFormDialog } from "@/features/crm/components/client-form-dialog";
import { ClientDeleteDialog } from "@/features/crm/components/client-delete-dialog";
import { crmQueryKeys } from "@/features/crm/query-keys";

export default function CrmPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "prospect" | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | undefined>();

  const query: ClientListQuery = {
    page,
    pageSize,
    search: search || undefined,
    status,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: crmQueryKeys.clients(query),
    queryFn: () => listClients(query),
    staleTime: 1000 * 60 * 5,
  });

  const statusBadges: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    prospect: "bg-blue-50 text-blue-700",
    inactive: "bg-slate-50 text-slate-700",
  };

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <EmptyState title="Error loading clients" description="Failed to load the clients list" />
        <div className="mt-4 flex justify-center">
          <Button type="button" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="CRM"
        title="Client relationships"
        description="Run your complete client lifecycle with enterprise-grade workflows."
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create client
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface/30 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          value={status || ""}
          onChange={(e) => {
            const nextValue = e.target.value;
            setStatus(nextValue ? (nextValue as "active" | "inactive" | "prospect") : undefined);
            setPage(1);
          }}
          className="rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="prospect">Prospect</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Projects</TableHead>
              <TableHead className="text-right">Total spent</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32">
                  <EmptyState title="No clients yet" description="Create your first client to get started." />
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium text-foreground">{client.name}</TableCell>
                  <TableCell className="text-sm text-muted">{client.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusBadges[client.status]}`}>
                      {client.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">{client.projectCount}</TableCell>
                  <TableCell className="text-right text-sm font-medium">${client.totalSpent.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/crm/${client.id}`}>
                        <Button variant="ghost" size="sm">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClient({
                            id: client.id,
                            name: client.name,
                            email: client.email,
                            phone: client.phone,
                            status: client.status,
                            industry: client.industry,
                            website: client.website,
                            createdAt: client.createdAt,
                            updatedAt: client.updatedAt,
                          });
                          setEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClient({
                            id: client.id,
                            name: client.name,
                            email: client.email,
                            phone: client.phone,
                            status: client.status,
                            industry: client.industry,
                            website: client.website,
                            createdAt: client.createdAt,
                            updatedAt: client.updatedAt,
                          });
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <ClientFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" />
      <ClientFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initialClient={selectedClient}
      />
      <ClientDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        clientId={selectedClient?.id}
        clientName={selectedClient?.name}
      />
    </main>
  );
}