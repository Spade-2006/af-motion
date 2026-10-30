import type { ScrollTriggerOptions } from "./scroll-trigger.js";
import type { AnimateTarget } from "../core/animate.js";
export type InViewCleanup = () => void;
export type InViewCallback = (element: HTMLElement, entry: IntersectionObserverEntry) => void | InViewCleanup;
export type InViewOptions = Pick<ScrollTriggerOptions, "rootMargin" | "threshold" | "once">;
export interface InViewControls {
    /** Stops observing targets and runs cleanup for every currently visible target. */
    destroy(): void;
}
/**
 * Runs a callback when a target enters the viewport, and its optional cleanup when
 * that target leaves or the observer is destroyed.
 */
export declare function inView(target: AnimateTarget, callback: InViewCallback, options?: InViewOptions): InViewControls;
//# sourceMappingURL=in-view.d.ts.map