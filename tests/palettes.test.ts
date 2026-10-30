import { afterEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import {
  activatePalette,
  getActivePalette,
  getPalette,
  listPalettes,
  paletteRegistry,
  registerPalette,
  removePalette,
  resolvePaletteColors,
  subscribeToPaletteChanges,
  subscribeToPaletteColors,
} from "../src/index";
import type { ColorPalette, PaletteInput, SemanticColorToken, SemanticColorTokens } from "../src/index";

const approvedPalettes = [
  ["Cobalt Classic", "Black", "#111111", "White", "#FFFFFF", "Cobalt Blue", "#0047AB"],
  ["Burnt Chocolate", "Chocolate Brown", "#6F3B22", "Cream", "#FFF1D6", "Burnt Orange", "#CC5500"],
  ["Dusty Romance", "Burgundy", "#800020", "Cream", "#FFF1D6", "Dusty Pink", "#D8A7A7"],
  ["Cosmic Mocha", "Cosmic Latte", "#FFF8E7", "Mocha Cream", "#DCC7AA", "Deep Burgundy", "#4A102A"],
  ["Earth & Amber", "Sage Green", "#A3B18A", "Concrete Grey", "#969A98", "Burnt Amber", "#C87924"],
  ["Primary Pop", "Baby Blue", "#A7D8F0", "Red", "#E32636", "Sunshine Yellow", "#FFD93D"],
  ["Midnight Voltage", "Midnight Navy", "#101B3F", "Cobalt Blue", "#0047AB", "Bright Red", "#F02D3A"],
  ["Earthbound", "Charcoal Black", "#242424", "Earth Brown", "#795548", "Burnt Amber", "#C87924"],
  ["Electric Teal", "Ink Black", "#101418", "Warm Ivory", "#F5EBDD", "Electric Teal", "#00D6C9"],
  ["Crimson Midnight", "Midnight Navy", "#111A33", "Warm Stone Grey", "#A7A29A", "Crimson Red", "#DC143C"],
  ["Neon Abyss", "Deep Black", "#08080C", "Neon Red", "#FF2442", "Indigo", "#4B0082"],
  ["Royal Atlas", "Ivory", "#FFFFF0", "Gold", "#D4AF37", "Deep Atlas Navy", "#102A43"],
  ["Ember Editorial", "Burnt Orange", "#CC5500", "Warm Ivory", "#F5EBDD", "Soft Black", "#202124"],
  ["Editorial Heat", "Warm Ivory", "#F5EBDD", "Deep Editorial Blue", "#153E75", "Coral Orange", "#FF765E"],
  ["Strawberry Riot", "Soft Strawberry Pink", "#F6B7C8", "Vibrant Crimson Red", "#D7193F", "Lime Green", "#A8E10C"],
  ["Sage & Olive", "Soft White", "#F8F8F2", "Sage Green", "#A3B18A", "Deep Olive", "#414833"],
  ["Solar Cobalt", "Warm Beige", "#D8C3A5", "Cobalt Blue", "#0047AB", "Sun Yellow", "#FFD447"],
  ["Electric Eclipse", "Midnight Black", "#090A0F", "Electric Violet", "#8F00FF", "Sun Yellow", "#FFD447"],
  ["Silver Signal", "Charcoal Grey", "#343A40", "Moonlit Silver", "#C7CDD4", "Signal Red", "#E51B23"],
  ["Amethyst Circuit", "Jet Black", "#0A0A0A", "Royal Amethyst", "#7851A9", "Electric Cyan", "#00E5FF"],
  ["Woodland Glow", "Sage Green", "#A3B18A", "Walnut Brown", "#5D4037", "Amber Glow", "#FFB000"],
  ["Peach Voltage", "Soft Peach", "#F7C6A3", "Lime Green", "#A8E10C", "Crimson", "#DC143C"],
  ["Forest Lavender", "Oatmeal", "#E7DDC8", "Pine Green", "#1F5B45", "Soft Lilac", "#C8B6E2"],
  ["Mauve Terracotta", "Dusty Mauve", "#B7849A", "Deep Plum", "#4B203A", "Terracotta", "#C66B4E"],
  ["Chromatic Riot", "Lavender", "#B9A7E8", "Chartreuse", "#C7E000", "Tomato Red", "#F04438"],
  ["Neon Rebellion", "Jet Black", "#0A0A0A", "Hot Pink", "#FF2D95", "Chartreuse", "#C7E000"],
  ["Emerald Vermilion", "Warm Ivory", "#F5EBDD", "Emerald Green", "#087F5B", "Vermilion", "#E34234"],
  ["Forest Crimson", "Charcoal Black", "#242424", "Forest Green", "#1B4332", "Crimson Red", "#DC143C"],
  ["Lemon Afterdark", "Lemon", "#FFF44F", "Charcoal Black", "#242424", "Electric Lavender", "#B65CFF"],
  ["Mocha Gold", "Mocha Brown", "#6F4E37", "Champagne Gold", "#F1D6A8", "Burnt Amber", "#C87924"],
  ["Cerulean Rose", "Jet Black", "#0A0A0A", "Cerulean Blue", "#007BA7", "Neon Rose", "#FF3CAC"],
  ["Amber Frost", "Ice Silver", "#DDE6ED", "Deep Ambergine", "#3D1635", "Marigold", "#EAA221"],
  ["Platinum Mocha", "Mocha Brown", "#6F4E37", "Platinum Silver", "#D5D8DC", "Pale Lavender", "#DCD0FF"],
] as const;

const palette: ColorPalette = {
  name: "testPalette",
  tokens: {
    primary: "#123",
    secondary: "#234",
    accent: "#345",
    background: "#fff",
    surface: "#f8f8f8",
    text: "#111",
    muted: "#888",
    border: "#ddd",
    success: "#0f08",
    warning: "#ffcc00",
    error: "#ff0000",
    info: "#0000ffff",
  },
};

const basePalette: PaletteInput = {
  name: "basePalette",
  primary: "#123456",
  secondary: "#abcdef",
  accent: "#fedcba",
};

afterEach(() => {
  removePalette(palette.name);
  removePalette(basePalette.name);
  removePalette("secondPalette");
  removePalette("invalidPalette");
  removePalette("duplicatePalette");
  removePalette("reactivePalette");
  removePalette("reactivePalette2");
});

describe("custom palette registry", () => {
  it("resolves immutable palette colors and explicit color overrides", () => {
    registerPalette({
      name: "reactivePalette",
      primary: "#111111",
      secondary: "#222222",
      accent: "#333333",
    });
    const colors = resolvePaletteColors({ palette: "reactivePalette" });
    expect(colors).toEqual(["#111111", "#222222", "#333333"]);
    expect(Object.isFrozen(colors)).toBe(true);
    expect(resolvePaletteColors({
      palette: "reactivePalette",
      colors: ["#abcdef"],
    })).toEqual(["#abcdef"]);
    activatePalette("reactivePalette");
    removePalette("reactivePalette");
    expect(resolvePaletteColors({
      palette: "active",
      fallback: ["#444444"],
    })).toEqual(["#444444"]);
    expect(() => resolvePaletteColors({ palette: "missingPalette" })).toThrow(/Unknown palette/);
    expect(() => resolvePaletteColors({
      palette: "missingPalette",
      colors: ["#abcdef"],
    })).toThrow(/Unknown palette/);
  });

  it("subscribes to active palette colors and reliably unsubscribes", () => {
    registerPalette({
      name: "reactivePalette",
      primary: "#111111",
      secondary: "#222222",
      accent: "#333333",
    });
    registerPalette({
      name: "reactivePalette2",
      primary: "#444444",
      secondary: "#555555",
      accent: "#666666",
    });
    const listener = vi.fn();
    const unsubscribe = subscribeToPaletteColors(
      { palette: "active", fallback: ["#444444"] },
      listener,
    );

    activatePalette("reactivePalette");
    expect(listener).toHaveBeenLastCalledWith(["#111111", "#222222", "#333333"]);
    unsubscribe();
    activatePalette("reactivePalette2");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(() => subscribeToPaletteColors({ palette: "active" }, null as never)).toThrow(/listener/);
    expect(() => subscribeToPaletteColors({ palette: "active" }, vi.fn())).toThrow(/fallback/);
  });

  it("registers, retrieves, and lists custom palettes", () => {
    registerPalette(palette);

    expect(getPalette(palette.name)).toEqual(palette);
    expect(paletteRegistry.get(palette.name)).toEqual(palette);
    expect(listPalettes()).toContain(palette.name);
    expect(paletteRegistry.list()).toContain(palette.name);
    expect(getPalette("unknownPalette")).toBeUndefined();
  });

  it("exposes all approved built-in palette names, colour names, and HEX values", () => {
    expect(approvedPalettes).toHaveLength(33);
    for (const [name, primaryName, primary, secondaryName, secondary, accentName, accent] of approvedPalettes) {
      expect(getPalette(name)).toMatchObject({
        name,
        colorNames: {
          primary: primaryName,
          secondary: secondaryName,
          accent: accentName,
        },
        tokens: { primary, secondary, accent },
      });
    }
    expect(listPalettes().filter((name) => approvedPalettes.some(([approved]) => approved === name)))
      .toEqual(approvedPalettes.map(([name]) => name));
    expect(getActivePalette()).toBeUndefined();
  });

  it("allows activation but prevents replacing or removing built-in palettes", () => {
    const [name, , primary, , secondary, , accent] = approvedPalettes[0];
    expect(() => registerPalette({ name, primary, secondary, accent })).toThrow(
      `Cannot replace built-in palette "${name}"`,
    );
    expect(removePalette(name)).toBe(false);
    expect(getPalette(name)?.tokens.primary).toBe(primary);

    activatePalette(name);
    expect(getActivePalette()?.name).toBe(name);
  });

  it("resolves all omitted semantic tokens deterministically from the three base colours", () => {
    registerPalette(basePalette);

    expect(getPalette(basePalette.name)?.tokens).toEqual({
      primary: "#123456",
      secondary: "#abcdef",
      accent: "#fedcba",
      background: "#abcdef",
      surface: "#abcdef",
      text: "#123456",
      muted: "#abcdef",
      border: "#abcdef",
      success: "#fedcba",
      warning: "#fedcba",
      error: "#fedcba",
      info: "#fedcba",
    });
  });

  it("preserves explicit semantic-token overrides", () => {
    registerPalette({
      ...basePalette,
      overrides: { background: "#000000", success: "#00ff00" },
    });

    expect(getPalette(basePalette.name)?.tokens.background).toBe("#000000");
    expect(getPalette(basePalette.name)?.tokens.success).toBe("#00ff00");
    expect(getPalette(basePalette.name)?.tokens.surface).toBe("#abcdef");
  });

  it("does not expose mutable palette state", () => {
    const sourceTokens = { ...palette.tokens };
    const sourcePalette = { name: palette.name, tokens: sourceTokens };
    registerPalette(sourcePalette);
    sourceTokens.primary = "#abc";

    const retrieved = getPalette(palette.name);
    expect(retrieved?.tokens.primary).toBe("#123");
    expect(Object.isFrozen(retrieved)).toBe(true);
    expect(Object.isFrozen(retrieved?.tokens)).toBe(true);
    expect(Reflect.set(retrieved?.tokens ?? {}, "primary", "#abc")).toBe(false);
    expect(listPalettes()).not.toBe(listPalettes());
  });

  it("rejects duplicate names", () => {
    registerPalette(palette);

    expect(() => registerPalette(palette)).toThrow('Palette "testPalette" is already registered');
  });

  it("validates names, required tokens, and HEX colours", () => {
    expect(() => registerPalette({ ...palette, name: " padded " })).toThrow(/Palette name/);
    expect(() => registerPalette({ ...palette, name: "" })).toThrow(/Palette name/);

    const { info: _info, ...missingToken } = palette.tokens;
    expect(() => registerPalette({
      name: "invalidPalette",
      tokens: missingToken as SemanticColorTokens,
    })).toThrow(/missing required semantic color token "info"/);

    expect(() => registerPalette({
      ...palette,
      name: "invalidPalette",
      tokens: { ...palette.tokens, primary: "red" },
    })).toThrow(/token "primary" must be a valid HEX color/);
    expect(() => registerPalette({
      ...palette,
      name: "invalidPalette",
      tokens: { ...palette.tokens, primary: "#12xz" },
    })).toThrow(/valid HEX color/);
  });

  it("validates all base colours and semantic overrides", () => {
    expect(() => registerPalette({ ...basePalette, primary: "blue", name: "invalidPalette" }))
      .toThrow(/token "primary" must be a valid HEX color/);
    expect(() => registerPalette({
      ...basePalette,
      name: "invalidPalette",
      overrides: { warning: "yellow" },
    })).toThrow(/token "warning" must be a valid HEX color/);
    expect(() => registerPalette({
      ...basePalette,
      name: "invalidPalette",
      overrides: null as never,
    })).toThrow(/overrides must be an object/);
  });

  it("copies and freezes base colours and overrides when registered", () => {
    const overrides = { background: "#010203" };
    const input = { ...basePalette, overrides };
    registerPalette(input);
    overrides.background = "#aabbcc";

    const retrieved = getPalette(basePalette.name);
    expect(retrieved?.tokens.background).toBe("#010203");
    expect(Object.isFrozen(retrieved)).toBe(true);
    expect(Object.isFrozen(retrieved?.tokens)).toBe(true);
    expect(Reflect.set(retrieved?.tokens ?? {}, "background", "#ffffff")).toBe(false);
  });

  it("removes registered palettes and returns whether one existed", () => {
    registerPalette(palette);

    expect(removePalette(palette.name)).toBe(true);
    expect(getPalette(palette.name)).toBeUndefined();
    expect(removePalette(palette.name)).toBe(false);
    expect(listPalettes()).not.toContain(palette.name);
  });

  it("activates registered palettes and returns immutable active snapshots", () => {
    registerPalette(palette);
    registerPalette({ ...basePalette, name: "secondPalette" });

    activatePalette(palette.name);
    expect(getActivePalette()).toEqual(palette);
    expect(paletteRegistry.getActive()).toEqual(palette);
    expect(Object.isFrozen(getActivePalette()?.tokens)).toBe(true);

    activatePalette("secondPalette");
    expect(getActivePalette()?.name).toBe("secondPalette");
  });

  it("notifies subscribers on active changes and avoids redundant notifications", () => {
    registerPalette(palette);
    registerPalette({ ...basePalette, name: "secondPalette" });
    const listener = vi.fn();
    const unsubscribe = subscribeToPaletteChanges(listener);

    activatePalette(palette.name);
    activatePalette(palette.name);
    activatePalette("secondPalette");

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenNthCalledWith(1, palette);
    expect(listener).toHaveBeenNthCalledWith(2, expect.objectContaining({ name: "secondPalette" }));
    unsubscribe();
    activatePalette(palette.name);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("clears an active palette and notifies subscribers when it is removed", () => {
    registerPalette(palette);
    activatePalette(palette.name);
    const listener = vi.fn();
    const unsubscribe = subscribeToPaletteChanges(listener);

    expect(removePalette(palette.name)).toBe(true);

    expect(getActivePalette()).toBeUndefined();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(undefined);
    expect(removePalette(palette.name)).toBe(false);
    unsubscribe();
  });

  it("rejects invalid activation names and listeners", () => {
    expect(() => activatePalette("missingPalette")).toThrow('Unknown palette "missingPalette"');
    expect(() => activatePalette(" ")).toThrow(/Palette name/);
    expect(() => subscribeToPaletteChanges(null as never)).toThrow(/listener must be a function/);
  });

  it("exposes semantic token types with required readonly colour values", () => {
    const token: SemanticColorToken = "primary";

    expectTypeOf(palette).toMatchTypeOf<ColorPalette>();
    expectTypeOf<SemanticColorTokens>().toHaveProperty("primary").toBeString();
    expectTypeOf<SemanticColorTokens>().toHaveProperty("info").toBeString();
    expectTypeOf(token).toEqualTypeOf<SemanticColorToken>();
    expectTypeOf<PaletteInput>().toHaveProperty("primary").toBeString();
    expectTypeOf<PaletteInput>().toHaveProperty("secondary").toBeString();
    expectTypeOf<PaletteInput>().toHaveProperty("accent").toBeString();
  });
});
