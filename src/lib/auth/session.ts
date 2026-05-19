import { auth } from "@/auth";
import type { UserRole } from "./roles";
import { ROLE_PERMISSIONS, type PermissionKey } from "./permissions";

/**
 * Returns the current session or null. Safe to call in any Server Component.
 */
export async function getSession() {
  return auth();
}

/**
 * Returns the session or throws if the user is not authenticated.
 * Use in Server Actions and API Route Handlers.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Requires the user to have a specific role.
 */
export async function requireRole(role: UserRole) {
  const session = await requireAuth();
  if (session.user.role !== role) {
    throw new Error("Forbidden");
  }
  return session;
}

/**
 * Returns true when the given role has the requested permission.
 */
export function hasPermission(
  role: UserRole,
  permission: PermissionKey,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
