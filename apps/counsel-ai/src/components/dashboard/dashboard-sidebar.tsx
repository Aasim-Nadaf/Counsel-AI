"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatedSidebar,
  AnimatedSidebarHeader,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarGroupContent,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuButton,
  AnimatedSidebarRail,
  useAnimatedSidebar,
} from "@/components/motion/animated-sidebar";
import {
  Plus,
  MessageSquare,
  Scale,
  LogOut,
  Clock,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface ChatItem {
  id: string;
  title: string;
  query: string;
  time: string;
}

const DEFAULT_CHATS: ChatItem[] = [
  {
    id: "chat-1",
    title: "Anticipatory bail under Sec 482 BNSS",
    query:
      "What is the procedure and grounds for anticipatory bail under Section 482 of BNSS vs 438 CrPC?",
    time: "Today",
  },
  {
    id: "chat-2",
    title: "Sec 138 NI Act Cheque Notice",
    query:
      "Draft a statutory legal notice under Section 138 of the Negotiable Instruments Act for cheque dishonour...",
    time: "Today",
  },
  {
    id: "chat-3",
    title: "BNS Sec 103 Murder vs Sec 105",
    query:
      "Analyze ingredients and maximum punishment for criminal breach of trust under BNS Section 316...",
    time: "Yesterday",
  },
  {
    id: "chat-4",
    title: "Article 21 Right to Privacy Precedents",
    query:
      "What are the landmark Supreme Court judgments defining Right to Privacy under Article 21?",
    time: "Yesterday",
  },
  {
    id: "chat-5",
    title: "Admissibility of WhatsApp chats BSA",
    query:
      "Is an unregistered agreement to sell admissible as evidence in a suit for specific performance?",
    time: "Previous 7 Days",
  },
  {
    id: "chat-6",
    title: "FIR Quashing under Sec 528 BNSS",
    query:
      "Explain the grounds for quashing an FIR under Section 528 BNSS (Section 482 CrPC) for civil disputes...",
    time: "Previous 7 Days",
  },
];

export function DashboardSidebar() {
  const router = useRouter();
  const { open } = useAnimatedSidebar();

  const [chats, setChats] = useState<ChatItem[]>(DEFAULT_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    try {
      const supabase = createClient();
      const getUser = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      };
      getUser();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        (_event: string, session: { user: SupabaseUser } | null) => {
          setUser(session?.user ?? null);
        },
      );
      return () => subscription.unsubscribe();
    } catch {
      // Ignore in dev if supabase env variables missing
    }
  }, []);

  const handleNewChat = () => {
    setActiveChatId(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("counsel:new-chat"));
    }
    router.push("/dashboard");
  };

  const handleSelectChat = (chat: ChatItem) => {
    setActiveChatId(chat.id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("counsel:select-chat", {
          detail: { query: chat.query },
        }),
      );
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      router.push("/");
    } finally {
      setIsSigningOut(false);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "CA";
    return user.email.slice(0, 2).toUpperCase();
  };

  // Group chats by time period
  const todayChats = chats.filter((c) => c.time === "Today");
  const yesterdayChats = chats.filter((c) => c.time === "Yesterday");
  const olderChats = chats.filter((c) => c.time === "Previous 7 Days");

  return (
    <AnimatedSidebar collapsible="icon" variant="sidebar">
      {/* Header with App Brand */}
      <AnimatedSidebarHeader>
        <div
          onClick={handleNewChat}
          className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50 cursor-pointer"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-lime text-dark-obsidian shadow-sm ring-1 ring-black/5">
            <Scale className="size-5" />
          </div>
          {open && (
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden leading-none">
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                Counsel AI
              </span>
              <span className="mt-1 truncate text-[11px] font-medium text-muted-foreground">
                Zero-Hallucination Legal AI
              </span>
            </div>
          )}
        </div>
      </AnimatedSidebarHeader>

      {/* Main Content */}
      <AnimatedSidebarContent>
        {/* New Chat Action */}
        <AnimatedSidebarGroup>
          <AnimatedSidebarGroupContent>
            <AnimatedSidebarMenu>
              <AnimatedSidebarMenuItem>
                <AnimatedSidebarMenuButton
                  onSelect={handleNewChat}
                  icon={<Plus className="size-4" />}
                  className="bg-accent-lime text-dark-obsidian font-semibold hover:bg-[#B8E12A] hover:text-dark-obsidian shadow-xs"
                >
                  New Chat
                </AnimatedSidebarMenuButton>
              </AnimatedSidebarMenuItem>
            </AnimatedSidebarMenu>
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>

        {/* Chat History Group */}
        <AnimatedSidebarGroup className="mt-1">
          <AnimatedSidebarGroupLabel>Chat History</AnimatedSidebarGroupLabel>
          <AnimatedSidebarGroupContent>
            {/* Today */}
            {todayChats.length > 0 && (
              <div className="mb-2">
                {open && (
                  <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Today
                  </span>
                )}
                <AnimatedSidebarMenu className="mt-1">
                  {todayChats.map((chat) => (
                    <AnimatedSidebarMenuItem key={chat.id}>
                      <AnimatedSidebarMenuButton
                        isActive={activeChatId === chat.id}
                        onSelect={() => handleSelectChat(chat)}
                        icon={<MessageSquare className="size-4" />}
                      >
                        {chat.title}
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                  ))}
                </AnimatedSidebarMenu>
              </div>
            )}

            {/* Yesterday */}
            {yesterdayChats.length > 0 && (
              <div className="mb-2">
                {open && (
                  <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Yesterday
                  </span>
                )}
                <AnimatedSidebarMenu className="mt-1">
                  {yesterdayChats.map((chat) => (
                    <AnimatedSidebarMenuItem key={chat.id}>
                      <AnimatedSidebarMenuButton
                        isActive={activeChatId === chat.id}
                        onSelect={() => handleSelectChat(chat)}
                        icon={<MessageSquare className="size-4" />}
                      >
                        {chat.title}
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                  ))}
                </AnimatedSidebarMenu>
              </div>
            )}

            {/* Previous 7 Days */}
            {olderChats.length > 0 && (
              <div className="mb-2">
                {open && (
                  <span className="px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    Previous 7 Days
                  </span>
                )}
                <AnimatedSidebarMenu className="mt-1">
                  {olderChats.map((chat) => (
                    <AnimatedSidebarMenuItem key={chat.id}>
                      <AnimatedSidebarMenuButton
                        isActive={activeChatId === chat.id}
                        onSelect={() => handleSelectChat(chat)}
                        icon={<MessageSquare className="size-4" />}
                      >
                        {chat.title}
                      </AnimatedSidebarMenuButton>
                    </AnimatedSidebarMenuItem>
                  ))}
                </AnimatedSidebarMenu>
              </div>
            )}
          </AnimatedSidebarGroupContent>
        </AnimatedSidebarGroup>
      </AnimatedSidebarContent>

      {/* Footer / User Profile */}
      <AnimatedSidebarFooter>
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-lime text-xs font-bold text-dark-obsidian ring-2 ring-accent-lime/30">
            {getUserInitials()}
          </div>
          {open && (
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden text-left">
              <span className="truncate text-xs font-semibold text-foreground">
                {user?.email ?? "Advocate Counsel"}
              </span>
              <span className="truncate text-[10px] text-muted-foreground">
                {user ? "Verified Advocate" : "Guest Session"}
              </span>
            </div>
          )}
          {open && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              title="Sign out"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer disabled:opacity-50"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </AnimatedSidebarFooter>

      {/* Edge toggle rail */}
      <AnimatedSidebarRail />
    </AnimatedSidebar>
  );
}
