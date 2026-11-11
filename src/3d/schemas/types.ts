/**
 * AF Motion 3D Scene Specification & Schema Types
 *
 * Machine-readable, typed contracts for complete 3D scenes, spatial transforms,
 * object graphs, primitive geometries, model references, materials, and interactions.
 */

export type {
  Camera3DConfig,
  Environment3DConfig,
  Lighting3DConfig,
  Renderer3DConfig,
} from "../types.js";

import type {
  Camera3DConfig,
  Environment3DConfig,
  Lighting3DConfig,
  Renderer3DConfig,
} from "../types.js";

export type Vector3 = readonly [x: number, y: number, z: number];
export type Quaternion = readonly [x: number, y: number, z: number, w: number];
export type EulerRotation = readonly [x: number, y: number, z: number];

export interface Transform3D {
  readonly position?: Vector3;
  readonly rotation?: EulerRotation;
  readonly quaternion?: Quaternion;
  readonly scale?: Vector3;
}

export interface BoundingBox3D {
  readonly min: Vector3;
  readonly max: Vector3;
  readonly size?: Vector3;
  readonly center?: Vector3;
}

export type CoordinateSystem = "right-handed-y-up" | "left-handed-y-up";

// --- Geometries ---

export type GeometryPrimitiveType =
  | "box"
  | "sphere"
  | "cylinder"
  | "plane"
  | "torus"
  | "cone"
  | "capsule";

export interface PrimitiveGeometrySpec {
  readonly type: "primitive";
  readonly primitive: GeometryPrimitiveType;
  readonly parameters?: Record<string, number>;
}

export interface ModelReferenceSpec {
  readonly type: "model";
  readonly format: "gltf" | "glb" | "obj" | "fbx";
  readonly url: string;
  readonly scale?: number;
  readonly draco?: boolean;
}

export interface CustomGeometrySpec {
  readonly type: "custom";
  readonly id: string;
  readonly parameters?: Record<string, unknown>;
}

export type GeometrySpec =
  | PrimitiveGeometrySpec
  | ModelReferenceSpec
  | CustomGeometrySpec;

// --- Materials ---

export type Material3DType =
  | "basic"
  | "standard"
  | "physical"
  | "phong"
  | "toon"
  | "shadow"
  | "custom";

export type MaterialType3D = Material3DType;

export interface MaterialSpec {
  readonly id?: string;
  readonly type: Material3DType;
  readonly color?: string;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly transmission?: number;
  readonly ior?: number;
  readonly opacity?: number;
  readonly transparent?: boolean;
  readonly wireframe?: boolean;
  readonly mapUrl?: string;
  readonly normalMapUrl?: string;
  readonly roughnessMapUrl?: string;
}

// --- Interactions & Animations ---

export type InteractionTrigger =
  | "click"
  | "hover"
  | "drag"
  | "pointer-move"
  | "key-press"
  | "scroll-into-view";

export type InteractionAction =
  | "animate"
  | "emit-event"
  | "navigate"
  | "highlight"
  | "focus"
  | "custom";

export interface AccessibilitySpec {
  readonly ariaLabel?: string;
  readonly role?: string;
  readonly focusable?: boolean;
  readonly keyboardShortcut?: string;
}

export interface InputMappingSpec {
  readonly pointer?: boolean;
  readonly keyboard?: boolean;
  readonly touch?: boolean;
  readonly wheel?: boolean;
}

export interface CameraControlSpec {
  readonly mode?: "orbit" | "pan" | "zoom" | "combined" | "none";
  readonly enableOrbit?: boolean;
  readonly enablePan?: boolean;
  readonly enableZoom?: boolean;
  readonly dampingFactor?: number;
  readonly minDistance?: number;
  readonly maxDistance?: number;
  readonly minPolarAngle?: number;
  readonly maxPolarAngle?: number;
}

export interface ScrollTimelineSpec {
  readonly id: string;
  readonly name?: string;
  readonly keyframes: readonly any[];
  readonly sections?: readonly any[];
}

export interface SceneInteractionSpec {
  readonly controls?: CameraControlSpec;
  readonly inputMapping?: InputMappingSpec;
  readonly defaultHighlightColor?: string;
}

export interface InteractionSpec {
  readonly trigger: InteractionTrigger;
  readonly action: InteractionAction;
  readonly targetId?: string;
  readonly parameters?: Record<string, unknown>;
}

export interface AnimationKeyframeSpec {
  readonly time: number;
  readonly value: unknown;
  readonly easing?: string;
}

export interface AnimationTrackSpec {
  readonly property: "position" | "rotation" | "scale" | "opacity" | "color" | string;
  readonly keyframes: readonly AnimationKeyframeSpec[];
  readonly loop?: boolean;
  readonly duration?: number;
}

export interface ObjectAnimationSpec {
  readonly targetId: string;
  readonly tracks: readonly AnimationTrackSpec[];
  readonly autoPlay?: boolean;
}

// --- Scene Object Nodes ---

export type SceneObjectType =
  | "group"
  | "mesh"
  | "primitive"
  | "light"
  | "camera"
  | "environment"
  | "model"
  | "interactive"
  | "custom";

export interface BaseSceneObject {
  readonly id: string;
  readonly name?: string;
  readonly type: SceneObjectType;
  readonly transform?: Transform3D;
  readonly visible?: boolean;
  readonly castShadow?: boolean;
  readonly receiveShadow?: boolean;
  readonly parentId?: string;
  readonly children?: readonly SceneObjectSpec[];
  readonly accessibility?: AccessibilitySpec;
  readonly interaction?: InteractionSpec;
  readonly userData?: Record<string, unknown>;
}

export interface GroupObjectSpec extends BaseSceneObject {
  readonly type: "group";
}

export interface MeshObjectSpec extends BaseSceneObject {
  readonly type: "mesh";
  readonly geometry?: GeometrySpec;
  readonly material?: MaterialSpec;
}

export interface PrimitiveObjectSpec extends BaseSceneObject {
  readonly type: "primitive";
  readonly geometry: PrimitiveGeometrySpec;
  readonly material?: MaterialSpec;
}

export interface LightObjectSpec extends BaseSceneObject {
  readonly type: "light";
  readonly lightType: "ambient" | "directional" | "point" | "spot";
  readonly color?: string;
  readonly intensity?: number;
  readonly distance?: number;
  readonly decay?: number;
  readonly angle?: number;
  readonly penumbra?: number;
  readonly target?: Vector3;
}

export interface CameraObjectSpec extends BaseSceneObject {
  readonly type: "camera";
  readonly camera: Camera3DConfig;
}

export interface EnvironmentObjectSpec extends BaseSceneObject {
  readonly type: "environment";
  readonly environment: Environment3DConfig;
}

export interface ModelObjectSpec extends BaseSceneObject {
  readonly type: "model";
  readonly model: ModelReferenceSpec;
  readonly material?: MaterialSpec;
}

export interface InteractiveObjectSpec extends BaseSceneObject {
  readonly type: "interactive";
  readonly interaction: InteractionSpec;
  readonly geometry?: GeometrySpec;
  readonly material?: MaterialSpec;
}

export interface CustomObjectSpec extends BaseSceneObject {
  readonly type: "custom";
  readonly customType: string;
  readonly properties?: Record<string, unknown>;
}

export type SceneObjectSpec =
  | GroupObjectSpec
  | MeshObjectSpec
  | PrimitiveObjectSpec
  | LightObjectSpec
  | CameraObjectSpec
  | EnvironmentObjectSpec
  | ModelObjectSpec
  | InteractiveObjectSpec
  | CustomObjectSpec;

// --- Complete Scene Specification ---

export interface Scene3DSpecification {
  readonly id: string;
  readonly name?: string;
  readonly version: string;
  readonly metadata?: Record<string, unknown>;
  readonly coordinateSystem?: CoordinateSystem;
  readonly camera?: Camera3DConfig;
  readonly lighting?: Lighting3DConfig;
  readonly environment?: Environment3DConfig;
  readonly renderer?: Renderer3DConfig;
  readonly objects: readonly SceneObjectSpec[];
  readonly animations?: readonly ObjectAnimationSpec[];
  readonly interaction?: SceneInteractionSpec;
  readonly scrollTimeline?: ScrollTimelineSpec;
  readonly autoStart?: boolean;
  readonly respectReducedMotion?: boolean;
}
