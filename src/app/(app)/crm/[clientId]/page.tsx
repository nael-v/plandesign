import { notFound } from "next/navigation";
import { getClientById } from "@/services/clients.service";
import { SectionHeader } from "@/components/shared/section-header";
import { ClientProfileWorkspace } from "@/features/crm/components/client-profile-workspace";

type ClientProfilePageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function ClientProfilePage({ params }: ClientProfilePageProps) {
  const { clientId } = await params;
  const client = await getClientById(clientId);

  if (!client) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <SectionHeader
        eyebrow="CRM Profile"
        title={client.name}
        description="Complete lifecycle workspace for notes, files, meetings, projects, invoices, and activity."
      />

      <ClientProfileWorkspace clientId={clientId} />
    </main>
  );
}
