"use client";

import Prompt from "@/components/sections/Prompt";

export default function DashboardPage() {
  return (
    <section className="relative flex min-h-[calc(100svh-3.5rem)] w-full flex-col items-center justify-center overflow-hidden px-4 pb-10 pt-6 md:pb-16 md:pt-8">
      <Prompt />
    </section>
  );
}
