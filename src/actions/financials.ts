"use server";

import { z } from "zod";
import {
  createExpense,
  createInvoice,
  createSupplierPayment,
  deleteInvoice,
  updateInvoice,
  updateInvoiceStatus,
  updateSupplierPaymentStatus,
} from "@/services/financials.service";
import {
  expenseFormSchema,
  invoiceFormSchema,
  invoiceStatusUpdateSchema,
  supplierPaymentFormSchema,
  supplierPaymentStatusUpdateSchema,
} from "@/features/financials/validation";

function toActionError(error: unknown): string {
  if (error instanceof z.ZodError) return error.issues[0]?.message || "Validation error";
  if (error instanceof Error) return error.message;
  return "Action failed";
}

export async function createInvoiceAction(data: unknown) {
  try {
    const input = invoiceFormSchema.parse(data);
    const invoice = await createInvoice(input);
    return { success: true as const, data: invoice };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function updateInvoiceAction(invoiceId: string, data: unknown) {
  try {
    const input = invoiceFormSchema.partial().parse(data);
    const invoice = await updateInvoice(invoiceId, input);
    return { success: true as const, data: invoice };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function deleteInvoiceAction(invoiceId: string) {
  try {
    if (!invoiceId) return { success: false as const, error: "Missing invoice id" };
    await deleteInvoice(invoiceId);
    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function updateInvoiceStatusAction(data: unknown) {
  try {
    const input = invoiceStatusUpdateSchema.parse(data);
    const invoice = await updateInvoiceStatus(input);
    return { success: true as const, data: invoice };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function createExpenseAction(data: unknown) {
  try {
    const input = expenseFormSchema.parse(data);
    const expense = await createExpense(input);
    return { success: true as const, data: expense };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function createSupplierPaymentAction(data: unknown) {
  try {
    const input = supplierPaymentFormSchema.parse(data);
    const payment = await createSupplierPayment(input);
    return { success: true as const, data: payment };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}

export async function updateSupplierPaymentStatusAction(data: unknown) {
  try {
    const input = supplierPaymentStatusUpdateSchema.parse(data);
    const payment = await updateSupplierPaymentStatus(input);
    return { success: true as const, data: payment };
  } catch (error) {
    return { success: false as const, error: toActionError(error) };
  }
}
