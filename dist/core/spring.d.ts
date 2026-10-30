export interface SpringConfig {
    /** Spring stiffness. Must be finite and greater than zero. Defaults to 170. */
    stiffness?: number;
    /** Friction coefficient. Must be finite and non-negative. Defaults to 26. */
    damping?: number;
    /** Mass. Must be finite and greater than zero. Defaults to 1. */
    mass?: number;
    /** Initial velocity in position units per second. Defaults to 0. */
    initialVelocity?: number;
    /** Position error at which the spring may settle. Defaults to 0.01. */
    restDelta?: number;
    /** Absolute velocity below which the spring may settle. Defaults to 0.01. */
    restSpeed?: number;
}
export interface SpringUpdate {
    position: number;
    velocity: number;
}
export interface SpringOptions {
    /** Starting position. Defaults to 0. */
    from?: number;
    /** Target position. Defaults to 1. */
    to?: number;
    /** Spring constants and settling thresholds. */
    config?: SpringConfig;
    /** Called on each shared animation frame with position and velocity. */
    onUpdate: (state: SpringUpdate) => void;
    /** Called once when the spring settles or reduced motion completes it. */
    onComplete?: () => void;
    /** Defaults to true. */
    respectReducedMotion?: boolean;
}
export interface SpringControls {
    /** Stops the spring and suppresses subsequent update and completion callbacks. */
    cancel(): void;
}
/** Animates a scalar spring using the library's shared animation-frame scheduler. */
export declare function animateSpring(options: SpringOptions): SpringControls;
//# sourceMappingURL=spring.d.ts.map