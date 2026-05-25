"use server";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  CreatePurchaseRequestInput,
  CreateSupplierInput,
  LinkSupplierToProjectInput,
  ProcurementRequest,
  ProjectPhase,
  SupplierListQuery,
  SupplierListResponse,
  SupplierPerformanceOverview,
  SupplierPricingHistoryItem,
  SupplierProfile,
  SupplierProjectLink,
  SupplierSummary,
  UpdatePurchaseRequestStatusInput,
  UpdateSupplierInput,
} from "@/features/suppliers/types";

function toPerformanceOverview(requests: ProcurementRequest[]): SupplierPerformanceOverview {
  if (requests.length === 0) {
    return {
      reliabilityRating: 0,
      deliveredRate: 0,
      approvalRate: 0,
      averageQuote: 0,
    };
  }

  const approved = requests.filter((r) => ["approved", "ordered", "delivered"].includes(r.status)).length;
  const delivered = requests.filter((r) => r.status === "delivered").length;

  const selectedAmounts = requests
    .map((r) => {
      const selected = r.quotes.find((q) => q.id === r.selectedQuoteId) || r.quotes[0];
      return selected?.amount;
    })
    .filter((v): v is number => typeof v === "number");

  const averageQuote =
    selectedAmounts.length > 0
      ? selectedAmounts.reduce((sum, amount) => sum + amount, 0) / selectedAmounts.length
      : 0;

  const approvalRate = Math.round((approved / requests.length) * 100);
  const deliveredRate = Math.round((delivered / requests.length) * 100);
  const reliabilityRating = Math.min(5, Math.max(1, Number(((approvalRate * 0.45 + deliveredRate * 0.55) / 20).toFixed(1))));

  return {
    reliabilityRating,
    deliveredRate,
    approvalRate,
    averageQuote,
  };
}

function mapRequest(row: {
  id: string;
  title: string;
  phase: string;
  status: string;
  requestedBy: string;
  requestedAt: Date;
  approvedBy: string | null;
  approvedAt: Date | null;
  selectedQuoteId: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  supplierId: string;
  supplier: { name: string };
  projectId: string;
  project: { name: string };
  quotes: Array<{
    id: string;
    supplierLabel: string;
    amount: Prisma.Decimal;
    currency: string;
    etaDays: number | null;
    notes: string | null;
  }>;
}): ProcurementRequest {
  return {
    id: row.id,
    title: row.title,
    projectId: row.projectId,
    projectName: row.project.name,
    supplierId: row.supplierId,
    supplierName: row.supplier.name,
    phase: row.phase as ProjectPhase,
    status: row.status as ProcurementRequest["status"],
    requestedBy: row.requestedBy,
    requestedAt: row.requestedAt,
    updatedAt: row.updatedAt,
    approvedBy: row.approvedBy || undefined,
    approvedAt: row.approvedAt || undefined,
    selectedQuoteId: row.selectedQuoteId || undefined,
    quotes: row.quotes.map((quote) => ({
      id: quote.id,
      supplierLabel: quote.supplierLabel,
      amount: Number(quote.amount),
      currency: quote.currency,
      etaDays: quote.etaDays || undefined,
      notes: quote.notes || undefined,
    })),
    notes: row.notes || undefined,
  };
}

function toSupplierSummary(
  row: {
    id: string;
    name: string;
    category: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    createdAt: Date;
    projects: Array<{ projectId: string }>;
  },
  requests: ProcurementRequest[],
): SupplierSummary {
  const performance = toPerformanceOverview(requests);
  return {
    id: row.id,
    name: row.name,
    category: row.category as SupplierSummary["category"],
    email: row.email || undefined,
    phone: row.phone || undefined,
    city: row.city || undefined,
    reliabilityRating: performance.reliabilityRating,
    totalProjects: row.projects.length,
    totalRequests: requests.length,
    activeRequests: requests.filter((r) => ["requested", "approved", "ordered"].includes(r.status)).length,
    createdAt: row.createdAt,
  };
}

export async function listSuppliers(query: SupplierListQuery): Promise<SupplierListResponse> {
  const { page, pageSize, search, category, minRating } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.SupplierWhereInput = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { city: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await Promise.all([
    db.supplier.count({ where }),
    db.supplier.findMany({
      where,
      include: {
        projects: { select: { projectId: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ]);

  const requests = await db.procurementRequest.findMany({
    where: { supplierId: { in: rows.map((row) => row.id) } },
    include: {
      supplier: { select: { name: true } },
      project: { select: { name: true } },
      quotes: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const requestsBySupplier = new Map<string, ProcurementRequest[]>();
  requests.forEach((request) => {
    const mapped = mapRequest(request);
    const existing = requestsBySupplier.get(mapped.supplierId) || [];
    existing.push(mapped);
    requestsBySupplier.set(mapped.supplierId, existing);
  });

  const items = rows
    .map((row) => toSupplierSummary(row, requestsBySupplier.get(row.id) || []))
    .filter((item) => (typeof minRating === "number" ? item.reliabilityRating >= minRating : true));

  return { items, total, page, pageSize };
}

export async function getSupplierProfile(supplierId: string): Promise<SupplierProfile | null> {
  const [supplier, requests] = await Promise.all([
    db.supplier.findUnique({
      where: { id: supplierId },
      include: {
        projects: {
          include: {
            project: {
              select: { id: true, name: true, stage: true },
            },
          },
          orderBy: { attachedAt: "desc" },
        },
      },
    }),
    db.procurementRequest.findMany({
      where: { supplierId },
      include: {
        supplier: { select: { name: true } },
        project: { select: { name: true } },
        quotes: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  if (!supplier) return null;

  const mappedRequests = requests.map(mapRequest);
  const performance = toPerformanceOverview(mappedRequests);

  const relatedProjects: SupplierProjectLink[] = supplier.projects.map((link) => ({
    projectId: link.projectId,
    projectName: link.project.name,
    projectStage: link.project.stage as ProjectPhase,
    assignedPhase: link.assignedPhase as ProjectPhase,
    attachedAt: link.attachedAt,
    notes: link.notes || undefined,
  }));

  const pricingHistory: SupplierPricingHistoryItem[] = mappedRequests
    .map((request) => {
      const selected = request.quotes.find((q) => q.id === request.selectedQuoteId) || request.quotes[0];
      if (!selected) return null;
      return {
        requestId: request.id,
        title: request.title,
        amount: selected.amount,
        currency: selected.currency,
        status: request.status,
        occurredAt: request.updatedAt,
      };
    })
    .filter((row): row is SupplierPricingHistoryItem => Boolean(row));

  const timeline: SupplierProfile["timeline"] = [
    ...relatedProjects.map((project) => ({
      id: `${project.projectId}-link`,
      title: `Linked to ${project.projectName}`,
      description: `Assigned for ${project.assignedPhase.replace("_", " ")} phase`,
      timestamp: project.attachedAt,
      kind: "project_link" as const,
    })),
    ...mappedRequests.map((request) => ({
      id: request.id,
      title: `Request: ${request.title}`,
      description: `${request.status.toUpperCase()} · ${request.projectName}`,
      timestamp: request.updatedAt,
      kind: "request_updated" as const,
    })),
  ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return {
    id: supplier.id,
    name: supplier.name,
    category: supplier.category as SupplierProfile["category"],
    email: supplier.email || undefined,
    phone: supplier.phone || undefined,
    city: supplier.city || undefined,
    notes: supplier.notes || undefined,
    reliabilityRating: performance.reliabilityRating,
    performance,
    relatedProjects,
    requests: mappedRequests,
    pricingHistory,
    timeline,
  };
}

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierSummary> {
  const created = await db.supplier.create({
    data: {
      name: input.name,
      category: input.category,
      email: input.email || null,
      phone: input.phone || null,
      city: input.city || null,
      notes: input.notes || null,
    },
    include: {
      projects: { select: { projectId: true } },
    },
  });

  return toSupplierSummary(created, []);
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<SupplierSummary> {
  const updated = await db.supplier.update({
    where: { id },
    data: {
      name: input.name,
      category: input.category,
      email: input.email === undefined ? undefined : input.email || null,
      phone: input.phone === undefined ? undefined : input.phone || null,
      city: input.city === undefined ? undefined : input.city || null,
      notes: input.notes === undefined ? undefined : input.notes || null,
    },
    include: {
      projects: { select: { projectId: true } },
    },
  });

  return toSupplierSummary(updated, []);
}

export async function listProjectsForSupplierAssignments() {
  const projects = await db.project.findMany({
    where: { status: { in: ["active", "planning", "on_hold"] } },
    select: { id: true, name: true, stage: true },
    orderBy: { updatedAt: "desc" },
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    stage: project.stage as ProjectPhase,
  }));
}

export async function linkSupplierToProject(input: LinkSupplierToProjectInput) {
  const link = await db.projectSupplier.upsert({
    where: {
      projectId_supplierId: {
        projectId: input.projectId,
        supplierId: input.supplierId,
      },
    },
    update: {
      assignedPhase: input.phase,
      notes: input.notes,
    },
    create: {
      projectId: input.projectId,
      supplierId: input.supplierId,
      assignedPhase: input.phase,
      notes: input.notes,
    },
  });

  return link;
}

export async function createPurchaseRequest(input: CreatePurchaseRequestInput): Promise<ProcurementRequest> {
  const created = await db.procurementRequest.create({
    data: {
      title: input.title,
      phase: input.phase,
      status: "requested",
      requestedBy: input.requestedBy,
      notes: input.notes,
      supplierId: input.supplierId,
      projectId: input.projectId,
      quotes: {
        create: input.quotes.map((quote) => ({
          supplierLabel: quote.supplierLabel,
          amount: quote.amount,
          currency: quote.currency,
          etaDays: quote.etaDays,
          notes: quote.notes,
        })),
      },
    },
    include: {
      supplier: { select: { name: true } },
      project: { select: { name: true } },
      quotes: true,
    },
  });

  return mapRequest(created);
}

export async function updatePurchaseRequestStatus(input: UpdatePurchaseRequestStatusInput): Promise<ProcurementRequest> {
  const updated = await db.procurementRequest.update({
    where: { id: input.requestId },
    data: {
      status: input.status,
      approvedBy: input.approvedBy,
      approvedAt: input.status === "approved" ? new Date() : undefined,
      selectedQuoteId: input.selectedQuoteId,
      notes: input.notes,
    },
    include: {
      supplier: { select: { name: true } },
      project: { select: { name: true } },
      quotes: true,
    },
  });

  return mapRequest(updated);
}
