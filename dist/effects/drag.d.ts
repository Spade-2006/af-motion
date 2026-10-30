import type { AnimateTarget } from "../core/animate.js";
export type DragAxis = "x" | "y" | "both";
export interface DragPosition {
    readonly x: number;
    readonly y: number;
}
export interface DragOptions {
    /** Axes that may move. Defaults to "both". */
    axis?: DragAxis;
    /** Optional movement bounds in pixels relative to the starting position. */
    bounds?: {
        minX?: number;
        maxX?: number;
        minY?: number;
        maxY?: number;
    };
    /** Continue with decaying pointer velocity after release. Defaults to true. */
    inertia?: boolean;
    /** Exponential velocity decay per second. Must be > 0. Defaults to 8. */
    friction?: number;
    /** Called when a primary pointer starts dragging. */
    onDragStart?: (position: DragPosition) => void;
    /** Called as the element moves, including during inertia. */
    onDrag?: (position: DragPosition) => void;
    /** Called on release or cancellation; cancelled is true for pointer cancellation. */
    onDragEnd?: (position: DragPosition, cancelled: boolean) => void;
}
export interface DragControls {
    /** Cancels active dragging and momentum, removes listeners, and restores original styles. */
    destroy(): void;
}
/**
 * Moves elements in response to an active pointer gesture. The transform is a composable layer,
 * so it can be combined with hover, tilt, and magnetic effects without replacing their transforms.
 */
export declare function drag(target: AnimateTarget, options?: DragOptions): DragControls;
//# sourceMappingURL=drag.d.ts.map