import type { ComposableEffect } from "./effect-composer.js";
import type { MotionChoreographyAction } from "./motion-choreography.js";
import type { MotionDNA, MotionDNAOverrides } from "./motion-dna.js";
export interface MotionRecipeContext {
    /** Resolves DNA declared by the recipe with per-use overrides. */
    motionDNA(name: string, overrides?: MotionDNAOverrides): MotionDNA;
}
export interface MotionRecipeDefinition<Parameters extends object> {
    /** DNA names this recipe is allowed to resolve. */
    motionDNA?: readonly string[];
    /** Builds effect entries that run for the recipe's lifetime. */
    effects?: (parameters: Readonly<Parameters>, context: MotionRecipeContext) => readonly ComposableEffect[];
    /** Builds the ordered choreography to execute for this recipe. */
    choreography?: (parameters: Readonly<Parameters>, context: MotionRecipeContext) => readonly MotionChoreographyAction[];
}
export interface MotionRecipe<Parameters extends object> {
    readonly definition: MotionRecipeDefinition<Parameters>;
}
export interface MotionRecipeControls {
    /** Resolves when the recipe's choreography completes; undefined for effect-only recipes. */
    readonly finished?: Promise<void>;
    /** Pauses choreography animations and effects that expose pause controls. */
    pause(): void;
    /** Resumes choreography animations and effects that expose resume controls. */
    resume(): void;
    /** Stops the choreography and cleans up all recipe effects. Safe to repeat. */
    destroy(): void;
    /** Alias for destroy(). */
    cancel(): void;
}
/** Creates an immutable reusable recipe definition; the recipe is not started until runMotionRecipe(). */
export declare function createMotionRecipe<Parameters extends object>(definition: MotionRecipeDefinition<Parameters>): MotionRecipe<Parameters>;
export declare function runMotionRecipe<Parameters extends object>(recipe: MotionRecipe<Parameters>, parameters: Parameters): MotionRecipeControls;
//# sourceMappingURL=motion-recipe.d.ts.map