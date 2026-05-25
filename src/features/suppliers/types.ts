export type SupplierCategory = "electrical" | "furniture" | "materials" | "plumbing" | "contractors";

export type ProcurementStatus = "requested" | "approved" | "rejected" | "ordered" | "delivered";

export type ProjectPhase = "discovery" | "design" | "approval" | "execution" | "handover";

export interface SupplierSummary {
  id: string;
  name: string;
  category: SupplierCategory;
  email?: string;
  phone?: string;
  city?: string;
  reliabilityRating: number;
  totalProjects: number;
  totalRequests: number;
  activeRequests: number;
  createdAt: Date;
}

export interface SupplierListQuery {
  page: number;
  pageSize: number;
  search?: string;
  category?: SupplierCategory;
  minRating?: number;
}

export interface SupplierListResponse {
  items: SupplierSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SupplierProfile {
  id: string;
  name: string;
  category: SupplierCategory;
  email?: string;
  phone?: string;
  city?: string;
  notes?: string;
  reliabilityRating: number;
  performance: SupplierPerformanceOverview;
  relatedProjects: SupplierProjectLink[];
  requests: ProcurementRequest[];
  pricingHistory: SupplierPricingHistoryItem[];
  timeline: SupplierTimelineItem[];
}

export interface SupplierProjectLink {
  projectId: string;
  projectName: string;
  projectStage: ProjectPhase;
  assignedPhase: ProjectPhase;
  attachedAt: Date;
  notes?: string;
}

export interface ProcurementQuote {
  id: string;
  supplierLabel: string;
  amount: number;
  currency: string;
  etaDays?: number;
  notes?: string;
}

export interface ProcurementRequest {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  supplierId: string;
  supplierName: string;
  phase: ProjectPhase;
  status: ProcurementStatus;
  requestedBy: string;
  requestedAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  selectedQuoteId?: string;
  quotes: ProcurementQuote[];
  notes?: string;
}

export interface SupplierPricingHistoryItem {
  requestId: string;
  title: string;
  amount: number;
  currency: string;
  status: ProcurementStatus;
  occurredAt: Date;
}

export interface SupplierTimelineItem {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  kind: "project_link" | "request_created" | "request_updated";
}

export interface SupplierPerformanceOverview {
  reliabilityRating: number;
  deliveredRate: number;
  approvalRate: number;
  averageQuote: number;
}

export interface CreateSupplierInput {
  name: string;
  category: SupplierCategory;
  email?: string;
  phone?: string;
  city?: string;
  notes?: string;
}

export type UpdateSupplierInput = Partial<CreateSupplierInput>;

export interface LinkSupplierToProjectInput {
  supplierId: string;
  projectId: string;
  phase: ProjectPhase;
  notes?: string;
}

export interface CreatePurchaseRequestInput {
  supplierId: string;
  projectId: string;
  title: string;
  phase: ProjectPhase;
  requestedBy: string;
  notes?: string;
  quotes: Array<{
    supplierLabel: string;
    amount: number;
    currency: string;
    etaDays?: number;
    notes?: string;
  }>;
}

export interface UpdatePurchaseRequestStatusInput {
  requestId: string;
  status: ProcurementStatus;
  approvedBy?: string;
  selectedQuoteId?: string;
  notes?: string;
}