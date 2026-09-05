"use client";
import Prompt from "@/components/sections/Prompt";
import dynamic from "next/dynamic";

const GradientWaves = dynamic(() => import("@/components/ui/GradientWaves"), {
  ssr: false,
});

export default function HeroSection() {
  return (
    <section className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden px-4 pb-10 pt-6 md:pb-16 md:pt-8">
      {/* Ambient Gradient Waves Background */}
      <div className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-100 dark:opacity-35">
        <GradientWaves
          horizonColor="#C8F135"
          waveColor="#F5F2EC"
          crestColor="#0F0F0F"
          speed={0.15}
          amplitude={1.25}
          waveScale={1.25}
          waveRatio={1.85}
          swell={28}
          turbulence={16}
          tilt={1.1}
          zoom={1.05}
          height={4.2}
          fogDepth={20}
          detail="medium"
          brightness={1.0}
          opacity={1.2}
          mouseInteraction={false}
          parallaxStrength={0.4}
          grain={false}
          grainIntensity={0.03}
        />
      </div>

      {/* Soft Vignette Mask blending into page background */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_100%,var(--background)_100%)]" />

      <Prompt />
    </section>
  );
}
