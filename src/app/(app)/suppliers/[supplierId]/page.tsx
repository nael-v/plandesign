import { notFound } from "next/navigation";
import { getSupplierProfile } from "@/services/suppliers.service";
import { SupplierWorkspace } from "@/features/suppliers/components/supplier-workspace";

type Props = { params: Promise<{ supplierId: string }> };

export default async function SupplierWorkspacePage({ params }: Props) {
  const { supplierId } = await params;
  const supplier = await getSupplierProfile(supplierId);

  if (!supplier) notFound();

  return <SupplierWorkspace supplierId={supplierId} />;
}
