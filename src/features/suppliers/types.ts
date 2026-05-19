export type SupplierCategory = "furniture" | "electrical" | "plumbing" | "materials";

export type Supplier = {
  id: string;
  name: string;
  category: SupplierCategory;
  city?: string;
};