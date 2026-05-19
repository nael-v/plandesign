"use server";

import { z } from "zod";
import {
  addClientNote,
  createClient,
  createClientInvoice,
  createClientRelatedProject,
  deleteClient,
  scheduleClientMeeting,
  updateClient,
  uploadClientFile,
} from "@/services/clients.service";
import { clientFormSchema, clientInvoiceSchema, clientMeetingSchema, clientNoteSchema, clientRelatedProjectSchema } from "@/features/crm/validation";

const idSchema = z.object({ id: z.string().min(1) });

const uploadClientFileSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().int().positive(),
});

function actionError(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message || "Validation error";
  }

  return "Request failed";
}

export async function createClientLifecycleAction(data: unknown) {
  try {
    const input = clientFormSchema.parse(data);
    const result = await createClient(input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: actionError(error) };
  }
}

export async function updateClientLifecycleAction(id: string, data: unknown) {
  try {
    const input = clientFormSchema.partial().parse(data);
    const result = await updateClient(id, input);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: actionError(error) };
  }
}

export async function deleteClientLifecycleAction(data: unknown) {
  try {
    const { id } = idSchema.parse(data);
    await deleteClient(id);
    return { success: true };
  } catch (error) {
    return { success: false, error: actionError(error) };
  }
}

export async function addClientNoteLifecycleAction(data: unknown) {
  try {
    const payload = z.object({
      clientId: z.string().min(1),
    }).merge(clientNoteSchema).parse(data);

    const result = await addClientNote(payload);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: actionError(error) };
  }
}

export async function scheduleClientMeetingLifecycleAction(data: unknown) {
  try {
    const payload = z.object({ clientId: z.string().min(1) }).merge(clientMeetingSchema).parse(data);
    const result = await scheduleClientMeeting(payload);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: actionError(error) };
  }
}

export async function createClientRelatedProjectLifecycleAction(data: unknown) {
  try {
    const payload = z.object({ clientId: z.string().min(1) }).merge(clientRelatedProjectSchema).parse(data);
    const result = await createClientRelatedProject(payload.clientId, payload.name);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: actionError(error) };
  }
}

export async function createClientInvoiceLifecycleAction(data: unknown) {
  try {
    const payload = z.object({
      clientId: z.string().min(1),
      projectId: z.string().optional(),
    }).merge(clientInvoiceSchema).parse(data);

    const result = await createClientInvoice(payload);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: actionError(error) };
  }
}

export async function uploadClientFileLifecycleAction(data: unknown) {
  try {
    const payload = uploadClientFileSchema.parse(data);
    const result = await uploadClientFile(payload);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: actionError(error) };
  }
}
