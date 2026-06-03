"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Clock3, Edit3, FileText, NotebookPen, Receipt, Sparkles, UploadCloud } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addClientNoteLifecycleAction,
  createClientInvoiceLifecycleAction,
  createClientRelatedProjectLifecycleAction,
  scheduleClientMeetingLifecycleAction,
  updateClientLifecycleAction,
  uploadClientFileLifecycleAction,
} from "@/actions/crm";
import { getClientLifecycleSnapshot } from "@/services/clients.service";
import {
  clientFormSchema,
  clientInvoiceSchema,
  clientMeetingSchema,
  clientNoteSchema,
  clientRelatedProjectSchema,
  ClientFormValues,
  ClientInvoiceValues,
  ClientMeetingValues,
  ClientNoteValues,
  ClientRelatedProjectValues,
} from "@/features/crm/validation";
import type { ClientLifecycleSnapshot } from "@/features/crm/types";
import { crmQueryKeys } from "@/features/crm/query-keys";
import { publishCrmRealtimeEvent, useCrmRealtime } from "@/features/crm/realtime";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  localizedValue,
  localizeClientStatus,
  localizeInvoiceStatus,
  localizeProjectStage,
  localizeProjectStatus,
} from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

const ActivityTimeline = dynamic(
  () => import("@/components/activity-timeline").then((module) => module.ActivityTimeline),
  {
    ssr: false,
    loading: () => <Skeleton className="h-44 w-full" />,
  },
);

const FileDropzone = dynamic(
  () => import("@/components/workflow/file-dropzone").then((module) => module.FileDropzone),
  {
    ssr: false,
    loading: () => <Skeleton className="h-40 w-full" />,
  },
);

type ClientProfileWorkspaceProps = {
  clientId: string;
};

export function ClientProfileWorkspace({ clientId }: ClientProfileWorkspaceProps) {
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const noteSectionRef = useRef<HTMLDivElement | null>(null);
  const meetingSectionRef = useRef<HTMLDivElement | null>(null);
  const filesSectionRef = useRef<HTMLDivElement | null>(null);

  const lifecycleQuery = useQuery({
    queryKey: crmQueryKeys.lifecycle(clientId),
    queryFn: () => getClientLifecycleSnapshot(clientId),
  });

  const profileForm = useForm<Pick<ClientFormValues, "name" | "email" | "status">>({
    resolver: zodResolver(clientFormSchema.pick({ name: true, email: true, status: true })),
    defaultValues: {
      name: "",
      email: "",
      status: "prospect",
    },
  });

  const noteForm = useForm<ClientNoteValues>({
    resolver: zodResolver(clientNoteSchema),
    defaultValues: { content: "" },
  });

  const meetingForm = useForm<ClientMeetingValues>({
    resolver: zodResolver(clientMeetingSchema),
    defaultValues: {
      title: "",
      startsAt: "",
      duration: 60,
      room: "",
    },
  });

  const projectForm = useForm<ClientRelatedProjectValues>({
    resolver: zodResolver(clientRelatedProjectSchema),
    defaultValues: { name: "" },
  });

  const invoiceForm = useForm<ClientInvoiceValues>({
    resolver: zodResolver(clientInvoiceSchema),
    defaultValues: {
      amount: 0,
      dueAt: undefined,
    },
  });

  const commonOnSuccess = (message: string) => {
    toast.success(message);
    queryClient.invalidateQueries({ queryKey: crmQueryKeys.lifecycle(clientId) });
    queryClient.invalidateQueries({ queryKey: crmQueryKeys.clientsRoot });
    publishCrmRealtimeEvent({
      type: "client.activity.created",
      clientId,
      at: new Date().toISOString(),
      source: "local",
    });
  };

  useEffect(() => {
    if (!lifecycleQuery.data) {
      return;
    }

    profileForm.reset({
      name: lifecycleQuery.data.client.name,
      email: lifecycleQuery.data.client.email,
      status: lifecycleQuery.data.client.status,
    });
  }, [lifecycleQuery.data, profileForm]);

  const handleRealtimeEvent = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: crmQueryKeys.lifecycle(clientId) });
    queryClient.invalidateQueries({ queryKey: crmQueryKeys.clientsRoot });
  }, [clientId, queryClient]);

  useCrmRealtime(clientId, handleRealtimeEvent);

  const profileMutation = useMutation({
    mutationFn: async (values: Pick<ClientFormValues, "name" | "email" | "status">) =>
      updateClientLifecycleAction(clientId, values),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: crmQueryKeys.lifecycle(clientId) });
      const previous = queryClient.getQueryData(crmQueryKeys.lifecycle(clientId));

      queryClient.setQueryData(crmQueryKeys.lifecycle(clientId), (current: ClientLifecycleSnapshot | null) => {
        if (!current) return current;
        return {
          ...current,
          client: {
            ...current.client,
            ...values,
          },
        };
      });

      return { previous };
    },
    onError: (_error, _values, context) => {
      if (context?.previous) {
        queryClient.setQueryData(crmQueryKeys.lifecycle(clientId), context.previous);
      }
      toast.error(localizedValue(locale, { en: "Failed to update client profile", he: "עדכון פרופיל הלקוח נכשל" }));
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to update client profile", he: "עדכון פרופיל הלקוח נכשל" }));
        return;
      }

      setIsEditingProfile(false);
      commonOnSuccess(localizedValue(locale, { en: "Client profile updated", he: "פרופיל הלקוח עודכן" }));
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (values: ClientNoteValues) => addClientNoteLifecycleAction({ clientId, ...values }),
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: crmQueryKeys.lifecycle(clientId) });
      const previous = queryClient.getQueryData(crmQueryKeys.lifecycle(clientId));

      queryClient.setQueryData(crmQueryKeys.lifecycle(clientId), (current: ClientLifecycleSnapshot | null) => {
        if (!current) return current;

        const optimisticNote = {
          id: `optimistic-note-${Date.now()}`,
          clientId,
          content: values.content,
          createdBy: "You",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const optimisticActivity = {
          id: `optimistic-activity-${Date.now()}`,
          eventType: "note_added",
          title: "Client note added",
          description: values.content,
          actor: "You",
          createdAt: new Date(),
        };

        return {
          ...current,
          notes: [optimisticNote, ...current.notes],
          activities: [optimisticActivity, ...current.activities],
        };
      });

      return { previous };
    },
    onError: (_error, _values, context) => {
      if (context?.previous) {
        queryClient.setQueryData(crmQueryKeys.lifecycle(clientId), context.previous);
      }
      toast.error(localizedValue(locale, { en: "Failed to add note", he: "הוספת הערה נכשלה" }));
    },
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to add note", he: "הוספת הערה נכשלה" }));
        return;
      }

      noteForm.reset({ content: "" });
      commonOnSuccess(localizedValue(locale, { en: "Note added", he: "הערה נוספה" }));
    },
  });

  const meetingMutation = useMutation({
    mutationFn: (values: ClientMeetingValues) =>
      scheduleClientMeetingLifecycleAction({
        clientId,
        ...values,
        startsAt: new Date(values.startsAt).toISOString(),
      }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to schedule meeting", he: "תזמון הפגישה נכשל" }));
        return;
      }
      meetingForm.reset({
        title: "",
        startsAt: "",
        duration: 60,
        room: "",
      });
      commonOnSuccess(localizedValue(locale, { en: "Meeting scheduled", he: "הפגישה תוזמנה" }));
    },
    onError: () => toast.error(localizedValue(locale, { en: "Failed to schedule meeting", he: "תזמון הפגישה נכשל" })),
  });

  const relatedProjectMutation = useMutation({
    mutationFn: (values: ClientRelatedProjectValues) =>
      createClientRelatedProjectLifecycleAction({ clientId, ...values }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to create project", he: "יצירת הפרויקט נכשלה" }));
        return;
      }
      projectForm.reset({ name: "" });
      commonOnSuccess(localizedValue(locale, { en: "Related project created", he: "הפרויקט הקשור נוצר" }));
    },
    onError: () => toast.error(localizedValue(locale, { en: "Failed to create project", he: "יצירת הפרויקט נכשלה" })),
  });

  const invoiceMutation = useMutation({
    mutationFn: (values: ClientInvoiceValues) =>
      createClientInvoiceLifecycleAction({
        clientId,
        ...values,
        dueAt: values.dueAt ? new Date(values.dueAt).toISOString() : undefined,
      }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to create invoice", he: "יצירת החשבונית נכשלה" }));
        return;
      }
      invoiceForm.reset({ amount: 0, dueAt: undefined });
      commonOnSuccess(localizedValue(locale, { en: "Invoice created", he: "החשבונית נוצרה" }));
    },
    onError: () => toast.error(localizedValue(locale, { en: "Failed to create invoice", he: "יצירת החשבונית נכשלה" })),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      uploadClientFileLifecycleAction({
        clientId,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      }),
    onSuccess: (result) => {
      if (!result.success) {
        toast.error(result.error || localizedValue(locale, { en: "Failed to upload file", he: "העלאת הקובץ נכשלה" }));
        return;
      }
      commonOnSuccess(localizedValue(locale, { en: "Attachment uploaded", he: "הקובץ הועלה" }));
    },
    onError: () => toast.error(localizedValue(locale, { en: "Failed to upload file", he: "העלאת הקובץ נכשלה" })),
  });

  const timelineItems = useMemo(() => {
    const activities = lifecycleQuery.data?.activities || [];

    return activities.map((activity) => ({
      id: activity.id,
      label: activity.title,
      description: `${activity.description} • ${activity.actor}`,
      timestamp: formatDateTime(locale, activity.createdAt),
      color: "blue" as const,
    }));
  }, [locale, lifecycleQuery.data?.activities]);

  const isImageFile = (url: string, mimeType?: string) => {
    if (mimeType?.startsWith("image/")) return true;
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
  };

  if (lifecycleQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lifecycleQuery.data) {
    return <EmptyState title={localizedValue(locale, { en: "Client not found", he: "הלקוח לא נמצא" })} description={localizedValue(locale, { en: "This client may have been removed.", he: "ייתכן שהלקוח הוסר." })} />;
  }

  const snapshot = lifecycleQuery.data;

  return (
    <div className="space-y-6">
      <section className="sticky top-4 z-20 rounded-3xl border border-border bg-background/95 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {localizeClientStatus(locale, snapshot.client.status)}
            </span>
            <p className="text-sm text-muted">{localizedValue(locale, { en: "Quick actions", he: "פעולות מהירות" })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditingProfile((value) => !value)}>
              <Edit3 className="mr-1.5 h-4 w-4" />
              {isEditingProfile ? localizedValue(locale, { en: "Close edit", he: "סגור עריכה" }) : localizedValue(locale, { en: "Edit profile", he: "ערוך פרופיל" })}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => noteSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {localizedValue(locale, { en: "Add note", he: "הוסף הערה" })}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => meetingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              {localizedValue(locale, { en: "Schedule meeting", he: "תזמן פגישה" })}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => filesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
              <UploadCloud className="mr-1.5 h-4 w-4" />
              {localizedValue(locale, { en: "Upload files", he: "העלה קבצים" })}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-background p-5">
        {!isEditingProfile ? (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">{snapshot.client.name}</h2>
              <p className="text-sm text-muted">{snapshot.client.email}</p>
            </div>
            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 sm:mt-0">
              {localizeClientStatus(locale, snapshot.client.status)}
            </span>
          </div>
        ) : (
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={profileForm.handleSubmit((values) => profileMutation.mutate(values))}
          >
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="profile-name">{localizedValue(locale, { en: "Client name", he: "שם לקוח" })}</Label>
              <Input id="profile-name" {...profileForm.register("name")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-email">{localizedValue(locale, { en: "Email", he: "אימייל" })}</Label>
              <Input id="profile-email" type="email" {...profileForm.register("email")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile-status">{localizedValue(locale, { en: "Status", he: "סטטוס" })}</Label>
              <select
                id="profile-status"
                className="h-11 rounded-2xl border border-border bg-background px-3 text-sm"
                {...profileForm.register("status")}
              >
                <option value="prospect">{localizedValue(locale, { en: "Prospect", he: "ליד" })}</option>
                <option value="active">{localizedValue(locale, { en: "Active", he: "פעיל" })}</option>
                <option value="inactive">{localizedValue(locale, { en: "Inactive", he: "לא פעיל" })}</option>
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>
                {localizedValue(locale, { en: "Cancel", he: "בטל" })}
              </Button>
              <Button type="submit" disabled={profileMutation.isPending}>
                {profileMutation.isPending ? localizedValue(locale, { en: "Saving...", he: "שומר..." }) : localizedValue(locale, { en: "Save profile", he: "שמור פרופיל" })}
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div ref={noteSectionRef} className="rounded-3xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Notes system", he: "מערכת הערות" })}</h3>
          </div>

          <form className="space-y-3" onSubmit={noteForm.handleSubmit((values) => addNoteMutation.mutate(values))}>
            <textarea
              className="min-h-20 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              placeholder={localizedValue(locale, { en: "Add note", he: "הוסף הערה" })}
              {...noteForm.register("content")}
            />
            {noteForm.formState.errors.content && (
              <p className="text-xs text-red-600">{noteForm.formState.errors.content.message}</p>
            )}
            <Button type="submit" disabled={addNoteMutation.isPending}>
              {localizedValue(locale, { en: "Save note", he: "שמור הערה" })}
            </Button>
          </form>

          <ul className="mt-4 space-y-2">
            {snapshot.notes.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                {localizedValue(locale, { en: "No notes yet.", he: "עדיין אין הערות." })}
              </li>
            )}
            {snapshot.notes.map((note) => (
              <li key={note.id} className="rounded-2xl border border-border bg-surface p-3">
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="mt-1 text-xs text-muted">
                  {note.createdBy} • {formatDateTime(locale, note.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div ref={meetingSectionRef} className="rounded-3xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Meeting history", he: "היסטוריית פגישות" })}</h3>
          </div>

          <form className="grid gap-3" onSubmit={meetingForm.handleSubmit((values) => meetingMutation.mutate(values))}>
            <Input placeholder={localizedValue(locale, { en: "Meeting title", he: "כותרת פגישה" })} {...meetingForm.register("title")} />
            <Input type="datetime-local" {...meetingForm.register("startsAt")} />
            <Input type="number" placeholder={localizedValue(locale, { en: "Duration (minutes)", he: "משך (בדקות)" })} {...meetingForm.register("duration", { valueAsNumber: true })} />
            <Input placeholder={localizedValue(locale, { en: "Room / location", he: "חדר / מיקום" })} {...meetingForm.register("room")} />
            <Button type="submit" disabled={meetingMutation.isPending}>{localizedValue(locale, { en: "Schedule meeting", he: "תזמן פגישה" })}</Button>
          </form>

          <ul className="mt-4 space-y-2">
            {snapshot.meetings.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                {localizedValue(locale, { en: "No meetings scheduled yet.", he: "עדיין אין פגישות מתוזמנות." })}
              </li>
            )}
            {snapshot.meetings.map((meeting) => (
              <li key={meeting.id} className="rounded-2xl border border-border bg-surface p-3 text-sm shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{meeting.title}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                    <Clock3 className="h-3.5 w-3.5" />
                    {localizedValue(locale, { en: `${meeting.duration}m`, he: `${meeting.duration} דק'` })}
                  </span>
                </div>
                <p className="text-xs text-muted">{formatDateTime(locale, meeting.startsAt)}</p>
                {meeting.room && <p className="mt-1 text-xs text-muted">{localizedValue(locale, { en: "Location", he: "מיקום" })}: {meeting.room}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-3xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Related projects", he: "פרויקטים קשורים" })}</h3>
          </div>

          <form className="space-y-3" onSubmit={projectForm.handleSubmit((values) => relatedProjectMutation.mutate(values))}>
            <Input placeholder={localizedValue(locale, { en: "Project name", he: "שם פרויקט" })} {...projectForm.register("name")} />
            <Button type="submit" disabled={relatedProjectMutation.isPending}>{localizedValue(locale, { en: "Create related project", he: "צור פרויקט קשור" })}</Button>
          </form>

          <ul className="mt-4 space-y-2">
            {snapshot.projects.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                {localizedValue(locale, { en: "No related projects yet.", he: "עדיין אין פרויקטים קשורים." })}
              </li>
            )}
            {snapshot.projects.map((project) => (
              <li key={project.id} className="rounded-2xl border border-border bg-surface p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{project.name}</p>
                  <Link href={`/projects`} className="text-xs text-blue-600 hover:underline">{localizedValue(locale, { en: "Open projects", he: "פתח פרויקטים" })}</Link>
                </div>
                <p className="text-xs text-muted">{localizeProjectStage(locale, project.stage)} • {localizeProjectStatus(locale, project.status)}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-border bg-background p-5">
          <div className="mb-4 flex items-center gap-2">
            <Receipt className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Related invoices", he: "חשבוניות קשורות" })}</h3>
          </div>

          <form className="space-y-3" onSubmit={invoiceForm.handleSubmit((values) => invoiceMutation.mutate(values))}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="invoice-amount">{localizedValue(locale, { en: "Amount", he: "סכום" })}</Label>
                <Input id="invoice-amount" type="number" {...invoiceForm.register("amount", { valueAsNumber: true })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invoice-due">{localizedValue(locale, { en: "Due date", he: "תאריך יעד" })}</Label>
                <Input id="invoice-due" type="datetime-local" {...invoiceForm.register("dueAt")} />
              </div>
            </div>
            <Button type="submit" disabled={invoiceMutation.isPending}>{localizedValue(locale, { en: "Generate invoice", he: "הפק חשבונית" })}</Button>
          </form>

          <ul className="mt-4 space-y-2">
            {snapshot.invoices.length === 0 && (
              <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
                {localizedValue(locale, { en: "No invoices generated yet.", he: "עדיין לא נוצרו חשבוניות." })}
              </li>
            )}
            {snapshot.invoices.map((invoice) => (
              <li key={invoice.id} className="rounded-2xl border border-border bg-surface p-3 text-sm shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground">{invoice.number}</p>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                    {localizeInvoiceStatus(locale, invoice.status)}
                  </span>
                </div>
                <p className="text-xs text-muted">{formatCurrency(locale, invoice.amount)}</p>
                {invoice.dueAt && <p className="mt-1 text-xs text-muted">{localizedValue(locale, { en: "Due", he: "לתשלום" })}: {formatDate(locale, invoice.dueAt)}</p>}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section ref={filesSectionRef} className="rounded-3xl border border-border bg-background p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-foreground">{localizedValue(locale, { en: "Client files", he: "קבצי לקוח" })}</h3>
        </div>

        <FileDropzone
          title={localizedValue(locale, { en: "Drop client files, plan images, and PDFs", he: "שחרר קבצי לקוח, תמונות תוכנית וקבצי PDF" })}
          accept="image/*,.pdf"
          onUpload={async (file) => {
            await uploadMutation.mutateAsync(file);
          }}
        />

        <ul className="mt-4 space-y-2">
          {snapshot.files.length === 0 && (
            <li className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted">
              {localizedValue(locale, { en: "No files uploaded yet.", he: "עדיין לא הועלו קבצים." })}
            </li>
          )}
          {snapshot.files.map((file) => (
            <li key={file.id} className="rounded-2xl border border-border bg-surface p-3 text-sm">
              <div className="flex items-center gap-3">
                {isImageFile(file.url, file.mimeType) ? (
                  <Image
                    src={file.url}
                    alt={file.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <FileText className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted">
                    {localizedValue(locale, { en: "Uploaded by", he: "הועלה על ידי" })} {file.uploadedBy}
                    {file.size ? ` • ${Math.round(file.size / 1024)} KB` : ""}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-3xl border border-border bg-background p-5">
        <ActivityTimeline title={localizedValue(locale, { en: "Activity timeline", he: "ציר זמן פעילות" })} items={timelineItems} />
        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => lifecycleQuery.refetch()}
            disabled={lifecycleQuery.isRefetching}
          >
            {lifecycleQuery.isRefetching ? localizedValue(locale, { en: "Refreshing...", he: "מרענן..." }) : localizedValue(locale, { en: "Refresh timeline", he: "רענן ציר זמן" })}
          </Button>
        </div>
        {timelineItems.length === 0 && (
          <div className="mt-4">
            <EmptyState
              title={localizedValue(locale, { en: "No activity events yet", he: "עדיין אין אירועי פעילות" })}
              description={localizedValue(locale, { en: "Add notes, files, meetings, projects, or invoices to build the timeline.", he: "הוסף הערות, קבצים, פגישות, פרויקטים או חשבוניות כדי לבנות את ציר הזמן." })}
            />
          </div>
        )}
      </section>
    </div>
  );
}
