export const crmQueryKeys = {
  all: ["crm"] as const,
  clientsRoot: ["clients"] as const,
  clients: (query: unknown) => ["clients", query] as const,
  lifecycle: (clientId: string) => ["client-lifecycle", clientId] as const,
};
