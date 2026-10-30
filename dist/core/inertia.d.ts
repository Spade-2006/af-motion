export interface InertiaOptions {
    /** Starting position. Defaults to 0. */
    from?: number;
    /** Initial velocity in position units per second. Defaults to 1000. */
    initialVelocity?: number;
    /** Exponential velocity decay per second. Must be finite and > 0. Defaults to 8. */
    friction?: number;
    /** Minimum speed in position units per second at which motion settles. Defaults to 10. */
    minVelocity?: number;
    /** Optional lower position bound. */
    min?: number;
    /** Optional upper position bound. */
    max?: number;
    /** Called on each shared animation frame with position and velocity. */
    onUpdate: (state: InertiaUpdate) => void;
    /** Called once when velocity settles, a bound is reached, or reduced motion completes. */
    onComplete?: () => void;
    /** Defaults to true. */
    respectReducedMotion?: boolean;
}
export interface InertiaUpdate {
    position: number;
    velocity: number;
}
export interface InertiaControls {
    /** Stops the inertia motion and suppresses subsequent update and completion callbacks. */
    cancel(): void;
}
/** Animates position using exponentially decaying velocity on the shared frame scheduler. */
export declare function animateInertia(options: InertiaOptions): InertiaControls;
//# sourceMappingURL=inertia.d.ts.map