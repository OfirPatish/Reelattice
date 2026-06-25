import { Download, ExternalLink } from "lucide-react";
import { GameButton } from "@/components/game-button";
import { HudFrame } from "@/components/hud-frame";
import { Reveal } from "@/components/reveal";
import { SystemRequirements } from "@/components/system-requirements";
import { APP_VERSION, DOWNLOAD_URL } from "@/lib/constants";
import { RELEASE_HIGHLIGHTS, releaseHighlightsHeading } from "@/lib/release-highlights";
import { GITHUB_RELEASES_URL } from "@/lib/site-content";

export const DownloadSection = () => (
  <section id="download" className="safe-x px-4 py-16 md:px-6 md:py-28">
    <div className="mx-auto max-w-3xl">
      <Reveal>
        <HudFrame glow="yellow" title="Final Stage">
          <div className="px-4 py-10 text-center sm:px-6 md:px-12 md:py-16">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.3em] text-yellow-400/80">
              Boss Defeated · Ready to Deploy
            </p>
            <h2 className="font-display mt-4 text-2xl font-black uppercase leading-tight text-white min-[420px]:text-3xl md:text-4xl">
              Press Start on
              <br />
              <span className="text-neon-yellow">Windows</span>
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-sm text-slate-400">
              Reelattice v{APP_VERSION} · Signed installer · In-app updates · Free &amp; open
              source · Your footage never leaves your machine
            </p>

            <SystemRequirements />

            <div className="mx-auto mt-6 max-w-md rounded border border-yellow-500/20 bg-yellow-500/[0.04] px-4 py-3 text-left">
              <p className="font-display text-[10px] font-bold uppercase tracking-widest text-yellow-400/90">
                {releaseHighlightsHeading()}
              </p>
              <ul className="mt-2 space-y-1.5">
                {RELEASE_HIGHLIGHTS.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-xs leading-relaxed text-slate-400 before:shrink-0 before:text-yellow-500/70 before:content-['▸']"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
                Full release history is in the app under Changelog.
              </p>
            </div>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:items-center">
              <GameButton
                href={DOWNLOAD_URL}
                className="press-start w-full px-10 py-4 text-sm sm:w-auto"
                ariaLabel="Download Reelattice for Windows"
              >
                <Download className="size-5" aria-hidden />
                Download Installer
              </GameButton>
              <a
                href={GITHUB_RELEASES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 font-display text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
              >
                <ExternalLink className="size-3.5" aria-hidden />
                Browse on GitHub
              </a>
            </div>
          </div>
        </HudFrame>
      </Reveal>
    </div>
  </section>
);
