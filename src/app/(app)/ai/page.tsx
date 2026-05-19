import { Button } from "@/components/ui/button";
import { ModulePage } from "@/components/shared/module-page";

export default function AiPage() {
  return (
    <ModulePage
      eyebrow="AI tools"
      title="Future-ready AI workspace for planning and recommendations"
      description="Reserve a module boundary now so OpenAI-powered planning can be added later without reworking the core system."
      highlights={[
        "Room layout and floor planning suggestions.",
        "Electrical, plumbing, and material recommendations.",
        "Interior style assistance and assistant chat surfaces.",
        "Separation of AI contracts from core business operations.",
      ]}
      roadmap={[
        "Define AI request/response contracts in a dedicated layer.",
        "Store prompts, usage, and audit logs separately from business data.",
        "Add project-aware assistants and recommendation workflows.",
        "Connect to OpenAI or similar providers behind a service boundary.",
      ]}
      action={<Button variant="secondary">Preview AI roadmap</Button>}
    />
  );
}