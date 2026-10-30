import type { EasingFunction } from "../core/animation.js";
export declare const linear: EasingFunction;
export declare const easeInQuad: EasingFunction;
export declare const easeOutQuad: EasingFunction;
export declare const easeInOutQuad: EasingFunction;
export declare const easeInCubic: EasingFunction;
export declare const easeOutCubic: EasingFunction;
export declare const easeInOutCubic: EasingFunction;
export declare const easeInSine: EasingFunction;
export declare const easeOutSine: EasingFunction;
export declare const easeInOutSine: EasingFunction;
export declare const easeOutExpo: EasingFunction;
/** Overshoots 1 mid-animation by design; only the input is clamped. */
export declare const easeOutBack: EasingFunction;
export interface EasingRegistry {
    linear: EasingFunction;
    easeInQuad: EasingFunction;
    easeOutQuad: EasingFunction;
    easeInOutQuad: EasingFunction;
    easeInCubic: EasingFunction;
    easeOutCubic: EasingFunction;
    easeInOutCubic: EasingFunction;
    easeInSine: EasingFunction;
    easeOutSine: EasingFunction;
    easeInOutSine: EasingFunction;
    easeOutExpo: EasingFunction;
    easeOutBack: EasingFunction;
}
export type EasingName = keyof EasingRegistry;
export declare const easings: Readonly<EasingRegistry>;
export type EasingOption = EasingFunction | string;
export interface EasingRegistryApi {
    /** Registers or replaces a custom easing by name. Built-in names are reserved. */
    register(name: string, easing: EasingFunction): void;
    /** Retrieves a built-in or registered easing; returns undefined when the name is unknown. */
    get(name: string): EasingFunction | undefined;
    /** Removes a registered custom easing. Built-ins cannot be removed. */
    remove(name: string): boolean;
}
export declare function registerEasing(name: string, easing: EasingFunction): void;
export declare function getEasing(name: string): EasingFunction | undefined;
export declare function removeEasing(name: string): boolean;
export declare const easingRegistry: Readonly<EasingRegistryApi>;
export declare function resolveEasing(easing: EasingOption | undefined): EasingFunction;
//# sourceMappingURL=easings.d.ts.map