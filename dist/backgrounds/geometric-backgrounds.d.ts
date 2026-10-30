import type { AnimateTarget } from "../core/animate.js";
export type GeometricBackgroundEffect = "grid" | "tech-circuit" | "polygon-mesh" | "hexagon-field" | "perspective-floor";
export type GeometricGridShape = "square" | "dot" | "diamond" | "hexagon";
export interface GeometricBackgroundBaseOptions {
    /** Visual treatment. Defaults to "grid". */
    effect?: GeometricBackgroundEffect;
    /** CSS colors for the geometry, or palette primary/secondary/accent colors. */
    colors?: readonly string[];
    /** Registered built-in/custom palette name, or "active" to follow active palette changes. */
    palette?: string;
    /** Animation speed multiplier. Set to 0 for a static scene. Defaults to 1. */
    speed?: number;
    /** Overall intensity from 0 to 1. Defaults to 0.65. */
    intensity?: number;
}
export interface GeometricGridOptions extends GeometricBackgroundBaseOptions {
    effect?: "grid";
    /** Grid geometry. Defaults to "square". */
    shape?: GeometricGridShape;
    /** Distance between grid points/lines in CSS pixels. Defaults to 48. */
    spacing?: number;
    /** Grid line width or dot radius in CSS pixels. Defaults to 1. */
    lineWeight?: number;
    /** Layer opacity from 0 to 1. Defaults to 0.35. */
    opacity?: number;
    /** Perspective strength from 0 (flat) to 1 (strong convergence). Defaults to 0. */
    perspective?: number;
}
export interface TechCircuitOptions extends GeometricBackgroundBaseOptions {
    effect: "tech-circuit";
    /** Circuit trace spacing in CSS pixels. Defaults to 72. */
    spacing?: number;
    /** Relative path/node density from 0.1 to 3. Defaults to 1. */
    density?: number;
    /** Circuit stroke width in CSS pixels. Defaults to 1.25. */
    lineWeight?: number;
}
export interface PolygonMeshOptions extends GeometricBackgroundBaseOptions {
    effect: "polygon-mesh";
    /** Approximate distance between mesh vertices in CSS pixels. Defaults to 96. */
    spacing?: number;
    /** Vertex displacement from the regular lattice, from 0 to 1. Defaults to 0.2. */
    irregularity?: number;
    /** Maximum mesh-link distance in multiples of spacing. Defaults to 1.55. */
    connectionRange?: number;
    /** Mesh stroke width in CSS pixels. Defaults to 1. */
    lineWeight?: number;
}
export interface HexagonFieldOptions extends GeometricBackgroundBaseOptions {
    effect: "hexagon-field";
    /** Horizontal distance between hexagon centers in CSS pixels. Defaults to 56. */
    spacing?: number;
    /** Hexagon stroke width in CSS pixels. Defaults to 1. */
    lineWeight?: number;
    /** Whether the pattern has subtle continuous movement. Defaults to false. */
    animate?: boolean;
}
export interface PerspectiveFloorOptions extends GeometricBackgroundBaseOptions {
    effect: "perspective-floor";
    /** Floor grid spacing in CSS pixels. Defaults to 48. */
    spacing?: number;
    /** Vertical location of the horizon from 0 (top) to 0.9 (near bottom). Defaults to 0.38. */
    horizon?: number;
    /** Animated floor movement multiplier from 0 to 5. Defaults to 1. */
    movement?: number;
    /** Perspective grid line width in CSS pixels. Defaults to 1. */
    lineWeight?: number;
}
export type GeometricBackgroundOptions = GeometricGridOptions | TechCircuitOptions | PolygonMeshOptions | HexagonFieldOptions | PerspectiveFloorOptions | GeometricBackgroundBaseOptions;
export interface GeometricBackgroundControls {
    /** Stops animation, removes the canvas, and restores target styles. Safe to repeat. */
    destroy(): void;
}
/**
 * Renders one of five Canvas geometric backgrounds with shared responsive,
 * reduced-motion-aware, palette-aware lifecycle management.
 */
export declare function geometricBackground(target: AnimateTarget, options?: GeometricBackgroundOptions): GeometricBackgroundControls;
//# sourceMappingURL=geometric-backgrounds.d.ts.map