/**
 * AF Motion 3D Material Intelligence Contracts
 */

import type { Material3DType, MaterialSpec } from "../schemas/types.js";

export type Material3DPresetName =
  | "chrome"
  | "gold"
  | "frosted-glass"
  | "clear-glass"
  | "matte-plastic"
  | "glossy-plastic"
  | "velvet"
  | "neon-glow";

export interface Standard3DMaterialSpec extends MaterialSpec {
  readonly type: "standard" | "physical";
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
  readonly clearcoat?: number;
  readonly clearcoatRoughness?: number;
}

export interface Glass3DMaterialSpec extends MaterialSpec {
  readonly type: "physical";
  readonly transmission: number;
  readonly ior: number;
  readonly thickness?: number;
  readonly dispersion?: number;
  readonly attenuationColor?: string;
  readonly attenuationDistance?: number;
}

export interface Fabric3DMaterialSpec extends MaterialSpec {
  readonly type: "physical";
  readonly sheen?: number;
  readonly sheenColor?: string;
  readonly sheenRoughness?: number;
}

export interface Emissive3DMaterialSpec extends MaterialSpec {
  readonly type: "basic" | "standard";
  readonly emissive: string;
  readonly emissiveIntensity: number;
}

export interface IntelligentMaterial3DConfig extends MaterialSpec {
  readonly preset?: Material3DPresetName;
  readonly emissive?: string;
  readonly emissiveIntensity?: number;
  readonly clearcoat?: number;
  readonly clearcoatRoughness?: number;
  readonly sheen?: number;
  readonly sheenColor?: string;
  readonly thickness?: number;
  readonly dispersion?: number;
}
