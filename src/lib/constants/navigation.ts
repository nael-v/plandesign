export type NavigationItem = {
  label: string;
  href: string;
  module: string;
  description: string;
};

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    module: "Operations",
    description: "Executive overview of projects, tasks, clients, revenue, and activity.",
  },
  {
    label: "CRM Clients",
    href: "/crm",
    module: "Client management",
    description: "Profiles, project history, contracts, notes, invoices, and documents.",
  },
  {
    label: "Projects",
    href: "/projects",
    module: "Delivery",
    description: "Stages, timelines, budgets, team members, files, and version history.",
  },
  {
    label: "Finances",
    href: "/finances",
    module: "Finance",
    description: "Income, expenses, invoices, supplier payments, and profitability.",
  },
  {
    label: "Suppliers",
    href: "/suppliers",
    module: "Procurement",
    description: "Vendors, pricing, orders, contacts, and purchase notes.",
  },
  {
    label: "AI tools",
    href: "/ai",
    module: "Future ready",
    description: "A ready path for AI-assisted layouts, recommendations, and planning.",
  },
];