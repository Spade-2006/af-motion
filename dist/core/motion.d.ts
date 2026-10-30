/** True when the user prefers reduced motion. Safe where `matchMedia` is missing. */
export declare function prefersReducedMotion(): boolean;
/**
 * Calls `listener` when the reduced-motion preference changes. Returns an unsubscribe
 * function; both are no-ops where `matchMedia` change events are unavailable.
 */
export declare function onReducedMotionChange(listener: (reduced: boolean) => void): () => void;
//# sourceMappingURL=motion.d.ts.map