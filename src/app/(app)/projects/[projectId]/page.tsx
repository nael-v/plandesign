import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProjectById } from "@/services/projects.service";
import { SectionHeader } from "@/components/shared/section-header";
import { ProjectWorkspace } from "@/features/projects/components/project-workspace";

type Props = { params: Promise<{ projectId: string }> };

export default async function ProjectWorkspacePage({ params }: Props) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);

  if (!project) notFound();

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {/* Back nav */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to projects
        </Link>
      </nav>

      <SectionHeader
        eyebrow={`${project.stage.charAt(0).toUpperCase() + project.stage.slice(1)} · ${project.clientName}`}
        title={project.name}
        description="Project workspace — tasks, blueprints, team, timeline, and activity."
      />

      <ProjectWorkspace projectId={projectId} />
    </main>
  );
}
