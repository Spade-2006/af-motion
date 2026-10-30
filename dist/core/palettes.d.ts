export interface SemanticColorTokens {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly background: string;
    readonly surface: string;
    readonly text: string;
    readonly muted: string;
    readonly border: string;
    readonly success: string;
    readonly warning: string;
    readonly error: string;
    readonly info: string;
}
export type SemanticColorToken = keyof SemanticColorTokens;
export interface PaletteColorNames {
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
}
export interface ColorPalette {
    readonly name: string;
    readonly tokens: SemanticColorTokens;
    readonly colorNames?: PaletteColorNames;
}
export interface PaletteInput {
    readonly name: string;
    readonly primary: string;
    readonly secondary: string;
    readonly accent: string;
    readonly overrides?: Partial<SemanticColorTokens>;
    readonly colorNames?: PaletteColorNames;
}
export type PaletteDefinition = ColorPalette | PaletteInput;
export type PaletteChangeListener = (palette: ColorPalette | undefined) => void;
export interface PaletteRegistryApi {
    /** Retrieves a registered palette, or undefined when the name is unknown. */
    get(name: string): ColorPalette | undefined;
    /** Returns the names of registered custom palettes. */
    list(): readonly string[];
    /** Registers a palette. Names must be unique. */
    register(palette: PaletteDefinition): void;
    /** Removes a registered custom palette. */
    remove(name: string): boolean;
    /** Activates a registered palette and notifies subscribers when it changes. */
    activate(name: string): void;
    /** Returns the active palette, or undefined when none is active. */
    getActive(): ColorPalette | undefined;
    /** Subscribes to active-palette changes and returns an unsubscribe function. */
    subscribe(listener: PaletteChangeListener): () => void;
}
export declare function registerPalette(palette: PaletteDefinition): void;
export declare function getPalette(name: string): ColorPalette | undefined;
export declare function listPalettes(): readonly string[];
export declare function activatePalette(name: string): void;
export declare function getActivePalette(): ColorPalette | undefined;
export declare function subscribeToPaletteChanges(listener: PaletteChangeListener): () => void;
export declare function removePalette(name: string): boolean;
export declare const paletteRegistry: Readonly<PaletteRegistryApi>;
//# sourceMappingURL=palettes.d.ts.map