const owners = new WeakMap<HTMLElement, Map<number, number>>();

/**
 * Best-effort pointer capture shared by effects on the same element. Capture is only released
 * once every effect that acquired it has released it, so one effect finishing never cancels
 * another effect's active gesture.
 */
export function acquirePointerCapture(element: HTMLElement, pointerId: number): void {
  let counts = owners.get(element);
  if (!counts) {
    counts = new Map();
    owners.set(element, counts);
  }
  counts.set(pointerId, (counts.get(pointerId) ?? 0) + 1);
  try {
    element.setPointerCapture?.(pointerId);
  } catch {
    // Capture is best-effort; gestures still work through bubbling events.
  }
}

export function releasePointerCapture(element: HTMLElement, pointerId: number): void {
  const counts = owners.get(element);
  const remaining = (counts?.get(pointerId) ?? 1) - 1;
  if (remaining > 0) {
    counts?.set(pointerId, remaining);
    return;
  }
  counts?.delete(pointerId);
  if (counts?.size === 0) owners.delete(element);
  if (
    typeof element.hasPointerCapture === "function" &&
    typeof element.releasePointerCapture === "function" &&
    element.hasPointerCapture(pointerId)
  ) {
    element.releasePointerCapture(pointerId);
  }
}
