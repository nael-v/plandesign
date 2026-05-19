import { z } from "zod";

export const clientStatusSchema = z.enum(["active", "inactive", "prospect"]);

export const clientFormSchema = z.object({
  name: z.string().min(2, "Client name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().trim().optional(),
  status: clientStatusSchema,
  industry: z.string().trim().optional(),
  website: z.string().trim().optional(),
});

export const clientNoteSchema = z.object({
  content: z.string().min(3, "Note must contain at least 3 characters"),
});

export const clientMeetingSchema = z.object({
  title: z.string().min(2, "Meeting title is required"),
  startsAt: z.string().datetime(),
  duration: z.number().int().min(15).max(240),
  room: z.string().trim().optional(),
});

export const clientRelatedProjectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
});

export const clientInvoiceSchema = z.object({
  amount: z.number().positive("Invoice amount must be greater than 0"),
  dueAt: z.string().datetime().optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
export type ClientNoteValues = z.infer<typeof clientNoteSchema>;
export type ClientMeetingValues = z.infer<typeof clientMeetingSchema>;
export type ClientRelatedProjectValues = z.infer<typeof clientRelatedProjectSchema>;
export type ClientInvoiceValues = z.infer<typeof clientInvoiceSchema>;
