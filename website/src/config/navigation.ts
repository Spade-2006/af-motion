/**
 * AF Motion Website — Navigation Architecture
 */

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly routeId?:
    | "home"
    | "features"
    | "onboarding"
    | "playground"
    | "docs"
    | "examples";
  readonly badge?: string;
  readonly isExternal?: boolean;
}

export const MAIN_NAV_ITEMS: readonly NavItem[] = [
  { label: "Home", href: "#overview", routeId: "home" },
  { label: "Features", href: "#features", routeId: "features" },
  { label: "Onboarding", href: "#onboarding", routeId: "onboarding" },
  { label: "Playground", href: "#playground", routeId: "playground" },
  { label: "Examples", href: "#examples", routeId: "examples" },
  { label: "Documentation", href: "#docs", routeId: "docs" },
  { label: "GitHub", href: "https://github.com/Spade-2006/af-motion", isExternal: true },
];

export interface FooterLinkItem {
  readonly label: string;
  readonly href: string;
  readonly isExternal?: boolean;
}

export const FOOTER_LINKS: {
  readonly architecture: readonly FooterLinkItem[];
  readonly ecosystem: readonly FooterLinkItem[];
  readonly resources: readonly FooterLinkItem[];
} = {
  architecture: [
    { label: "Core Animation Engine", href: "#features/core-animation" },
    { label: "Visual Effects & Gestures", href: "#features/visual-effects" },
    { label: "React 18 & 19 Bindings", href: "#features/framework-integrations" },
    { label: "3D & GPU Shaders", href: "#features/three-gpu" },
  ],
  ecosystem: [
    { label: "Motion Design System", href: "#features/design-system" },
    { label: "33 Built-in Palettes", href: "#features/design-system" },
    { label: "Deterministic AI Intelligence", href: "#features/motion-intelligence" },
    { label: "Developer Onboarding", href: "#onboarding" },
  ],
  resources: [
    { label: "Features Reference", href: "#features" },
    { label: "Live Playground", href: "#playground" },
    { label: "Verified Examples", href: "#examples" },
    { label: "GitHub Repository", href: "https://github.com/Spade-2006/af-motion", isExternal: true },
  ],
} as const;
