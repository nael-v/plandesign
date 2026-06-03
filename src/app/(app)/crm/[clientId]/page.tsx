import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getClientById } from "@/services/clients.service";
import { SectionHeader } from "@/components/shared/section-header";
import { ClientProfileWorkspace } from "@/features/crm/components/client-profile-workspace";
import { LOCALE_COOKIE, localizedValue, normalizeLocale } from "@/lib/i18n";

type ClientProfilePageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function ClientProfilePage({ params }: ClientProfilePageProps) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? null);
  const { clientId } = await params;
  const client = await getClientById(clientId);

  if (!client) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow={localizedValue(locale, { en: "CRM Profile", he: "פרופיל CRM" })}
        title={client.name}
        description={localizedValue(locale, { en: "Complete lifecycle workspace for notes, files, meetings, projects, invoices, and activity.", he: "מרחב מלא למחזור חיי הלקוח: הערות, קבצים, פגישות, פרויקטים, חשבוניות ופעילות." })}
      />

      <ClientProfileWorkspace clientId={clientId} />
    </main>
  );
}
