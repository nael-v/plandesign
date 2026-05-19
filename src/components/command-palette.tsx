"use client";

import { useEffect, useState, createElement } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Search, Plus, Settings, LogOut, LucideIcon } from "lucide-react";
import { signOut } from "next-auth/react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type CommandActionItem = {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  action: () => void | Promise<void>;
  group: string;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const actions: CommandActionItem[] = [
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: Search,
      action: () => {
        router.push("/dashboard");
        setOpen(false);
      },
      group: "Navigation",
    },
    {
      id: "crm",
      label: "Go to CRM",
      icon: Search,
      action: () => {
        router.push("/crm");
        setOpen(false);
      },
      group: "Navigation",
    },
    {
      id: "projects",
      label: "Go to Projects",
      icon: Search,
      action: () => {
        router.push("/projects");
        setOpen(false);
      },
      group: "Navigation",
    },
    {
      id: "finances",
      label: "Go to Finances",
      icon: Search,
      action: () => {
        router.push("/finances");
        setOpen(false);
      },
      group: "Navigation",
    },
    {
      id: "new-client",
      label: "New Client",
      description: "Create a new client record",
      icon: Plus,
      action: () => {
        router.push("/crm?new=true");
        setOpen(false);
      },
      group: "Create",
    },
    {
      id: "new-project",
      label: "New Project",
      description: "Create a new project",
      icon: Plus,
      action: () => {
        router.push("/projects?new=true");
        setOpen(false);
      },
      group: "Create",
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      action: () => {
        router.push("/settings");
        setOpen(false);
      },
      group: "General",
    },
    {
      id: "logout",
      label: "Sign Out",
      icon: LogOut,
      action: async () => {
        await signOut({ callbackUrl: "/login" });
      },
      group: "General",
    },
  ];

  const groups = Array.from(new Set(actions.map((a) => a.group)));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="overflow-hidden p-0 shadow-xl">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:text-muted [&_[cmdk-group]:overflow-hidden [&_[cmdk-group]]:px-1.5 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-1.5 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b border-border px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted" />
            <Command.Input
              placeholder="Search commands..."
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted"
            />
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden">
            <Command.Empty className="py-6 text-center text-sm text-muted">
              No commands found.
            </Command.Empty>

            {groups.map((group) => {
              const groupActions = actions.filter((a) => a.group === group);
              return (
                <Command.Group key={group} heading={group}>
                  {groupActions.map((action) => (
                    <Command.Item
                      key={action.id}
                      value={action.id}
                      onSelect={action.action}
                      className="cursor-pointer"
                    >
                      <div className="mr-2 flex h-4 w-4 items-center justify-center rounded text-muted">
                        {createElement(action.icon, { className: "h-4 w-4" })}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium">{action.label}</span>
                        {action.description && (
                          <span className="text-xs text-muted">
                            {action.description}
                          </span>
                        )}
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
          <div className="border-t border-border px-4 py-2 text-xs text-muted">
            <div className="flex items-center gap-2">
              <kbd className="flex h-5 w-5 items-center justify-center rounded bg-surface-elevated text-xs font-semibold">
                ⌘
              </kbd>
              <span>K to open</span>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
