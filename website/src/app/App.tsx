import React from "react";
import { ThemeProvider } from "./providers/ThemeProvider";
import { MotionProvider } from "./providers/MotionProvider";
import { WebsiteRouter, useRouter } from "./router";
import { Navbar } from "@/components/navigation/Navbar";
import { Footer } from "@/components/navigation/Footer";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { NoiseOverlay } from "@/components/effects/NoiseOverlay";
import { useRouteMetadata } from "@/utils/seo";

export const App: React.FC = () => {
  const {
    currentHash,
    currentRoute,
    playgroundDemoId,
    featureCategoryId,
    docArticleSlug,
    activeSubId,
  } = useRouter();

  useRouteMetadata(currentRoute, activeSubId);

  return (
    <ThemeProvider>
      <MotionProvider>
        <div className="relative min-h-screen bg-[#07080a] text-slate-100 flex flex-col justify-between selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-clip">
          {/* Skip Link for Keyboard & Screen Reader Accessibility */}
          <a
            href="#main-content"
            onClick={(e) => {
              e.preventDefault();
              const target = document.getElementById("main-content");
              target?.focus();
            }}
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-600 focus:text-white focus:font-medium focus:shadow-lg"
          >
            Skip to main content
          </a>

          {/* Global Ambient Overlays */}
          <ScrollProgress height={3} />
          <NoiseOverlay opacity={0.03} />

          {/* Global Navigation Header */}
          <Navbar activeHref={currentHash} activeRoute={currentRoute} />

          {/* Active Page / Router Outlet */}
          <div id="main-content" tabIndex={-1} className="flex-1 w-full outline-none">
            <WebsiteRouter
              currentRoute={currentRoute}
              currentHash={currentHash}
              playgroundDemoId={playgroundDemoId}
              featureCategoryId={featureCategoryId}
              docArticleSlug={docArticleSlug}
            />
          </div>

          {/* Global Footer Architecture */}
          <Footer />
        </div>
      </MotionProvider>
    </ThemeProvider>
  );
};
