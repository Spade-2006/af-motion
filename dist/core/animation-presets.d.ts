import type { AnimatableProperties, AnimateTarget, DOMAnimationOptions } from "./animate.js";
import type { AnimationControls } from "./animation.js";
import type { AnimationSequenceControls, AnimationSequenceOptions } from "./animation-sequence.js";
export interface AnimationPreset {
    /** CSS properties and their starting and ending values. */
    readonly properties: Readonly<AnimatableProperties>;
    /** Default timing, easing, and lifecycle options. */
    readonly options?: Readonly<DOMAnimationOptions>;
}
export type AnimationPresetName = "fadeIn" | "fadeOut" | "slideUp" | "slideDown" | "scaleIn" | "scaleOut";
export type AnimationPresetRegistry = Readonly<Record<AnimationPresetName, AnimationPreset>>;
export interface AnimationPresetRegistryApi {
    /** Returns an immutable snapshot, or undefined when the name is unknown. */
    get(name: string): AnimationPreset | undefined;
    /** Registers or replaces a custom preset. Built-in names are reserved. */
    register(name: string, preset: AnimationPreset): void;
    /** Removes a custom preset. Built-ins cannot be removed. */
    remove(name: string): boolean;
}
export type AnimationPresetOverrides = Partial<DOMAnimationOptions>;
export interface AnimationSequencePresetStep {
    /** Name of a registered single-animation preset. */
    readonly preset: string;
    /** Options that override the referenced animation preset. */
    readonly overrides?: AnimationPresetOverrides;
}
export interface AnimationSequencePreset {
    /** Presets to run in order against the same target. */
    readonly steps: readonly AnimationSequencePresetStep[];
    /** Default group callbacks. */
    readonly options?: AnimationSequenceOptions;
}
export interface AnimationSequencePresetRegistryApi {
    /** Returns an immutable snapshot, or undefined when the name is unknown. */
    get(name: string): AnimationSequencePreset | undefined;
    /** Registers or replaces a custom sequence preset. */
    register(name: string, preset: AnimationSequencePreset): void;
    /** Removes a custom sequence preset. */
    remove(name: string): boolean;
}
export interface AnimationSequencePresetOverrides extends AnimationSequenceOptions {
    /** Per-step animation option overrides, matched by step index. */
    readonly steps?: readonly (AnimationPresetOverrides | undefined)[];
}
export declare function getAnimationPreset(name: string): AnimationPreset | undefined;
export declare function getAnimationSequencePreset(name: string): AnimationSequencePreset | undefined;
export declare function registerAnimationPreset(name: string, preset: AnimationPreset): void;
export declare function registerAnimationSequencePreset(name: string, preset: AnimationSequencePreset): void;
export declare function removeAnimationPreset(name: string): boolean;
export declare function removeAnimationSequencePreset(name: string): boolean;
export declare const animationPresetRegistry: Readonly<AnimationPresetRegistryApi>;
export declare const animationSequencePresetRegistry: Readonly<AnimationSequencePresetRegistryApi>;
/** Runs a registered preset through the existing `animate()` engine. */
export declare function animatePreset(target: AnimateTarget, name: string, overrides?: AnimationPresetOverrides): AnimationControls;
/** Runs a registered choreography by composing single-animation presets through `animateSequence()`. */
export declare function animatePresetSequence(target: AnimateTarget, name: string, overrides?: AnimationSequencePresetOverrides): AnimationSequenceControls;
//# sourceMappingURL=animation-presets.d.ts.map