import type { AnimateTarget } from "../core/animate.js";
export interface ScrollTriggerOptions {
    /** Called when an observed element enters the configured viewport region. */
    onEnter?: (element: HTMLElement, entry: IntersectionObserverEntry) => void;
    /** Called when an element that entered leaves the configured viewport region. */
    onLeave?: (element: HTMLElement, entry: IntersectionObserverEntry) => void;
    /** IntersectionObserver root margin. Defaults to "0px". */
    rootMargin?: string;
    /** IntersectionObserver threshold (0..1 or a list). Defaults to 0. */
    threshold?: number | number[];
    /** Observe one enter/leave cycle per element. Defaults to true. */
    once?: boolean;
}
export interface ScrollTriggerControls {
    /** Stops observing all targets. Safe to call repeatedly. */
    destroy(): void;
}
/**
 * Calls transition callbacks as elements enter and leave an observer's viewport region.
 * In one-time mode, each element is observed through its first complete visible cycle.
 */
export declare function scrollTrigger(target: AnimateTarget, options?: ScrollTriggerOptions): ScrollTriggerControls;
//# sourceMappingURL=scroll-trigger.d.ts.map