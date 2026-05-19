import type { UserRole } from "./roles";

export type PermissionKey =
  | "dashboard.read"
  | "clients.read"
  | "projects.read"
  | "finances.read"
  | "suppliers.read"
  | "ai.read";

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: ["dashboard.read", "clients.read", "projects.read", "finances.read", "suppliers.read", "ai.read"],
  architect: ["dashboard.read", "clients.read", "projects.read", "suppliers.read", "ai.read"],
  interior_designer: ["dashboard.read", "clients.read", "projects.read", "suppliers.read", "ai.read"],
  employee: ["dashboard.read", "clients.read", "projects.read", "suppliers.read"],
  client: ["dashboard.read", "clients.read", "projects.read"],
};