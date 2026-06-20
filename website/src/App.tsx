import { SiteHeader } from "@/components/site-header";
import { HeroSection } from "@/components/hero-section";
import { FeaturesSection } from "@/components/features-section";
import { WorkflowSection } from "@/components/workflow-section";
import { DownloadSection } from "@/components/download-section";
import { SiteFooter } from "@/components/site-footer";
import { AchievementToast } from "@/components/achievement-toast";

export const App = () => (
  <div className="relative min-h-screen overflow-x-hidden bg-[#06080f]">
    <div
      aria-hidden
      className="grid-floor pointer-events-none fixed inset-0 -z-20 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
    />
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,240,255,0.08),transparent)]"
    />
    <div aria-hidden className="scanlines pointer-events-none fixed inset-0 z-50 opacity-30" />

    <AchievementToast />
    <SiteHeader />
    <main>
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <DownloadSection />
    </main>
    <SiteFooter />
  </div>
);
