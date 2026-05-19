import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "@/components/command-palette";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <CommandPalette />
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 ml-0 xl:ml-[18rem]">
          <Topbar />
          <div className="flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </>
  );
}