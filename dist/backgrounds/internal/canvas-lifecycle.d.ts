export interface CanvasBackgroundState {
    readonly element: HTMLElement;
    readonly canvas: HTMLCanvasElement;
    readonly context: CanvasRenderingContext2D;
    width: number;
    height: number;
}
export interface MotionFrameSchedulerOptions<T> {
    readonly speed: number;
    readonly animated: boolean;
    readonly errorName: string;
    readonly update: (state: T, elapsedSeconds: number, time: number) => void;
    readonly renderStatic: () => void;
}
export interface MotionFrameScheduler<T> {
    readonly isReducedMotion: boolean;
    setVisible(state: T, visible: boolean): void;
    destroy(): void;
}
export declare function resolveBackgroundColors(name: string | undefined, fallback: readonly string[]): readonly string[];
export declare function subscribeToActiveBackgroundPalette(name: string | undefined, fallback: readonly string[], onColors: (colors: readonly string[]) => void): () => void;
export declare function validateBackgroundColors(colors: readonly string[]): void;
export declare function resizeCanvasToElement(state: CanvasBackgroundState, width: number, height: number): void;
export declare function releaseBackgroundCanvas(canvas: HTMLCanvasElement): void;
export declare function acquireBackgroundTarget(element: HTMLElement): void;
export declare function releaseBackgroundTarget(element: HTMLElement): void;
export declare function createMotionFrameScheduler<T>(options: MotionFrameSchedulerOptions<T>): MotionFrameScheduler<T>;
//# sourceMappingURL=canvas-lifecycle.d.ts.map