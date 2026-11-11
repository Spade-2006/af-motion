/**
 * AF Motion Design-to-Motion Presets (Prompt 142)
 *
 * 10 battle-tested design-to-motion template presets covering SaaS, portfolios,
 * landing pages, e-commerce, dashboards, editorial, mobile, interactive cards,
 * navigation systems, and hero sections.
 */

import type { DesignToMotionPreset } from "./types.js";

export const DESIGN_TO_MOTION_PRESETS: readonly DesignToMotionPreset[] = [
  {
    id: "dtm-preset-saas",
    name: "Premium SaaS Interface",
    description: "Crisp modal dialogs, subtle card lifts, and authoritative microinteractions for B2B applications.",
    category: "saas",
    defaultDNA: "precise",
    capabilities: ["modal_entrance", "card_lift", "tactile_feedback", "gpu_transforms"],
    defaultInput: {
      naturalLanguage: "Create a premium SaaS modal dialog with crisp entrance deceleration and tactile action button.",
      specification: {
        id: "spec-saas-modal",
        title: "SaaS Action Modal",
        elements: [
          {
            id: "saas-dialog",
            type: "modal",
            name: "Settings Modal",
            importance: "high",
            semanticRole: "surface",
            dimensions: { width: 520, height: 340 },
            interactionCapabilities: ["focus"],
          },
          {
            id: "saas-btn-confirm",
            type: "button",
            name: "Save Changes Button",
            parentId: "saas-dialog",
            importance: "high",
            semanticRole: "trigger",
            interactionCapabilities: ["hover", "press"],
          },
        ],
        rootId: "saas-dialog",
        viewportContext: { width: 1280, height: 800, isMobile: false },
      },
      tokens: {
        paletteName: "Cobalt Classic",
        motionDNA: "precise",
        timingMultiplier: 1.0,
      },
    },
  },
  {
    id: "dtm-preset-portfolio",
    name: "Portfolio Website",
    description: "Stately transitions, smooth project grid reveals, and magnetic cursor hover states.",
    category: "portfolio",
    defaultDNA: "elegant",
    capabilities: ["staggered_reveal", "magnetic_follow", "smooth_scale", "reduced_motion_fallback"],
    defaultInput: {
      naturalLanguage: "Create an elegant staggered project reveal with magnetic card hover effects.",
      specification: {
        id: "spec-portfolio-grid",
        title: "Selected Works Grid",
        elements: [
          {
            id: "portfolio-grid",
            type: "grid",
            name: "Projects Grid",
            importance: "high",
            semanticRole: "surface",
            layout: { display: "grid", gap: 24 },
          },
          {
            id: "proj-1",
            type: "card",
            name: "Fintech Rebrand Project",
            parentId: "portfolio-grid",
            importance: "medium",
            interactionCapabilities: ["hover", "press", "magnetic"],
          },
          {
            id: "proj-2",
            type: "card",
            name: "Spatial Architecture System",
            parentId: "portfolio-grid",
            importance: "medium",
            interactionCapabilities: ["hover", "press", "magnetic"],
          },
        ],
        rootId: "portfolio-grid",
        viewportContext: { width: 1280, height: 800, isMobile: false },
      },
      tokens: {
        paletteName: "Nordic Frost",
        motionDNA: "elegant",
        timingMultiplier: 1.1,
      },
    },
  },
  {
    id: "dtm-preset-landing",
    name: "High-Conversion Landing Page",
    description: "Punchy hero section with staggered headline reveals and high-visibility CTA pulses.",
    category: "landing-page",
    defaultDNA: "energetic",
    capabilities: ["staggered_typography", "cta_pulse", "dynamic_acceleration"],
    defaultInput: {
      naturalLanguage: "Punchy high-conversion landing page hero with headline entrance and glowing CTA.",
      specification: {
        id: "spec-landing-hero",
        title: "Landing Hero Section",
        elements: [
          {
            id: "landing-hero",
            type: "hero",
            name: "Main Hero Container",
            importance: "high",
            semanticRole: "surface",
          },
          {
            id: "hero-headline",
            type: "text",
            name: "Value Proposition Headline",
            parentId: "landing-hero",
            importance: "high",
            semanticRole: "content",
          },
          {
            id: "hero-cta-btn",
            type: "button",
            name: "Start Free Trial Button",
            parentId: "landing-hero",
            importance: "high",
            semanticRole: "trigger",
            interactionCapabilities: ["hover", "press"],
          },
        ],
        rootId: "landing-hero",
      },
      tokens: {
        paletteName: "Neo Neon",
        motionDNA: "energetic",
        timingMultiplier: 0.9,
      },
    },
  },
  {
    id: "dtm-preset-ecommerce",
    name: "E-Commerce Product Showcase",
    description: "Tactile add-to-cart buttons, product card depth elevation, and joyful confirmation feedback.",
    category: "ecommerce",
    defaultDNA: "playful",
    capabilities: ["button_press_squash", "cart_confirmation", "spring_bounce"],
    defaultInput: {
      naturalLanguage: "Playful e-commerce product card with spring bounce on hover and tactile button press.",
      specification: {
        id: "spec-ecommerce-card",
        title: "Product Item Card",
        elements: [
          {
            id: "product-card",
            type: "card",
            name: "Shoe Showcase Card",
            importance: "high",
            interactionCapabilities: ["hover"],
          },
          {
            id: "product-btn-add",
            type: "button",
            name: "Add to Bag Button",
            parentId: "product-card",
            importance: "high",
            semanticRole: "trigger",
            interactionCapabilities: ["hover", "press"],
          },
        ],
        rootId: "product-card",
      },
      tokens: {
        paletteName: "Sunset Glow",
        motionDNA: "playful",
        timingMultiplier: 1.0,
      },
    },
  },
  {
    id: "dtm-preset-dashboard",
    name: "Analytics Dashboard Interface",
    description: "High-density data widget entrances, real-time KPI card reveals, and silent micro-transitions.",
    category: "dashboard",
    defaultDNA: "precise",
    capabilities: ["kpi_entrance", "staggered_widgets", "minimal_reflow"],
    defaultInput: {
      naturalLanguage: "Precise telemetry dashboard cards with fast, non-distracting staggered entrance.",
      specification: {
        id: "spec-dashboard-grid",
        title: "Telemetry Dashboard",
        elements: [
          {
            id: "dash-container",
            type: "grid",
            name: "Metrics Grid",
            importance: "high",
          },
          {
            id: "metric-card-1",
            type: "card",
            name: "Revenue Card",
            parentId: "dash-container",
            importance: "medium",
          },
          {
            id: "metric-card-2",
            type: "card",
            name: "Active Users Card",
            parentId: "dash-container",
            importance: "medium",
          },
        ],
        rootId: "dash-container",
      },
      tokens: {
        paletteName: "Cyberpunk High-Contrast",
        motionDNA: "precise",
        timingMultiplier: 0.8,
      },
    },
  },
  {
    id: "dtm-preset-editorial",
    name: "Editorial Narrative Layout",
    description: "Sequential article pacing, smooth typographic reveals, and generous reading cadence.",
    category: "editorial",
    defaultDNA: "editorial-flow",
    capabilities: ["narrative_stagger", "typographic_reveal", "stately_curves"],
    defaultInput: {
      naturalLanguage: "Editorial magazine layout with flowing typographic entry and subtle paragraph sequencing.",
      specification: {
        id: "spec-editorial-article",
        title: "Feature Story Layout",
        elements: [
          {
            id: "editorial-container",
            type: "section",
            name: "Article Body",
            importance: "high",
          },
          {
            id: "story-headline",
            type: "text",
            name: "Article Title",
            parentId: "editorial-container",
            importance: "high",
          },
          {
            id: "story-body",
            type: "text",
            name: "Article Lead Paragraph",
            parentId: "editorial-container",
            importance: "medium",
          },
        ],
        rootId: "editorial-container",
      },
      tokens: {
        paletteName: "Monochrome Minimal",
        motionDNA: "editorial-flow",
        timingMultiplier: 1.2,
      },
    },
  },
  {
    id: "dtm-preset-mobile",
    name: "Mobile App Sheet & Navigation",
    description: "Bottom sheet reveal with spring dampening, swipe feedback, and touch microinteractions.",
    category: "mobile",
    defaultDNA: "playful",
    capabilities: ["bottom_sheet", "touch_feedback", "spring_damping"],
    defaultInput: {
      naturalLanguage: "Mobile bottom action sheet with smooth spring pop and tactile menu options.",
      specification: {
        id: "spec-mobile-sheet",
        title: "Mobile Bottom Sheet",
        elements: [
          {
            id: "bottom-sheet",
            type: "drawer",
            name: "Bottom Modal Sheet",
            importance: "high",
            semanticRole: "surface",
            interactionCapabilities: ["drag", "swipe"],
          },
          {
            id: "sheet-item-1",
            type: "button",
            name: "Share Link",
            parentId: "bottom-sheet",
            interactionCapabilities: ["press"],
          },
        ],
        rootId: "bottom-sheet",
      },
      tokens: {
        paletteName: "Purple Haze",
        motionDNA: "playful",
      },
    },
  },
  {
    id: "dtm-preset-interactive-cards",
    name: "Interactive Feature Cards",
    description: "Tilted hover depth, dynamic spotlight response, and spring-based press feedback.",
    category: "cards",
    defaultDNA: "precise",
    capabilities: ["card_hover_tilt", "surface_lighting", "spring_press"],
    defaultInput: {
      naturalLanguage: "Card component with smooth elevation on hover and spring scale press response.",
      specification: {
        id: "spec-feature-cards",
        title: "Feature Matrix",
        elements: [
          {
            id: "feature-card",
            type: "card",
            name: "Enterprise Feature Card",
            importance: "high",
            interactionCapabilities: ["hover", "press"],
          },
        ],
        rootId: "feature-card",
      },
      tokens: {
        paletteName: "Deep Emerald",
        motionDNA: "precise",
      },
    },
  },
  {
    id: "dtm-preset-navigation",
    name: "Floating Header Navigation",
    description: "Slide-down navigation bar entrance with link hover underlines and responsive drawer transitions.",
    category: "navigation",
    defaultDNA: "precise",
    capabilities: ["slide_down_header", "link_hover", "drawer_transition"],
    defaultInput: {
      naturalLanguage: "Sticky navigation bar that slides down smoothly on page load with interactive nav items.",
      specification: {
        id: "spec-nav-header",
        title: "Sticky Header Bar",
        elements: [
          {
            id: "nav-header-bar",
            type: "navigation",
            name: "Main Header",
            importance: "high",
          },
          {
            id: "nav-btn-action",
            type: "button",
            name: "Contact Sales",
            parentId: "nav-header-bar",
            interactionCapabilities: ["hover", "press"],
          },
        ],
        rootId: "nav-header-bar",
      },
      tokens: {
        paletteName: "Tokyo Midnight",
        motionDNA: "precise",
      },
    },
  },
  {
    id: "dtm-preset-hero",
    name: "Cinematic Hero Section",
    description: "Grand scale entrance with staggered headlines, particle background synchronization, and glowing CTA.",
    category: "hero",
    defaultDNA: "elegant",
    capabilities: ["cinematic_entrance", "staggered_content", "ambient_coupling"],
    defaultInput: {
      naturalLanguage: "Cinematic hero section with majestic headline entrance, subtle badge, and primary action button.",
      specification: {
        id: "spec-cinematic-hero",
        title: "World Stage Hero",
        elements: [
          {
            id: "hero-stage",
            type: "hero",
            name: "Hero World Container",
            importance: "high",
          },
          {
            id: "hero-badge",
            type: "badge",
            name: "Version 2.0 Badge",
            parentId: "hero-stage",
            importance: "low",
          },
          {
            id: "hero-title",
            type: "text",
            name: "Master Headline",
            parentId: "hero-stage",
            importance: "high",
          },
          {
            id: "hero-cta",
            type: "button",
            name: "Explore Platform",
            parentId: "hero-stage",
            importance: "high",
            interactionCapabilities: ["hover", "press"],
          },
        ],
        rootId: "hero-stage",
      },
      tokens: {
        paletteName: "Neon Cyber",
        motionDNA: "elegant",
        timingMultiplier: 1.15,
      },
    },
  },
];

export function listDesignToMotionPresets(): readonly DesignToMotionPreset[] {
  return DESIGN_TO_MOTION_PRESETS;
}

export function getDesignToMotionPreset(id: string): DesignToMotionPreset | undefined {
  return DESIGN_TO_MOTION_PRESETS.find((p) => p.id === id);
}
