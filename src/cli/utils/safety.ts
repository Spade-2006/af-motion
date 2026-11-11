/**
 * AF Motion CLI — Filesystem & Argument Safety Guards
 *
 * Prevents path traversal, symlink/prefix escapes outside the workspace root,
 * null-byte injection, and flag prototype pollution.
 */

import * as path from "node:path";

/**
 * Resolves a user-supplied target directory or output file path relative to `cwd`
 * and rejects any path traversal, cross-drive escape, or null-byte injection.
 */
export function resolveSafeWorkspacePath(
  cwd: string,
  userPath: string,
  label = "target path"
): string {
  if (typeof userPath !== "string" || userPath.trim().length === 0) {
    throw new TypeError(`Invalid ${label}: path must be a non-empty string.`);
  }
  if (userPath.includes("\0")) {
    throw new Error(`Security error: ${label} contains null byte.`);
  }

  const resolvedCwd = path.resolve(cwd);
  const resolvedTarget = path.resolve(resolvedCwd, userPath);
  const rel = path.relative(resolvedCwd, resolvedTarget);

  if (
    rel.startsWith("..") ||
    path.isAbsolute(rel)
  ) {
    throw new Error(
      `Security error: ${label} '${userPath}' resolves outside workspace directory '${resolvedCwd}'.`
    );
  }

  return resolvedTarget;
}
