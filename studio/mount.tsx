import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { StudioApp } from "./components/StudioApp.js";

export interface MountedStudioHandle {
  unmount: () => void;
  root: Root;
}

/**
 * Mounts the modern React AF Motion Studio into the specified DOM container.
 */
export function mountStudio(container: HTMLElement): MountedStudioHandle {
  const root = createRoot(container);
  root.render(<StudioApp />);

  return {
    unmount: () => {
      root.unmount();
    },
    root,
  };
}
