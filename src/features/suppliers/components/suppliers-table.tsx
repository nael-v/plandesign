"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { SectionHeader } from "@/components/shared/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSuppliers } from "@/services/suppliers.service";
import { SupplierFormDialog } from "@/features/suppliers/components/supplier-form-dialog";
import type { SupplierCategory, SupplierListQuery, SupplierSummary } from "@/features/suppliers/types";
import { localizedValue, localizeSupplierCategory } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

export function SuppliersTable() {
  const { locale } = useLocale();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<SupplierCategory | undefined>();
  const [minRating, setMinRating] = useState<number | undefined>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierSummary | null>(null);

  const query: SupplierListQuery = useMemo(() => ({
    page,
    pageSize,
    search: search || undefined,
    category,
    minRating,
  }), [page, pageSize, search, category, minRating]);

  const suppliersQuery = useQuery({
    queryKey: ["suppliers", query],
    queryFn: () => listSuppliers(query),
    staleTime: 1000 * 60,
  });

  if (suppliersQuery.isError) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <EmptyState title={localizedValue(locale, { en: "Error loading suppliers", he: "שגיאה בטעינת ספקים" })} description={localizedValue(locale, { en: "Failed to load suppliers list.", he: "טעינת רשימת הספקים נכשלה." })} />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="Suppliers"
        title={localizedValue(locale, { en: "Procurement operations", he: "תפעול רכש" })}
        description={localizedValue(locale, { en: "Manage supplier performance, project assignments, and procurement request lifecycles.", he: "נהל ביצועי ספקים, שיוכי פרויקטים ומחזורי בקשות רכש." })}
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {localizedValue(locale, { en: "New supplier", he: "ספק חדש" })}
          </Button>
        }
      />

      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface/30 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={localizedValue(locale, { en: "Search suppliers, cities, or contacts", he: "חפש ספקים, ערים או אנשי קשר" })}
            className="pl-10"
          />
        </div>

        <select
          value={category || ""}
          onChange={(e) => {
            setCategory((e.target.value as SupplierCategory) || undefined);
            setPage(1);
          }}
          className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
        >
          <option value="">{localizedValue(locale, { en: "All categories", he: "כל הקטגוריות" })}</option>
          <option value="electrical">{localizedValue(locale, { en: "Electrical", he: "חשמל" })}</option>
          <option value="furniture">{localizedValue(locale, { en: "Furniture", he: "ריהוט" })}</option>
          <option value="materials">{localizedValue(locale, { en: "Materials", he: "חומרים" })}</option>
          <option value="plumbing">{localizedValue(locale, { en: "Plumbing", he: "אינסטלציה" })}</option>
          <option value="contractors">{localizedValue(locale, { en: "Contractors", he: "קבלנים" })}</option>
        </select>

        <select
          value={minRating ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            setMinRating(value ? Number(value) : undefined);
            setPage(1);
          }}
          className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
        >
          <option value="">{localizedValue(locale, { en: "Any rating", he: "כל דירוג" })}</option>
          <option value="2">2.0+</option>
          <option value="3">3.0+</option>
          <option value="4">4.0+</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{localizedValue(locale, { en: "Supplier", he: "ספק" })}</TableHead>
              <TableHead>{localizedValue(locale, { en: "Category", he: "קטגוריה" })}</TableHead>
              <TableHead>{localizedValue(locale, { en: "Contact", he: "איש קשר" })}</TableHead>
              <TableHead className="text-right">{localizedValue(locale, { en: "Reliability", he: "אמינות" })}</TableHead>
              <TableHead className="text-right">{localizedValue(locale, { en: "Active requests", he: "בקשות פעילות" })}</TableHead>
              <TableHead className="text-right">{localizedValue(locale, { en: "Projects", he: "פרויקטים" })}</TableHead>
              <TableHead className="w-36 text-right">{localizedValue(locale, { en: "Actions", he: "פעולות" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliersQuery.isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, idx) => (
                    <TableCell key={idx}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
              : suppliersQuery.data?.items.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28">
                      <EmptyState title={localizedValue(locale, { en: "No suppliers found", he: "לא נמצאו ספקים" })} description={localizedValue(locale, { en: "Add suppliers to start procurement tracking.", he: "הוסף ספקים כדי להתחיל לעקוב אחר הרכש." })} />
                    </TableCell>
                  </TableRow>
                )
                : suppliersQuery.data?.items.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <button
                        type="button"
                        className="text-left"
                        onClick={() => router.push(`/suppliers/${supplier.id}`)}
                      >
                        <p className="font-medium text-foreground">{supplier.name}</p>
                        <p className="text-xs text-muted">{supplier.city || "-"}</p>
                      </button>
                    </TableCell>
                    <TableCell>{localizeSupplierCategory(locale, supplier.category)}</TableCell>
                    <TableCell>
                      <p className="text-sm">{supplier.email || "-"}</p>
                      <p className="text-xs text-muted">{supplier.phone || "-"}</p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{supplier.reliabilityRating.toFixed(1)}</TableCell>
                    <TableCell className="text-right tabular-nums">{supplier.activeRequests}</TableCell>
                    <TableCell className="text-right tabular-nums">{supplier.totalProjects}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/suppliers/${supplier.id}`)}>
                          {localizedValue(locale, { en: "Open", he: "פתח" })}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(supplier)}>
                          {localizedValue(locale, { en: "Edit", he: "ערוך" })}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {suppliersQuery.data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={suppliersQuery.data.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}

      <SupplierFormDialog open={createOpen} onOpenChange={setCreateOpen} mode="create" />
      <SupplierFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => { if (!open) setEditing(null); }}
        mode="edit"
        initialSupplier={editing || undefined}
      />
    </main>
  );
}
