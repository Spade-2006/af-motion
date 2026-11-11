/**
 * AF Motion Interactive Particle Fields & Forces — Pointer & Gesture Integration
 *
 * Translates pointer motion, multi-touch events, and Prompt 105-110 gestures
 * into dynamic spatial attraction, repulsion, shockwave bursts, and rotational forces.
 */

import type { GestureType } from "../../core/interactions/types.js";
import { AttractionForceField, RepulsionForceField, VortexForceField } from "./forces.js";
import type {
  GestureForceAction,
  InteractivePointer,
  PointerInteractionConfig,
} from "./types.js";
import type { ForceFieldManager } from "./composition.js";

export class ParticleInteractionController {
  private readonly manager: ForceFieldManager;
  private readonly config: PointerInteractionConfig;
  private readonly pointers = new Map<number | string, InteractivePointer>();

  // Dedicated pointer force fields
  private readonly pointerFields = new Map<number | string, AttractionForceField | RepulsionForceField | VortexForceField>();
  private readonly gestureMappings: GestureForceAction[];

  constructor(
    manager: ForceFieldManager,
    config: PointerInteractionConfig = {},
    gestureMappings: readonly GestureForceAction[] = [],
  ) {
    this.manager = manager;
    this.config = {
      mode: config.mode ?? "attract",
      radius: config.radius ?? 0.25,
      strength: config.strength ?? 80.0,
      burstCount: config.burstCount ?? 30,
      burstSpeed: config.burstSpeed ?? 150.0,
      smoothVelocity: config.smoothVelocity ?? true,
    };
    this.gestureMappings = [...gestureMappings];
  }

  updatePointer(
    id: number | string,
    x: number,
    y: number,
    active = true,
    primaryButton = false,
    z = 0,
  ): void {
    let ptr = this.pointers.get(id);

    if (!ptr) {
      ptr = {
        id,
        x,
        y,
        z,
        vx: 0,
        vy: 0,
        vz: 0,
        active,
        primaryButton,
      };
      this.pointers.set(id, ptr);
    } else {
      // Calculate smooth velocity
      ptr.vx = (x - ptr.x) * 60;
      ptr.vy = (y - ptr.y) * 60;
      ptr.vz = (z - (ptr.z ?? 0)) * 60;
      ptr.x = x;
      ptr.y = y;
      ptr.z = z;
      ptr.active = active;
      ptr.primaryButton = primaryButton;
    }

    // Sync or create dynamic pointer force field
    this.syncPointerField(ptr);
  }

  removePointer(id: number | string): void {
    this.pointers.delete(id);
    const field = this.pointerFields.get(id);
    if (field) {
      this.manager.removeField(field.id);
      this.pointerFields.delete(id);
    }
  }

  private syncPointerField(ptr: InteractivePointer): void {
    if (!ptr.active) {
      const field = this.pointerFields.get(ptr.id);
      if (field) {
        field.enabled = false;
      }
      return;
    }

    let field = this.pointerFields.get(ptr.id);

    if (!field) {
      const fieldId = `pointer-field-${ptr.id}`;
      const radius = this.config.radius ?? 0.25;
      const strength = this.config.strength ?? 80.0;

      if (this.config.mode === "repel") {
        field = new RepulsionForceField({
          id: fieldId,
          type: "repulsion",
          position: [ptr.x, ptr.y, ptr.z ?? 0],
          radius,
          strength,
          falloff: "smoothstep",
        });
      } else if (this.config.mode === "vortex") {
        field = new VortexForceField({
          id: fieldId,
          type: "vortex",
          position: [ptr.x, ptr.y, ptr.z ?? 0],
          radius,
          strength,
          falloff: "smoothstep",
        });
      } else {
        // default "attract"
        field = new AttractionForceField({
          id: fieldId,
          type: "attraction",
          position: [ptr.x, ptr.y, ptr.z ?? 0],
          radius,
          strength,
          falloff: "smoothstep",
        });
      }

      this.manager.addField(field);
      this.pointerFields.set(ptr.id, field);
    } else {
      field.enabled = true;
      field.position = [ptr.x, ptr.y, ptr.z ?? 0];
    }
  }

  /**
   * Dispatches a gesture action into appropriate instantaneous or sustained force bursts.
   */
  handleGesture(
    gesture: GestureType,
    originX: number,
    originY: number,
    details?: {
      scale?: number;
      rotation?: number;
      velocityX?: number;
      velocityY?: number;
    },
  ): void {
    // 1. Look for custom mapped action
    const mapped = this.gestureMappings.find((m) => m.gesture === gesture);
    const action = mapped?.action ?? this.getDefaultActionForGesture(gesture);
    const radius = mapped?.radius ?? this.config.radius ?? 0.3;
    const strength = mapped?.strength ?? this.config.strength ?? 100.0;

    switch (action) {
      case "burst":
      case "radial-shockwave": {
        // Instantaneous repulsive shockwave
        const shockwave = new RepulsionForceField({
          type: "repulsion",
          position: [originX, originY, 0],
          radius: radius * 1.5,
          strength: strength * 2.5,
          falloff: "smoothstep",
        });
        this.manager.addField(shockwave);

        // Auto-remove after 150ms
        setTimeout(() => {
          this.manager.removeField(shockwave.id);
        }, 150);
        break;
      }

      case "displace":
      case "momentum-inject": {
        const vx = details?.velocityX ?? 0;
        const vy = details?.velocityY ?? 0;
        const vMag = Math.hypot(vx, vy) || 1;

        const directional = new AttractionForceField({
          type: "attraction",
          position: [originX + (vx / vMag) * radius, originY + (vy / vMag) * radius, 0],
          radius: radius * 2.0,
          strength: strength * 1.5,
          falloff: "linear",
        });
        this.manager.addField(directional);

        setTimeout(() => {
          this.manager.removeField(directional.id);
        }, 200);
        break;
      }

      case "expand": {
        const repulse = new RepulsionForceField({
          type: "repulsion",
          position: [originX, originY, 0],
          radius: radius * (details?.scale ?? 1.5),
          strength: strength * 1.8,
          falloff: "smoothstep",
        });
        this.manager.addField(repulse);
        setTimeout(() => {
          this.manager.removeField(repulse.id);
        }, 250);
        break;
      }

      case "compress":
      case "singularity": {
        const attract = new AttractionForceField({
          type: "attraction",
          position: [originX, originY, 0],
          radius: radius * 2.0,
          strength: strength * 3.0,
          falloff: "inverse-square",
        });
        this.manager.addField(attract);
        setTimeout(() => {
          this.manager.removeField(attract.id);
        }, 400);
        break;
      }

      case "vortex": {
        const vortex = new VortexForceField({
          type: "vortex",
          position: [originX, originY, 0],
          radius: radius * 1.5,
          strength: strength * 2.0 * Math.sign(details?.rotation || 1),
          falloff: "smoothstep",
        });
        this.manager.addField(vortex);
        setTimeout(() => {
          this.manager.removeField(vortex.id);
        }, 350);
        break;
      }
    }
  }

  private getDefaultActionForGesture(gesture: GestureType): GestureForceAction["action"] {
    switch (gesture) {
      case "tap":
        return "burst";
      case "double-tap":
        return "radial-shockwave";
      case "drag":
      case "pan":
        return "displace";
      case "swipe":
        return "momentum-inject";
      case "pinch":
        return "compress";
      case "rotation":
        return "vortex";
      case "long-press":
        return "singularity";
      default:
        return "burst";
    }
  }

  getPointers(): readonly InteractivePointer[] {
    return Array.from(this.pointers.values());
  }

  clear(): void {
    for (const field of this.pointerFields.values()) {
      this.manager.removeField(field.id);
    }
    this.pointerFields.clear();
    this.pointers.clear();
  }
}
