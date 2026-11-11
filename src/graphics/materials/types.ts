/**
 * AF Motion Materials, Surfaces, Lighting & Glass Contracts
 *
 * Framework-independent definitions for configurable surfaces,
 * lighting systems, material lifecycles, and progressive glass effects.
 */

export type MaterialType =
  | "matte"
  | "metallic"
  | "glass"
  | "plastic"
  | "emissive"
  | "translucent"
  | "custom";

export interface MaterialUniforms {
  readonly [uniformName: string]: number | readonly number[] | string | boolean;
}

export interface MaterialProperty {
  readonly name: string;
  readonly type: "float" | "vec2" | "vec3" | "vec4" | "color" | "boolean" | "texture";
  readonly value: unknown;
  readonly min?: number;
  readonly max?: number;
}

export interface SurfaceBorderOptions {
  readonly width?: number | string;
  readonly style?: string;
  readonly color?: string;
  readonly radius?: number | string;
  readonly glow?: string;
}

export interface SurfaceHighlightOptions {
  readonly color?: string;
  readonly intensity?: number;
  readonly angle?: number;
  readonly spread?: number;
}

export interface SurfaceDefinition {
  readonly roughness?: number;
  readonly smoothness?: number;
  readonly opacity?: number;
  readonly transmission?: number;
  readonly baseColor?: string;
  readonly border?: SurfaceBorderOptions;
  readonly elevation?: number;
  readonly depth?: number;
  readonly highlight?: SurfaceHighlightOptions;
  readonly reflectivity?: number;
  readonly refractiveIndex?: number;
  readonly textureRef?: string;
  readonly textureScale?: number | readonly [number, number];
  readonly textureOffset?: readonly [number, number];
  readonly textureRepeat?: "repeat" | "no-repeat" | "repeat-x" | "repeat-y";
  readonly textureOpacity?: number;
  readonly blendMode?: "normal" | "multiply" | "screen" | "overlay" | "soft-light";
}

export interface SurfaceStyleResult {
  readonly background: string;
  readonly backgroundImage?: string;
  readonly backgroundSize?: string;
  readonly backgroundRepeat?: string;
  readonly backgroundPosition?: string;
  readonly backgroundBlendMode?: string;
  readonly backdropFilter?: string;
  readonly WebkitBackdropFilter?: string;
  readonly border: string;
  readonly borderRadius: string;
  readonly boxShadow: string;
  readonly opacity: number;
  readonly color?: string;
  readonly outline?: string;
  readonly transform?: string;
  readonly uniforms?: MaterialUniforms;
}

export interface AmbientLight {
  readonly color?: string;
  readonly intensity?: number;
}

export interface DirectionalLight {
  readonly direction?: readonly [number, number, number];
  readonly color?: string;
  readonly intensity?: number;
}

export interface PointLight {
  readonly position?: readonly [number, number, number];
  readonly color?: string;
  readonly intensity?: number;
  readonly attenuation?: number;
}

export interface HighlightConfig {
  readonly color?: string;
  readonly blur?: number | string;
  readonly angle?: number;
}

export interface ShadowConfig {
  readonly offset?: readonly [number, number];
  readonly blur?: number;
  readonly spread?: number;
  readonly color?: string;
  readonly opacity?: number;
  readonly inset?: boolean;
}

export interface EnvironmentLighting {
  readonly preset?: "studio" | "dramatic" | "ambient-soft" | "neon" | "sunset";
  readonly intensity?: number;
  readonly tint?: string;
}

export interface LightingConfig {
  readonly ambient?: AmbientLight;
  readonly directional?: DirectionalLight;
  readonly point?: PointLight;
  readonly highlight?: HighlightConfig;
  readonly shadows?: readonly ShadowConfig[];
  readonly environment?: EnvironmentLighting;
}

export interface ResolvedLighting {
  readonly ambientColor: string;
  readonly ambientIntensity: number;
  readonly primaryLightColor: string;
  readonly primaryLightDirection: readonly [number, number, number];
  readonly shadowsCss: string;
  readonly highlightCss: string;
  readonly uniforms: MaterialUniforms;
}

export interface MaterialDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: MaterialType;
  readonly version?: string;
  readonly surface: SurfaceDefinition;
  readonly lighting?: LightingConfig;
  readonly uniforms?: MaterialUniforms;
  readonly customShaders?: {
    readonly vertexShader?: string;
    readonly fragmentShader?: string;
  };
}

export type GlassPresetName =
  | "frosted-glass"
  | "clear-glass"
  | "tinted-glass"
  | "liquid-glass"
  | "acrylic"
  | "translucent-panel";

export interface GlassMaterialOptions {
  readonly preset?: GlassPresetName;
  readonly blur?: number;
  readonly opacity?: number;
  readonly tint?: string;
  readonly elevation?: number;
  readonly edgeHighlight?: boolean;
  readonly borderWidth?: number | string;
  readonly borderColor?: string;
  readonly borderRadius?: number | string;
  readonly refractiveIndex?: number;
  readonly highContrast?: boolean;
  readonly reducedMotion?: boolean;
}

export interface GlassStyleResult extends SurfaceStyleResult {
  readonly preset: GlassPresetName;
  readonly blur: number;
  readonly isFallback: boolean;
}
