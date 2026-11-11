import type React from "react";

export type DemoCategory =
  | "Core"
  | "Timing & Physics"
  | "Effects"
  | "Choreography"
  | "3D & GPU"
  | "AI & Presets";

export type CodeLanguage = "ts" | "js";

export interface DemoComponentProps {
  /** Monotonically incremented when the user triggers Run / Replay from the toolbar */
  readonly playNonce: number;
  /** Monotonically incremented when the user clicks Reset */
  readonly resetNonce: number;
  /** Whether continuous playback is paused via toolbar (where applicable) */
  readonly isPaused: boolean;
  /** Callback to sync generated source code into the Code Inspector */
  readonly onCodeChange: (tsCode: string, jsCode?: string) => void;
  /** Callback to update the status badge text in the toolbar */
  readonly onStatusChange?: (status: string) => void;
}

export interface DemoDefinition {
  readonly id: string;
  readonly title: string;
  readonly shortLabel: string;
  readonly category: DemoCategory;
  readonly subpath: "af-motion" | "af-motion/react" | "af-motion/catalogue" | "af-motion/presets";
  readonly description: string;
  readonly isHeavy?: boolean;
  readonly load: () => Promise<{ default: React.ComponentType<DemoComponentProps> }>;
}
