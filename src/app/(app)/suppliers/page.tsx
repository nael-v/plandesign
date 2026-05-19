import { Button } from "@/components/ui/button";
import { ModulePage } from "@/components/shared/module-page";

export default function SuppliersPage() {
  return (
    <ModulePage
      eyebrow="Suppliers"
      title="Procurement layer for furniture, electrical, plumbing, and materials"
      description="Store vendor contacts, pricing, order history, notes, and procurement context for each project."
      highlights={[
        "Supplier categories organized around real project needs.",
        "Contact and pricing data available to project teams.",
        "Notes and order history preserved for procurement decisions.",
        "Future-friendly structure for sourcing and comparison tools.",
      ]}
      roadmap={[
        "Model supplier, pricing, and order tables in the database.",
        "Add vendor search and category-based filtering.",
        "Connect orders to projects and expenses.",
        "Add recommendation and comparison workflows later.",
      ]}
      action={<Button variant="secondary">Add supplier</Button>}
    />
  );
}