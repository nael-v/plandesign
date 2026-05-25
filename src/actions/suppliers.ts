"use server";

import { z } from "zod";
import {
  createPurchaseRequest,
  createSupplier,
  linkSupplierToProject,
  updatePurchaseRequestStatus,
  updateSupplier,
} from "@/services/suppliers.service";
import {
  purchaseRequestSchema,
  purchaseRequestStatusSchema,
  supplierFormSchema,
  supplierProjectLinkSchema,
} from "@/features/suppliers/validation";

function toActionError(err: unknown): string {
  if (err instanceof z.ZodError) return err.issues[0]?.message || "Validation error";
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

export async function createSupplierAction(data: unknown) {
  try {
    const values = supplierFormSchema.parse(data);
    const supplier = await createSupplier(values);
    return { success: true as const, data: supplier };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function updateSupplierAction(supplierId: string, data: unknown) {
  try {
    const values = supplierFormSchema.partial().parse(data);
    const supplier = await updateSupplier(supplierId, values);
    return { success: true as const, data: supplier };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function linkSupplierToProjectAction(data: unknown) {
  try {
    const values = supplierProjectLinkSchema.parse(data);
    const link = await linkSupplierToProject(values);
    return { success: true as const, data: link };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function createPurchaseRequestAction(data: unknown) {
  try {
    const values = purchaseRequestSchema.parse(data);
    const request = await createPurchaseRequest(values);
    return { success: true as const, data: request };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function updatePurchaseRequestStatusAction(data: unknown) {
  try {
    const values = purchaseRequestStatusSchema.parse(data);
    const request = await updatePurchaseRequestStatus(values);
    return { success: true as const, data: request };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}
