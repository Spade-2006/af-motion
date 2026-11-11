/**
 * AF Motion Robust SVG Path Parser
 *
 * Implements strict compliance with the W3C SVG path specification:
 * supports absolute/relative commands, repeated parameter sequences,
 * negative numbers without whitespace, scientific notation, and multiple subpaths.
 */

import type { SVGCommandType, SVGPathCommand } from "./types.js";

const COMMAND_PARAM_COUNTS: Record<string, number> = {
  m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0,
};

const COMMAND_LETTERS = new Set("MmLlHhVvCcSsQqTtAaZz".split(""));

/**
 * Regular expression matching single numbers in SVG paths:
 * captures signs (+/-), integer part, decimal point, fraction part, and exponents (e/E).
 */
const NUMBER_REGEX = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

/**
 * Parses raw SVG path data into an array of discrete SVG commands and numeric parameters.
 * Throws TypeError on malformed or unsupported path data.
 */
export function parseSVGPath(d: string): SVGPathCommand[] {
  if (typeof d !== "string" || d.trim() === "") {
    throw new TypeError("SVG path data must be a non-empty string");
  }

  const commands: SVGPathCommand[] = [];
  const len = d.length;
  let cursor = 0;

  // Skip leading whitespace or commas
  while (cursor < len && /[\s,]/.test(d[cursor])) {
    cursor++;
  }

  if (cursor >= len) {
    throw new TypeError("SVG path data cannot be empty");
  }

  // Must begin with M or m
  const firstChar = d[cursor];
  if (firstChar !== "M" && firstChar !== "m") {
    throw new TypeError(`SVG path data must start with 'M' or 'm', received '${firstChar}'`);
  }

  while (cursor < len) {
    const char = d[cursor];

    if (!COMMAND_LETTERS.has(char)) {
      throw new TypeError(`Unexpected character '${char}' at index ${cursor} in SVG path data`);
    }

    const commandType = char as SVGCommandType;
    const lower = commandType.toLowerCase();
    const expectedParams = COMMAND_PARAM_COUNTS[lower];
    cursor++;

    // Fast path for closepath Z / z
    if (lower === "z") {
      commands.push({ type: commandType, params: [] });
      // Skip trailing whitespace or commas
      while (cursor < len && /[\s,]/.test(d[cursor])) cursor++;
      continue;
    }

    // Collect all numbers until the next command letter
    const paramStart = cursor;
    while (cursor < len && !COMMAND_LETTERS.has(d[cursor])) {
      cursor++;
    }
    const paramString = d.slice(paramStart, cursor);

    // Validate that paramString contains no illegal characters
    const invalidCharMatch = paramString.match(/[^0-9eE\s,+-.]/);
    if (invalidCharMatch) {
      throw new TypeError(
        `Unexpected character '${invalidCharMatch[0]}' at index ${paramStart + (invalidCharMatch.index ?? 0)} in SVG path data`
      );
    }

    // Extract numbers
    const numbers: number[] = [];
    NUMBER_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = NUMBER_REGEX.exec(paramString)) !== null) {
      const num = Number(match[0]);
      if (isNaN(num) || !isFinite(num)) {
        throw new TypeError(`Invalid number token '${match[0]}' in SVG path data`);
      }
      numbers.push(num);
    }

    if (numbers.length === 0) {
      throw new TypeError(`Command '${commandType}' expects at least ${expectedParams} parameters, received 0`);
    }

    if (numbers.length % expectedParams !== 0) {
      throw new TypeError(
        `Command '${commandType}' parameter count mismatch: expected multiple of ${expectedParams}, received ${numbers.length}`
      );
    }

    // Handle repeated parameters:
    // W3C SVG spec: If M/m is followed by multiple coordinate pairs, subsequent pairs are treated as implicit L/l!
    for (let i = 0; i < numbers.length; i += expectedParams) {
      const slice = numbers.slice(i, i + expectedParams);
      if (i === 0) {
        commands.push({ type: commandType, params: slice });
      } else if (lower === "m") {
        // Implicit L / l
        const implicitType: SVGCommandType = commandType === "M" ? "L" : "l";
        commands.push({ type: implicitType, params: slice });
      } else {
        commands.push({ type: commandType, params: slice });
      }
    }

    // Skip whitespace between commands
    while (cursor < len && /[\s,]/.test(d[cursor])) cursor++;
  }

  return commands;
}
