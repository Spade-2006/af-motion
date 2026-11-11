import React, { Suspense, useState, useEffect } from "react";
import { HomePage } from "@/pages/HomePage";
import { FeaturesPage } from "@/pages/FeaturesPage";
import { PlaygroundPage } from "@/pages/PlaygroundPage";

const LazyOnboardingPage = React.lazy(() =>
  import("@/pages/OnboardingPage").then((m) => ({
    default: m.OnboardingPage,
  }))
);

const LazyDocsPage = React.lazy(() =>
  import("@/pages/DocsPage").then((m) => ({
    default: m.DocsPage,
  }))
);

const LazyExamplesPage = React.lazy(() =>
  import("@/pages/ExamplesPage").then((m) => ({
    default: m.ExamplesPage,
  }))
);

const LazyNotFoundPage = React.lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({
    default: m.NotFoundPage,
  }))
);

const LazyDesignSystemPreview = React.lazy(() =>
  import("@/sections/DesignSystemPreviewSection").then((m) => ({
    default: m.DesignSystemPreviewSection,
  }))
);

export type RouteId =
  | "home"
  | "features"
  | "onboarding"
  | "playground"
  | "docs"
  | "examples"
  | "design-system"
  | "not-found";

const HOME_SECTION_ANCHORS = [
  "#overview",
  "#introduction",
  "#capabilities",
  "#philosophy",
  "#get-started",
  "#developer-cta",
];

const RouteFallback: React.FC = () => (
  <main className="min-h-screen w-full flex items-center justify-center pt-24">
    <div
      role="status"
      aria-label="Loading page"
      className="flex flex-col items-center gap-3"
    >
      <div className="w-9 h-9 rounded-full border-2 border-indigo-500/20 border-t-cyan-400 animate-spin" />
      <span className="font-mono text-xs text-slate-500">Loading module...</span>
    </div>
  </main>
);

export function useRouter() {
  const [currentRoute, setCurrentRoute] = useState<RouteId>("home");
  const [currentHash, setCurrentHash] = useState<string>("#overview");
  const [playgroundDemoId, setPlaygroundDemoId] = useState<string | undefined>(
    undefined
  );
  const [featureCategoryId, setFeatureCategoryId] = useState<string | undefined>(
    undefined
  );
  const [docArticleSlug, setDocArticleSlug] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || "#overview";
      setCurrentHash(hash);

      if (hash === "#features" || hash.startsWith("#features/")) {
        const subCat = hash.includes("/") ? hash.split("/")[1] : undefined;
        setFeatureCategoryId(subCat || undefined);
        setCurrentRoute("features");
        if (!subCat && typeof window.scrollTo === "function") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (
        hash === "#onboarding" ||
        hash.startsWith("#onboarding-") ||
        hash.startsWith("#onboarding/") ||
        hash === "#get-started-guide"
      ) {
        setCurrentRoute("onboarding");
        if (hash.startsWith("#onboarding-")) {
          const anchorId = hash.slice(1);
          requestAnimationFrame(() => {
            const target = document.getElementById(anchorId);
            if (target && typeof target.scrollIntoView === "function") {
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          });
        } else if (typeof window.scrollTo === "function") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (hash === "#playground" || hash.startsWith("#playground/")) {
        const subId = hash.includes("/") ? hash.split("/")[1] : undefined;
        setPlaygroundDemoId(subId || undefined);
        setCurrentRoute("playground");
        if (typeof window.scrollTo === "function") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (hash === "#docs" || hash.startsWith("#docs/")) {
        const slug = hash.includes("/") ? hash.split("/")[1] : undefined;
        setDocArticleSlug(slug || undefined);
        setCurrentRoute("docs");
        if (typeof window.scrollTo === "function") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (hash === "#examples" || hash.startsWith("#examples/")) {
        setCurrentRoute("examples");
        if (typeof window.scrollTo === "function") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (hash === "#design-system") {
        setCurrentRoute("design-system");
        if (typeof window.scrollTo === "function") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      } else if (hash === "#" || hash === "" || HOME_SECTION_ANCHORS.includes(hash)) {
        setCurrentRoute("home");
        if (HOME_SECTION_ANCHORS.includes(hash)) {
          requestAnimationFrame(() => {
            const target = document.getElementById(hash.slice(1));
            if (target && typeof target.scrollIntoView === "function") {
              target.scrollIntoView({ behavior: "smooth" });
            }
          });
        }
      } else {
        setCurrentRoute("not-found");
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const activeSubId =
    currentRoute === "features"
      ? featureCategoryId
      : currentRoute === "playground"
      ? playgroundDemoId
      : currentRoute === "docs"
      ? docArticleSlug
      : undefined;

  return {
    currentRoute,
    currentHash,
    playgroundDemoId,
    featureCategoryId,
    docArticleSlug,
    activeSubId,
  };
}

export interface WebsiteRouterProps {
  readonly currentRoute?: RouteId;
  readonly currentHash?: string;
  readonly playgroundDemoId?: string;
  readonly featureCategoryId?: string;
  readonly docArticleSlug?: string;
}

export const WebsiteRouter: React.FC<WebsiteRouterProps> = (props) => {
  const internal = useRouter();
  const currentRoute = props.currentRoute ?? internal.currentRoute;
  const currentHash = props.currentHash ?? internal.currentHash;
  const playgroundDemoId = props.playgroundDemoId ?? internal.playgroundDemoId;
  const featureCategoryId = props.featureCategoryId ?? internal.featureCategoryId;
  const docArticleSlug = props.docArticleSlug ?? internal.docArticleSlug;

  switch (currentRoute) {
    case "features":
      return <FeaturesPage initialCategoryId={featureCategoryId} />;
    case "onboarding":
      return (
        <Suspense fallback={<RouteFallback />}>
          <LazyOnboardingPage />
        </Suspense>
      );
    case "playground":
      return <PlaygroundPage initialDemoId={playgroundDemoId} />;
    case "docs":
      return (
        <Suspense fallback={<RouteFallback />}>
          <LazyDocsPage initialArticleSlug={docArticleSlug} />
        </Suspense>
      );
    case "examples":
      return (
        <Suspense fallback={<RouteFallback />}>
          <LazyExamplesPage />
        </Suspense>
      );
    case "design-system":
      return (
        <main className="w-full flex flex-col">
          <Suspense fallback={<RouteFallback />}>
            <LazyDesignSystemPreview />
          </Suspense>
        </main>
      );
    case "not-found":
      return (
        <Suspense fallback={<RouteFallback />}>
          <LazyNotFoundPage invalidHash={currentHash} />
        </Suspense>
      );
    case "home":
    default:
      return <HomePage />;
  }
};
