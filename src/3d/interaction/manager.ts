/**
 * AF Motion 3D Interaction Manager
 *
 * Coordinates pointer, touch, keyboard, raycasting, selection,
 * hover, focus, and camera navigation in 3D scenes.
 */

import type {
  Interaction3DOptions,
  InteractionState3D,
  RaycastAdapter3D,
  RaycastHit3D,
} from "./types.js";
import { CameraControls3D } from "./camera-controls.js";

type InteractionListener = (state: InteractionState3D) => void;

export class InteractionManager3D {
  private element: HTMLElement | null = null;
  private readonly options: Required<Interaction3DOptions>;
  private readonly cameraControls: CameraControls3D;
  private readonly listeners = new Set<InteractionListener>();

  private state: InteractionState3D = {
    hoveredObjectId: null,
    selectedObjectIds: [],
    focusedObjectId: null,
    isDragging: false,
    pointerNdc: [0, 0],
    dragDelta: [0, 0],
    activeHits: [],
  };

  private isPointerDown = false;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private hasMovedBeyondThreshold = false;
  private initialTouchDistance = 0;
  private isSuspended = false;

  constructor(options?: Interaction3DOptions, cameraControls?: CameraControls3D) {
    this.options = {
      dragThreshold: options?.dragThreshold ?? 4,
      multiSelect: options?.multiSelect ?? false,
      enableKeyboard: options?.enableKeyboard ?? true,
      enableHighlight: options?.enableHighlight ?? true,
      highlightColor: options?.highlightColor ?? "#6366f1",
      reducedMotion: options?.reducedMotion ?? false,
      raycaster: options?.raycaster ?? { raycast: () => [] },
      onHover: options?.onHover ?? (() => {}),
      onSelect: options?.onSelect ?? (() => {}),
      onClick: options?.onClick ?? (() => {}),
      onDrag: options?.onDrag ?? (() => {}),
    };

    this.cameraControls = cameraControls ?? new CameraControls3D();
  }

  /**
   * Attaches interaction listeners to an HTML element (typically a canvas or wrapper).
   */
  public attach(element: HTMLElement): void {
    if (this.element === element) return;
    this.detach();

    this.element = element;

    // Pointer events
    element.addEventListener("pointerdown", this.handlePointerDown);
    element.addEventListener("pointermove", this.handlePointerMove);
    element.addEventListener("pointerup", this.handlePointerUp);
    element.addEventListener("pointerleave", this.handlePointerLeave);
    element.addEventListener("wheel", this.handleWheel, { passive: false });

    // Touch events for multi-touch pinch zoom
    element.addEventListener("touchstart", this.handleTouchStart, { passive: true });
    element.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    element.addEventListener("touchend", this.handleTouchEnd, { passive: true });

    // Keyboard events
    if (this.options.enableKeyboard) {
      element.tabIndex = element.tabIndex >= 0 ? element.tabIndex : 0;
      element.addEventListener("keydown", this.handleKeyDown);
    }
  }

  /**
   * Detaches interaction listeners and cleans up.
   */
  public detach(): void {
    if (!this.element) return;

    this.element.removeEventListener("pointerdown", this.handlePointerDown);
    this.element.removeEventListener("pointermove", this.handlePointerMove);
    this.element.removeEventListener("pointerup", this.handlePointerUp);
    this.element.removeEventListener("pointerleave", this.handlePointerLeave);
    this.element.removeEventListener("wheel", this.handleWheel);

    this.element.removeEventListener("touchstart", this.handleTouchStart);
    this.element.removeEventListener("touchmove", this.handleTouchMove);
    this.element.removeEventListener("touchend", this.handleTouchEnd);

    this.element.removeEventListener("keydown", this.handleKeyDown);

    this.element = null;
    this.isPointerDown = false;
  }

  /**
   * Subscribes to interaction state changes.
   */
  public subscribe(listener: InteractionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Updates suspension state (e.g., when offscreen).
   */
  public setSuspended(suspended: boolean): void {
    this.isSuspended = suspended;
  }

  /**
   * Programmatic selection control.
   */
  public select(objectId: string, multi = false): void {
    let next: string[];
    if (multi || this.options.multiSelect) {
      next = this.state.selectedObjectIds.includes(objectId)
        ? [...this.state.selectedObjectIds]
        : [...this.state.selectedObjectIds, objectId];
    } else {
      next = [objectId];
    }
    this.updateState({ selectedObjectIds: next });
    this.options.onSelect(next);
  }

  public deselect(objectId: string): void {
    const next = this.state.selectedObjectIds.filter((id) => id !== objectId);
    this.updateState({ selectedObjectIds: next });
    this.options.onSelect(next);
  }

  public clearSelection(): void {
    this.updateState({ selectedObjectIds: [] });
    this.options.onSelect([]);
  }

  public getState(): InteractionState3D {
    return this.state;
  }

  public getCameraControls(): CameraControls3D {
    return this.cameraControls;
  }

  // --- Internal Event Handlers ---

  private updateState(partial: Partial<InteractionState3D>): void {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private computeNdc(clientX: number, clientY: number): [number, number] {
    if (!this.element) return [0, 0];
    const rect = this.element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return [0, 0];

    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);
    return [x, y];
  }

  private handlePointerDown = (e: PointerEvent): void => {
    if (this.isSuspended) return;

    this.isPointerDown = true;
    this.hasMovedBeyondThreshold = false;
    this.pointerStartX = e.clientX;
    this.pointerStartY = e.clientY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    const [ndcX, ndcY] = this.computeNdc(e.clientX, e.clientY);
    const hits = this.options.raycaster.raycast(ndcX, ndcY);

    this.updateState({
      pointerNdc: [ndcX, ndcY],
      activeHits: hits,
      isDragging: false,
    });
  };

  private handlePointerMove = (e: PointerEvent): void => {
    if (this.isSuspended) return;

    const [ndcX, ndcY] = this.computeNdc(e.clientX, e.clientY);

    if (this.isPointerDown) {
      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;
      const totalDist = Math.hypot(e.clientX - this.pointerStartX, e.clientY - this.pointerStartY);

      if (totalDist > this.options.dragThreshold) {
        this.hasMovedBeyondThreshold = true;
      }

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      if (this.hasMovedBeyondThreshold) {
        // Orbit or pan camera controls
        if (e.buttons === 1) {
          // Left click drag -> orbit
          this.cameraControls.rotate(-deltaX * 0.008, -deltaY * 0.008);
        } else if (e.buttons === 2 || e.buttons === 4) {
          // Right or middle click drag -> pan
          this.cameraControls.pan(-deltaX * 0.01, deltaY * 0.01);
        }

        this.updateState({
          isDragging: true,
          pointerNdc: [ndcX, ndcY],
          dragDelta: [deltaX, deltaY],
        });

        this.options.onDrag([deltaX, deltaY], this.state);
        return;
      }
    }

    // Raycast hover detection when not dragging
    const hits = this.options.raycaster.raycast(ndcX, ndcY);
    const topHit = hits[0];
    const hoveredId = topHit ? topHit.objectId : null;

    if (hoveredId !== this.state.hoveredObjectId) {
      this.updateState({
        hoveredObjectId: hoveredId,
        pointerNdc: [ndcX, ndcY],
        activeHits: hits,
      });
      this.options.onHover(hoveredId, topHit);
    }
  };

  private handlePointerUp = (e: PointerEvent): void => {
    if (this.isSuspended) return;

    this.cameraControls.setInteracting(false);

    if (!this.hasMovedBeyondThreshold) {
      // Pure click
      const [ndcX, ndcY] = this.computeNdc(e.clientX, e.clientY);
      const hits = this.options.raycaster.raycast(ndcX, ndcY);
      const topHit = hits[0];
      const clickedId = topHit ? topHit.objectId : null;

      if (clickedId) {
        this.select(clickedId, e.shiftKey || e.ctrlKey);
      } else {
        this.clearSelection();
      }

      this.options.onClick(clickedId, topHit);
    }

    this.isPointerDown = false;
    this.updateState({ isDragging: false });
  };

  private handlePointerLeave = (): void => {
    this.isPointerDown = false;
    this.cameraControls.setInteracting(false);
    if (this.state.hoveredObjectId) {
      this.updateState({ hoveredObjectId: null, isDragging: false });
      this.options.onHover(null);
    }
  };

  private handleWheel = (e: WheelEvent): void => {
    if (this.isSuspended) return;
    e.preventDefault();
    this.cameraControls.zoom(e.deltaY * 0.05);
    this.cameraControls.setInteracting(false);
  };

  private handleTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.initialTouchDistance = Math.hypot(dx, dy);
    }
  };

  private handleTouchMove = (e: TouchEvent): void => {
    if (e.touches.length === 2 && this.initialTouchDistance > 0) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const delta = (this.initialTouchDistance - currentDist) * 0.1;
      this.cameraControls.zoom(delta);
      this.initialTouchDistance = currentDist;
    }
  };

  private handleTouchEnd = (): void => {
    this.initialTouchDistance = 0;
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isSuspended) return;

    switch (e.key) {
      case "Escape":
        this.clearSelection();
        break;

      case "ArrowLeft":
        this.cameraControls.rotate(-0.05, 0);
        break;

      case "ArrowRight":
        this.cameraControls.rotate(0.05, 0);
        break;

      case "ArrowUp":
        this.cameraControls.rotate(0, -0.05);
        break;

      case "ArrowDown":
        this.cameraControls.rotate(0, 0.05);
        break;

      case "+":
      case "=":
        this.cameraControls.zoom(-0.5);
        break;

      case "-":
      case "_":
        this.cameraControls.zoom(0.5);
        break;

      case "Enter":
      case " ":
        if (this.state.hoveredObjectId) {
          this.select(this.state.hoveredObjectId);
          this.options.onClick(this.state.hoveredObjectId);
        }
        break;
    }
  };
}
