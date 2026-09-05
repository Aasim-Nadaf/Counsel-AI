"use client";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  type FREQUENCY,
  FrequencyToggle,
} from "@/components/sections/pricing/frequency-toggle";
import { StarIcon, CheckCircleIcon } from "lucide-react";

type Plan = {
  name: string;
  info: string;
  price: {
    monthly: number;
    yearly: number; // yearly per month
  };
  features: string[];
  btn: {
    text: string;
    href: string;
  };
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Advocate",
    info: "For solo advocates & legal scholars",
    price: {
      monthly: 7,
      yearly: 6,
    },
    features: [
      "Accurate Indian statute & code lookup",
      "Supreme Court precedent research",
      "BNS, BNSS & BSA transition guides",
      "100% verified judgment citations",
      "Up to 150 legal queries / month",
      "Standard PDF & Word brief export",
    ],
    btn: {
      text: "Start Free Trial",
      href: "/auth",
    },
  },
  {
    highlighted: true,
    name: "Counsel Pro",
    info: "For active litigators & chambers",
    price: {
      monthly: 17,
      yearly: 14,
    },
    features: [
      "Unlimited legal research & queries",
      "All 25 High Courts & Supreme Court",
      "Automated petition & notice drafting",
      "Legacy IPC to new BNS cross-mapping",
      "Zero-Hallucination citation guarantee",
      "Case law ratio decidendi analysis",
      "Priority research processing speed",
    ],
    btn: {
      text: "Get Started with Pro",
      href: "/auth",
    },
  },
  {
    name: "Law Firm",
    info: "For legal firms & corporate counsel",
    price: {
      monthly: 49,
      yearly: 40,
    },
    features: [
      "Multi-advocate shared chamber workspace",
      "All Tribunals (NCLT, ITAT, NGT, SAT)",
      "Bulk contract & case dossier analysis",
      "Custom precedent & firm archive indexing",
      "Audit-ready citation trail & exports",
      "Enterprise security & confidentiality SLA",
      "Dedicated legal AI account manager",
    ],
    btn: {
      text: "Contact Legal Sales",
      href: "/auth",
    },
  },
];

export function PricingSection() {
  const [frequency, setFrequency] = React.useState<"monthly" | "yearly">(
    "monthly",
  );

  return (
    <div className="flex w-full flex-col items-center justify-center space-y-7 p-4 mt-10    ">
      <div className="mx-auto max-w-xl space-y-2">
        <h2 className="text-center font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
          Precision Legal Intelligence Plans
        </h2>
        <p className="text-center text-muted-foreground text-sm md:text-base">
          100% verified citations, zero hallucinations. Tailored research plans
          for solo advocates, litigators, and law firms across India.
        </p>
      </div>

      <FrequencyToggle frequency={frequency} setFrequency={setFrequency} />
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard frequency={frequency} key={plan.name} plan={plan} />
        ))}
      </div>
    </div>
  );
}

type PricingCardProps = React.ComponentProps<"div"> & {
  plan: Plan;
  frequency?: FREQUENCY;
};

export function PricingCard({
  plan,
  className,
  frequency = "monthly",
  ...props
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-lg border shadow-xs",
        plan.highlighted && "scale-105",
        className,
      )}
      key={plan.name}
      {...props}
    >
      <div
        className={cn(
          "border-b p-4",
          plan.highlighted && "bg-card dark:bg-card/80",
        )}
      >
        <AnimatePresence mode="wait">
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
            {plan.highlighted && (
              <motion.div
                className="flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-xs"
                key="popular-badge"
                layout
                transition={{ duration: 0.1 }}
              >
                <StarIcon className="size-3 fill-current" />
                Popular
              </motion.div>
            )}

            {frequency === "yearly" &&
              plan.price.monthly > plan.price.yearly && (
                <motion.div
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 rounded-md border bg-primary px-2 py-0.5 text-primary-foreground text-xs"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  key="discount-badge"
                  layout
                  transition={{ duration: 0.15 }}
                >
                  {/* Calculate the actual discount percentage of the plan */}
                  {Math.round(
                    ((plan.price.monthly - plan.price.yearly) /
                      plan.price.monthly) *
                      100,
                  )}
                  % off
                </motion.div>
              )}
          </div>
        </AnimatePresence>

        <div className="font-medium text-lg">{plan.name}</div>
        <p className="font-normal text-muted-foreground text-sm">{plan.info}</p>
        <h3 className="mt-6 mb-1 flex w-max items-end gap-1">
          <NumberFlow
            className="font-extrabold text-3xl [&::part(suffix)]:font-normal [&::part(suffix)]:text-base [&::part(suffix)]:text-muted-foreground"
            format={{
              style: "currency",
              currency: "USD",
              notation: "compact",
            }}
            suffix="/month"
            value={plan.price[frequency]}
          />
        </h3>
        <p className="mb-2 font-normal text-muted-foreground text-xs">
          billed {frequency}
        </p>
      </div>
      <div
        className={cn(
          "space-y-3 px-4 pt-6 pb-8 text-muted-foreground text-sm",
          plan.highlighted && "bg-muted/10",
        )}
      >
        {plan.features.map((feature) => (
          <div className="flex items-center gap-2" key={feature}>
            <CheckCircleIcon className="size-3.5 text-foreground" />
            <p>{feature}</p>
          </div>
        ))}
      </div>
      <div
        className={cn(
          "mt-auto w-full border-t p-3",
          plan.highlighted && "bg-card dark:bg-card/80",
        )}
      >
        <Button
          className="w-full"
          variant={plan.highlighted ? "default" : "outline"}
        >
          <Link href={plan.btn.href}>{plan.btn.text}</Link>
        </Button>
      </div>
    </div>
  );
}
