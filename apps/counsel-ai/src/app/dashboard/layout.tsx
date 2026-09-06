"use client";

import type { ReactNode } from "react";
import {
  AnimatedSidebarProvider,
  AnimatedSidebarInset,
  AnimatedSidebarTrigger,
} from "@/components/motion/animated-sidebar";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { PanelLeft, Plus, Scale } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const handleNewChat = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("counsel:new-chat"));
    }
  };

  return (
    <AnimatedSidebarProvider defaultOpen={true}>
      <DashboardSidebar />
      <AnimatedSidebarInset className="bg-background">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AnimatedSidebarTrigger className="hover:bg-muted text-foreground cursor-pointer">
              <PanelLeft className="size-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </AnimatedSidebarTrigger>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
            >
              <span>Counsel AI</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent-lime px-3 py-1.5 text-xs font-semibold text-dark-obsidian shadow-xs transition-colors hover:bg-[#B8E12A] cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* Dashboard Viewport Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </AnimatedSidebarInset>
    </AnimatedSidebarProvider>
  );
}
