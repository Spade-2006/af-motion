/**
 * Canvas and viewport sizing, high-DPI scaling, and responsive lifecycle observers.
 */

export interface CanvasDimensions {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
}

/**
 * Updates an HTML5 canvas's backing pixel buffer and inline display style
 * according to logical CSS dimensions and device pixel ratio.
 */
export function updateCanvasDimensions(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  dpr: number = 1,
): { pixelWidth: number; pixelHeight: number } {
  const safeWidth = Math.max(1, Math.floor(width));
  const safeHeight = Math.max(1, Math.floor(height));
  const safeDpr = Math.max(1, dpr);

  const pixelWidth = Math.max(1, Math.round(safeWidth * safeDpr));
  const pixelHeight = Math.max(1, Math.round(safeHeight * safeDpr));

  if (canvas.width !== pixelWidth) {
    canvas.width = pixelWidth;
  }
  if (canvas.height !== pixelHeight) {
    canvas.height = pixelHeight;
  }

  // Explicit inline styling prevents layout jumping
  if (canvas.style) {
    const nextWidth = `${safeWidth}px`;
    const nextHeight = `${safeHeight}px`;
    if (canvas.style.width !== nextWidth) {
      canvas.style.width = nextWidth;
    }
    if (canvas.style.height !== nextHeight) {
      canvas.style.height = nextHeight;
    }
  }

  return { pixelWidth, pixelHeight };
}

/**
 * Extracts current logical and physical pixel dimensions from a canvas element.
 */
export function getCanvasDimensions(
  canvas: HTMLCanvasElement,
  customDpr?: number,
): CanvasDimensions {
  const dpr = typeof customDpr === "number" && customDpr > 0
    ? customDpr
    : typeof window !== "undefined" && typeof window.devicePixelRatio === "number"
      ? Math.max(1, window.devicePixelRatio)
      : 1;

  let width = 300;
  let height = 150;

  if (typeof canvas.getBoundingClientRect === "function") {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      width = rect.width;
      height = rect.height;
    } else if (canvas.clientWidth > 0 && canvas.clientHeight > 0) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
    } else if (canvas.width > 0 && canvas.height > 0) {
      width = Math.round(canvas.width / dpr);
      height = Math.round(canvas.height / dpr);
    }
  }

  return {
    width,
    height,
    dpr,
    pixelWidth: Math.round(width * dpr),
    pixelHeight: Math.round(height * dpr),
  };
}

/**
 * Attaches a ResizeObserver to a container or canvas element safely,
 * returning a cleanup function.
 */
export function setupResizeObserver(
  element: HTMLElement | HTMLCanvasElement,
  onResize: (width: number, height: number) => void,
): () => void {
  if (typeof ResizeObserver === "undefined" || !element) {
    return () => undefined;
  }

  let observer: ResizeObserver | null = null;
  try {
    observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let width = 0;
        let height = 0;
        if (entry.contentRect) {
          width = entry.contentRect.width;
          height = entry.contentRect.height;
        } else if (entry.contentBoxSize) {
          const box = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;
          width = box.inlineSize;
          height = box.blockSize;
        }

        if (width > 0 && height > 0) {
          onResize(width, height);
        }
      }
    });

    observer.observe(element);
  } catch (err) {
    console.warn("[AF Motion Viewport] Failed to initialize ResizeObserver:", err);
    return () => undefined;
  }

  return () => {
    try {
      observer?.disconnect();
    } catch {
      // Ignore disconnect error
    }
    observer = null;
  };
}

/**
 * Attaches a document visibilitychange listener safely,
 * invoking the callback when tab visibility switches.
 */
export function setupVisibilityObserver(
  onVisibilityChange: (visible: boolean) => void,
): () => void {
  if (typeof document === "undefined" || typeof document.addEventListener !== "function") {
    return () => undefined;
  }

  const handler = () => {
    const isVisible = !document.hidden;
    onVisibilityChange(isVisible);
  };

  document.addEventListener("visibilitychange", handler, false);

  return () => {
    document.removeEventListener("visibilitychange", handler, false);
  };
}
