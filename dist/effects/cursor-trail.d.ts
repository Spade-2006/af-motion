import type { AnimateTarget } from "../core/animate.js";
export type CursorTrailTarget = AnimateTarget | Document;
export interface CursorTrailOptions {
    /** CSS particle color. Defaults to violet. */
    color?: string;
    /** Maximum number of simultaneously visible particles. Defaults to 12. */
    particleCount?: number;
    /** Particle diameter in pixels. Must be > 0. Defaults to 6. */
    size?: number;
    /** Particle lifetime in milliseconds. Must be > 0. Defaults to 500. */
    duration?: number;
    /** Track the document, an element, or all elements matching a selector. Defaults to document. */
    target?: CursorTrailTarget;
}
export interface CursorTrailControls {
    /** Removes listeners, cancels active animations, and removes the overlay. Safe to repeat. */
    destroy(): void;
}
/**
 * Emits a fading particle trail from pointer movement. Particle animations are individual
 * Web Animations; there is no per-frame JavaScript loop.
 */
export declare function cursorTrail(options?: CursorTrailOptions): CursorTrailControls;
//# sourceMappingURL=cursor-trail.d.ts.map