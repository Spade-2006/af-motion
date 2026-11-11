import { useEffect } from "react";
import type { RouteId } from "@/app/router";
import { SITE_CONFIG } from "@/config/site";

export const CANONICAL_ORIGIN = "https://af-motion.dev/";

export interface RouteMetadataSpec {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
}

function formatSlugLabel(slug: string): string {
  return slug
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const ROUTE_BASE_META: Readonly<Record<RouteId, RouteMetadataSpec>> = {
  home: {
    title: "AF Motion — Kinetic Architecture for the Modern Web",
    description: SITE_CONFIG.description,
    canonicalUrl: CANONICAL_ORIGIN,
  },
  features: {
    title: "Features & Architecture — AF Motion",
    description:
      "Explore AF Motion core animation primitives, visual effects, Motion Intelligence, 33 palettes, Motion DNA, 3D/GPU pipelines, and React 18/19 integrations.",
    canonicalUrl: `${CANONICAL_ORIGIN}#features`,
  },
  onboarding: {
    title: "Developer Onboarding Guide — AF Motion",
    description:
      "Install AF Motion with npm, pnpm, yarn, or bun, run your first GPU animation, configure React 18/19 Strict Mode bindings, and track optional progress.",
    canonicalUrl: `${CANONICAL_ORIGIN}#onboarding`,
  },
  playground: {
    title: "Interactive Playground — AF Motion",
    description:
      "Experiment live with AF Motion animate(), easing curves, spring physics, timelines, Motion DNA, 3D PBR geometries, deterministic AI tools, and 39 presets.",
    canonicalUrl: `${CANONICAL_ORIGIN}#playground`,
  },
  examples: {
    title: "Verified Animation Examples — AF Motion",
    description:
      "Curated live examples across entrances, magnetic buttons, 3D perspective tilt, scroll depth, springs, aurora shaders, and synchronized timelines.",
    canonicalUrl: `${CANONICAL_ORIGIN}#examples`,
  },
  docs: {
    title: "Documentation & API Hub — AF Motion",
    description:
      "Search AF Motion documentation articles, browse 1,940 public exports across all four subpaths, and follow structured learning paths.",
    canonicalUrl: `${CANONICAL_ORIGIN}#docs`,
  },
  "design-system": {
    title: "Design System Preview — AF Motion",
    description:
      "Inspect AF Motion visual tokens, dark surfaces, interactive UI controls, and typography scales.",
    canonicalUrl: `${CANONICAL_ORIGIN}#design-system`,
  },
  "not-found": {
    title: "404 Route Not Found — AF Motion",
    description:
      "The requested AF Motion hash route was not found. Navigate back to Overview, Features, Onboarding, Playground, Examples, or Docs.",
    canonicalUrl: CANONICAL_ORIGIN,
  },
};

export function getMetadataForRoute(
  route: RouteId,
  subId?: string
): RouteMetadataSpec {
  const base = ROUTE_BASE_META[route] ?? ROUTE_BASE_META.home;
  if (!subId) return base;

  const cleanSubId = subId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!cleanSubId) return base;

  const label = formatSlugLabel(cleanSubId);

  switch (route) {
    case "features":
      return {
        title: `${label} — Features — AF Motion`,
        description: `Explore ${label} capabilities, APIs, interactive demos, and architecture patterns in AF Motion.`,
        canonicalUrl: `${CANONICAL_ORIGIN}#features/${cleanSubId}`,
      };
    case "playground":
      return {
        title: `${label} — Playground — AF Motion`,
        description: `Interactive ${label} laboratory in AF Motion with live parameters and TypeScript code inspection.`,
        canonicalUrl: `${CANONICAL_ORIGIN}#playground/${cleanSubId}`,
      };
    case "docs":
      return {
        title: `${label} — Documentation — AF Motion`,
        description: `Official AF Motion guide and API reference for ${label}.`,
        canonicalUrl: `${CANONICAL_ORIGIN}#docs/${cleanSubId}`,
      };
    default:
      return base;
  }
}

export function buildStructuredDataGraph(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: SITE_CONFIG.name,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Cross-platform",
        softwareVersion: SITE_CONFIG.version,
        programmingLanguage: "TypeScript",
        license: "https://opensource.org/licenses/MIT",
        url: CANONICAL_ORIGIN,
        codeRepository: SITE_CONFIG.links.github,
        description: SITE_CONFIG.description,
        author: {
          "@type": "Person",
          name: "Satyansh Acharya",
        },
      },
      {
        "@type": "WebSite",
        name: SITE_CONFIG.name,
        url: CANONICAL_ORIGIN,
        description: SITE_CONFIG.description,
      },
      {
        "@type": "Organization",
        name: SITE_CONFIG.name,
        url: CANONICAL_ORIGIN,
        sameAs: [SITE_CONFIG.links.github, SITE_CONFIG.links.npm],
      },
    ],
  };
}

function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  if (typeof document === "undefined") return;
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function applyRouteMetadata(route: RouteId, subId?: string): RouteMetadataSpec {
  const spec = getMetadataForRoute(route, subId);
  if (typeof document === "undefined") return spec;

  document.title = spec.title;
  upsertMeta("name", "description", spec.description);
  upsertMeta("property", "og:title", spec.title);
  upsertMeta("property", "og:description", spec.description);
  upsertMeta("property", "og:url", spec.canonicalUrl);
  upsertMeta("name", "twitter:title", spec.title);
  upsertMeta("name", "twitter:description", spec.description);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", spec.canonicalUrl);

  let ldScript = document.head.querySelector<HTMLScriptElement>("#af-motion-jsonld");
  if (!ldScript) {
    ldScript = document.createElement("script");
    ldScript.id = "af-motion-jsonld";
    ldScript.type = "application/ld+json";
    document.head.appendChild(ldScript);
  }
  ldScript.textContent = JSON.stringify(buildStructuredDataGraph());

  return spec;
}

export function useRouteMetadata(route: RouteId, subId?: string): void {
  useEffect(() => {
    applyRouteMetadata(route, subId);
  }, [route, subId]);
}
