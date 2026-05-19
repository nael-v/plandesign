"use server";

import {
  createClientLifecycleAction,
  deleteClientLifecycleAction,
  updateClientLifecycleAction,
} from "@/actions/crm";

export async function createClientAction(data: unknown) {
  return createClientLifecycleAction(data);
}

export async function updateClientAction(id: string, data: unknown) {
  return updateClientLifecycleAction(id, data);
}

export async function deleteClientAction(id: string) {
  return deleteClientLifecycleAction({ id });
}
