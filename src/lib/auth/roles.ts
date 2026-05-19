export const USER_ROLES = ["admin", "architect", "interior_designer", "employee", "client"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  architect: "Architect",
  interior_designer: "Interior Designer",
  employee: "Employee",
  client: "Client",
};