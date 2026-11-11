/**
 * AF Motion — Shared Input, JSON, and Code-Generation Safety Utilities
 *
 * Zero Node.js built-ins: safe for core, browser, React, MCP, AI, and CLI consumers.
 */

const FORBIDDEN_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Type guard checking that a value is a non-null, non-array plain object record.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * JSON.parse wrapper that strips prototype-pollution keys (`__proto__`, `constructor`, `prototype`)
 * and enforces an optional maximum character payload length.
 */
export function parseSafeJson<T = unknown>(
  raw: string,
  options: { maxLength?: number } = {}
): T {
  const maxLength = options.maxLength ?? 5 * 1024 * 1024;
  if (typeof raw !== "string") {
    throw new TypeError("JSON input must be a string");
  }
  if (raw.length > maxLength) {
    throw new RangeError(`JSON payload exceeds maximum allowed size of ${maxLength} characters`);
  }
  return JSON.parse(raw, (key, value) => {
    if (FORBIDDEN_OBJECT_KEYS.has(key)) {
      return undefined;
    }
    return value;
  }) as T;
}

/**
 * Checks whether a value contains circular object references without throwing.
 */
export function hasCircularReference(value: unknown, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value !== "object") {
    return false;
  }
  if (seen.has(value)) {
    return true;
  }
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (hasCircularReference(item, seen)) return true;
      }
    } else {
      for (const key of Object.keys(value)) {
        if (hasCircularReference((value as Record<string, unknown>)[key], seen)) {
          return true;
        }
      }
    }
    return false;
  } finally {
    seen.delete(value);
  }
}

/**
 * Safely stringifies arbitrary data without throwing on circular references or BigInt.
 */
export function safeJsonStringify(value: unknown, space?: number): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (_key, val) => {
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    },
    space
  );
}

/**
 * Escapes user-controlled text for safe embedding inside JSX text nodes.
 * Neutralizes `{`, `}`, `<`, `>` so expressions or tags cannot inject code.
 */
export function escapeJsxText(value: unknown): string {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
    .trim();
}

/**
 * Sanitizes an identifier or attribute value used in HTML/JSX `data-*` attributes.
 */
export function sanitizeAttributeValue(value: unknown, fallback = "motion-item"): string {
  const cleaned = String(value ?? "")
    .replace(/[^A-Za-z0-9_.:-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

/**
 * Sanitizes a JavaScript/TypeScript PascalCase component or function identifier.
 */
export function sanitizeCodeIdentifier(value: unknown, fallback = "GeneratedMotionWorkflow"): string {
  const raw = String(value ?? "").trim();
  const cleaned = raw
    .replace(/[^A-Za-z0-9_$]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  if (!cleaned) return fallback;
  return /^[A-Za-z_$]/.test(cleaned) ? cleaned : `Component${cleaned}`;
}

/**
 * Sanitizes text inserted into JS/TS block comments so comment terminators cannot close them early.
 */
export function sanitizeCommentText(value: unknown): string {
  return String(value ?? "")
    .replace(/\*\//g, "* /")
    .replace(/[\r\n]+/g, " ")
    .trim();
}

/**
 * Sanitizes a CSS token/value inserted into style strings or CSS variable maps
 * so characters like `;`, `{`, `}`, `<`, `>`, quotes, and newlines cannot break out.
 */
export function sanitizeCssValue(value: unknown, fallback = "initial"): string {
  const str = String(value ?? "").replace(/[\r\n;{}"'<>`]/g, "").trim();
  return str || fallback;
}

/**
 * Strips local filesystem paths and stack trace lines from error messages surfaced to external callers.
 */
export function sanitizeExternalErrorMessage(err: unknown, fallback = "Operation failed"): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : fallback;
  const firstLine = (raw.split(/\r?\n/)[0] ?? fallback).trim();
  const redacted = firstLine
    .replace(/[A-Za-z]:\\[^\s'"]+/g, "<path>")
    .replace(/\/(?:Users|home|var|tmp|etc|mnt|opt|srv|private)\/[^\s'"]+/g, "<path>");
  return redacted || fallback;
}
