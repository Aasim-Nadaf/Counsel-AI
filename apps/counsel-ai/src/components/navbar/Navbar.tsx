"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Menu, X, ChevronRight } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile menu on resize to desktop (tablet landscape / laptop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Backdrop overlay for mobile & tablet drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-4">
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl"
        >
          <header className="relative flex h-12 w-full items-center justify-between rounded-xl border border-border/70 bg-background/80 px-4 shadow-[0_8px_30px_-8px_rgba(15,15,15,0.06)] backdrop-blur-md dark:border-white/10 dark:bg-[#161616]/80 dark:shadow-none">
            {/* Minimal Logo */}
            <Link
              aria-label="Counsel AI Homepage"
              className="flex items-center gap-2 text-foreground"
              href="/"
              onClick={() => setIsOpen(false)}
            >
              <img
                alt="Logo Light"
                loading="lazy"
                width="22"
                height="22"
                className="size-5 text-transparent dark:hidden"
                src="/logo-icon-light.svg"
              />
              <img
                alt="Logo Dark"
                loading="lazy"
                width="22"
                height="22"
                className="hidden size-5 text-transparent dark:block"
                src="/logo-icon-dark.svg"
              />
              <span className="font-sans text-xl font-semibold tracking-tight text-foreground">
                Counsel AI
              </span>
            </Link>

            {/* Desktop & Tablet-Landscape Links + Action */}
            <div className="hidden items-center justify-end gap-3 text-xs md:flex">
              <nav className="flex items-center gap-1" aria-label="Primary">
                <Link
                  className="inline-flex h-8 items-center rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
                  href="/showcase"
                >
                  Showcase
                </Link>
                <Link
                  className="inline-flex h-8 items-center rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-secondary/60"
                  href="/pricing"
                >
                  Pricing
                </Link>
              </nav>
              <Link href="/auth">
                <Button className="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md bg-accent-lime px-3 text-sm font-semibold text-dark-obsidian shadow-xs transition-colors hover:bg-[#B8E12A]">
                  Sign in
                </Button>
              </Link>
            </div>

            {/* Mobile & Tablet Toggle */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex size-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-secondary active:scale-95 md:hidden"
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
            >
              {isOpen ? (
                <X className="size-4.5" />
              ) : (
                <Menu className="size-4.5" />
              )}
            </button>
          </header>

          {/* Mobile & Tablet Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-2 overflow-hidden rounded-xl border border-border/70 bg-background/95 p-3 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#161616]/95 md:hidden"
              >
                <nav
                  className="flex flex-col gap-1"
                  aria-label="Mobile Navigation"
                >
                  <Link
                    href="/"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 active:bg-secondary"
                  >
                    <span>Home</span>
                    <ChevronRight className="size-4 text-muted-foreground/60" />
                  </Link>

                  <Link
                    href="/showcase"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 active:bg-secondary"
                  >
                    <span>Showcase</span>
                    <ChevronRight className="size-4 text-muted-foreground/60" />
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 active:bg-secondary"
                  >
                    <span>Pricing</span>
                    <ChevronRight className="size-4 text-muted-foreground/60" />
                  </Link>
                </nav>

                <div className="my-2 h-px bg-border/60 dark:bg-white/10" />

                <Link
                  href="/auth"
                  onClick={() => setIsOpen(false)}
                  className="block w-full pt-1"
                >
                  <Button className="h-10 w-full cursor-pointer items-center justify-center rounded-lg bg-accent-lime text-sm font-semibold text-dark-obsidian shadow-xs transition-colors hover:bg-[#B8E12A]">
                    Sign in
                  </Button>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
}
