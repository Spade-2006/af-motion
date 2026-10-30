const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** True when the user prefers reduced motion. Safe where `matchMedia` is missing. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia(REDUCED_MOTION_QUERY)?.matches === true;
}

/**
 * Calls `listener` when the reduced-motion preference changes. Returns an unsubscribe
 * function; both are no-ops where `matchMedia` change events are unavailable.
 */
export function onReducedMotionChange(listener: (reduced: boolean) => void): () => void {
  if (typeof matchMedia !== "function") return () => undefined;
  const query = matchMedia(REDUCED_MOTION_QUERY);
  if (!query) return () => undefined;
  const handler = (event?: { matches?: boolean }): void => {
    listener(event?.matches ?? prefersReducedMotion());
  };
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", handler);
    return () => query.removeEventListener?.("change", handler);
  }
  if (typeof query.addListener === "function") {
    query.addListener(handler);
    return () => query.removeListener?.(handler);
  }
  return () => undefined;
}
