/**
 * AF Motion Component & Scene Composition Engine
 *
 * Framework-independent engine allowing AI agents and developer tools to combine
 * capabilities into structured, deterministic, machine-readable component and scene compositions.
 */

import type { AIMotionCapability, AIMotionRegistry } from "./ai-motion-registry.js";
import type { DesignContext } from "./design-intelligence.js";
import type { MotionSpecification, MotionTriggerType } from "./natural-motion.js";
import {
  validateConfiguration,
  type ConfigurationValidationResult,
  type SchemaCapabilityCategory,
  type UnifiedMotionSchema,
} from "./schema.js";

export const COMPOSITION_SPEC_VERSION = "1.0.0";

export type CompositionNodeType = "scene" | "component" | "element" | "effect" | "background";

export interface NodeTargetDescriptor {
  readonly selector?: string;
  readonly tag?: string;
  readonly role?: string;
  readonly isCollection?: boolean;
}

export interface NodeTimingConfig {
  readonly duration?: number;
  readonly delay?: number;
  readonly easing?: string;
}

export interface NodeStaggerConfig {
  readonly delay: number;
  readonly from?: "start" | "first" | "center" | "end" | "last" | "edges" | "random";
}

export interface NodeLayoutMetadata {
  readonly display?: "block" | "flex" | "grid" | "inline" | "inline-block" | "none";
  readonly position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  readonly zIndex?: number;
  readonly width?: string;
  readonly height?: string;
}

export interface CompositionNode {
  readonly id: string;
  readonly name: string;
  readonly type: CompositionNodeType;
  readonly target?: NodeTargetDescriptor;
  readonly parentId?: string;
  readonly children?: readonly string[];
  readonly capabilityId?: string;
  readonly category?: SchemaCapabilityCategory;
  readonly configuration?: Readonly<Record<string, unknown>>;
  readonly trigger?: MotionTriggerType;
  readonly timing?: NodeTimingConfig;
  readonly stagger?: NodeStaggerConfig;
  readonly dependencies?: readonly string[];
  readonly layout?: NodeLayoutMetadata;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CompositionAccessibilitySettings {
  readonly respectReducedMotion: boolean;
  readonly reducedMotionBehavior?: "skips-to-endpoint" | "disables-animation" | "static-fallback";
  readonly announceTransitions?: boolean;
}

export interface MotionComposition {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly rootNodeId: string;
  readonly nodes: Readonly<Record<string, CompositionNode>>;
  readonly motionDNA?: string;
  readonly designSystem?: string;
  readonly paletteId?: string;
  readonly accessibility: CompositionAccessibilitySettings;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CompositionTree {
  readonly root: CompositionNode;
  readonly depth: number;
  readonly totalNodes: number;
  readonly nodesById: Readonly<Record<string, CompositionNode>>;
  readonly childrenByParentId: Readonly<Record<string, readonly CompositionNode[]>>;
}

export interface CompositionValidationError {
  readonly nodeId?: string;
  readonly field?: string;
  readonly message: string;
  readonly rule:
    | "structure"
    | "schema"
    | "circular_dependency"
    | "missing_node"
    | "missing_capability"
    | "duplicate_id";
}

export interface CompositionConflict {
  readonly id: string;
  readonly type:
    | "animation_collision"
    | "z_index_conflict"
    | "accessibility_conflict"
    | "dependency_cycle";
  readonly severity: "warning" | "error";
  readonly message: string;
  readonly nodeIds: readonly string[];
  readonly resolution?: string;
}

export interface CompositionValidationResult {
  readonly valid: boolean;
  readonly errors: readonly CompositionValidationError[];
  readonly warnings: readonly string[];
  readonly conflicts: readonly CompositionConflict[];
}

export interface CompositionResult {
  readonly success: boolean;
  readonly composition: MotionComposition;
  readonly tree?: CompositionTree;
  readonly executionOrder: readonly string[];
  readonly validation: CompositionValidationResult;
  readonly conflicts: readonly CompositionConflict[];
}

export interface CompositionOptions {
  readonly registry?: AIMotionRegistry;
  readonly validateSchemas?: boolean;
  readonly designContext?: DesignContext;
  readonly motionSpecification?: MotionSpecification;
  readonly strictDependencies?: boolean;
}

export interface ComposeSceneRequest {
  readonly type:
    | "hero"
    | "card-grid"
    | "interactive-button"
    | "scroll-section"
    | "background-effect"
    | "landing-page";
  readonly name?: string;
  readonly description?: string;
  readonly targetSelector?: string;
  readonly cardCount?: number;
  readonly backgroundCapability?: string;
  readonly effectCapability?: string;
  readonly motionDNA?: string;
  readonly designSystem?: string;
  readonly paletteId?: string;
  readonly customNodes?: readonly CompositionNode[];
}

let defaultRegistryResolver: (() => AIMotionRegistry | undefined) | undefined;

/**
 * Registers the global AI Motion Registry resolver to maintain zero circular dependencies.
 */
export function setCompositionRegistryResolver(
  resolver: () => AIMotionRegistry | undefined,
): void {
  defaultRegistryResolver = resolver;
}

/**
 * Resolves the effective registry from options or global resolver.
 */
export function getEffectiveCompositionRegistry(
  options?: CompositionOptions,
): AIMotionRegistry | undefined {
  return options?.registry ?? defaultRegistryResolver?.();
}

/**
 * Default empty root scene node.
 */
function createDefaultRootNode(id = "root"): CompositionNode {
  return {
    id,
    name: "Root Scene",
    type: "scene",
    children: [],
    dependencies: [],
  };
}

/**
 * Creates a new strongly-typed MotionComposition.
 */
export function createComposition(initial: Partial<MotionComposition> = {}): MotionComposition {
  const rootId = initial.rootNodeId ?? "root";
  const defaultRoot = createDefaultRootNode(rootId);

  const nodes: Record<string, CompositionNode> = initial.nodes ? { ...initial.nodes } : {};
  if (!nodes[rootId]) {
    nodes[rootId] = defaultRoot;
  }

  return {
    id: initial.id ?? `comp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: initial.name ?? "Untitled Composition",
    description: initial.description,
    version: initial.version ?? COMPOSITION_SPEC_VERSION,
    rootNodeId: rootId,
    nodes,
    motionDNA: initial.motionDNA,
    designSystem: initial.designSystem,
    paletteId: initial.paletteId,
    accessibility: {
      respectReducedMotion: true,
      reducedMotionBehavior: "skips-to-endpoint",
      ...(initial.accessibility ?? {}),
    },
    metadata: initial.metadata ? { ...initial.metadata } : undefined,
  };
}

/**
 * Adds a node to the composition, optionally updating its parent's children list.
 */
export function addCompositionNode(
  composition: MotionComposition,
  node: CompositionNode,
  parentId?: string,
): MotionComposition {
  const targetParentId = parentId ?? node.parentId ?? composition.rootNodeId;
  const nodes = { ...composition.nodes };

  // Update node with parentId if not root
  const updatedNode: CompositionNode = {
    ...node,
    parentId: node.id === composition.rootNodeId ? undefined : targetParentId,
    children: node.children ? [...node.children] : [],
    dependencies: node.dependencies ? [...node.dependencies] : [],
  };

  nodes[node.id] = updatedNode;

  // Add to parent's children if parent exists and is different from node
  if (targetParentId && nodes[targetParentId] && targetParentId !== node.id) {
    const parent = nodes[targetParentId];
    const existingChildren = parent.children ?? [];
    if (!existingChildren.includes(node.id)) {
      nodes[targetParentId] = {
        ...parent,
        children: [...existingChildren, node.id],
      };
    }
  }

  return {
    ...composition,
    nodes,
  };
}

/**
 * Removes a node and recursively removes all of its children from the composition.
 */
export function removeCompositionNode(
  composition: MotionComposition,
  nodeId: string,
): MotionComposition {
  if (nodeId === composition.rootNodeId) {
    throw new Error("Cannot remove root node of composition.");
  }

  if (!composition.nodes[nodeId]) {
    return composition;
  }

  const nodes = { ...composition.nodes };
  const target = nodes[nodeId];

  // Helper to collect all descendant IDs
  function collectDescendantIds(id: string, accumulator: Set<string>): void {
    const n = nodes[id];
    if (!n) return;
    if (n.children) {
      for (const childId of n.children) {
        accumulator.add(childId);
        collectDescendantIds(childId, accumulator);
      }
    }
  }

  const idsToRemove = new Set<string>([nodeId]);
  collectDescendantIds(nodeId, idsToRemove);

  // Remove from parent's children
  if (target.parentId && nodes[target.parentId]) {
    const parent = nodes[target.parentId];
    nodes[target.parentId] = {
      ...parent,
      children: (parent.children ?? []).filter((id) => !idsToRemove.has(id)),
    };
  }

  // Delete all collected nodes
  for (const id of idsToRemove) {
    delete nodes[id];
  }

  // Clean up references in other nodes' dependencies
  for (const id of Object.keys(nodes)) {
    const n = nodes[id];
    if (n.dependencies && n.dependencies.some((dep) => idsToRemove.has(dep))) {
      nodes[id] = {
        ...n,
        dependencies: n.dependencies.filter((dep) => !idsToRemove.has(dep)),
      };
    }
  }

  return {
    ...composition,
    nodes,
  };
}

/**
 * Updates an existing node in the composition.
 */
export function updateCompositionNode(
  composition: MotionComposition,
  nodeId: string,
  updates: Partial<CompositionNode>,
): MotionComposition {
  const existing = composition.nodes[nodeId];
  if (!existing) {
    throw new Error(`Node with ID "${nodeId}" does not exist in composition.`);
  }

  const nodes = { ...composition.nodes };
  nodes[nodeId] = {
    ...existing,
    ...updates,
    id: nodeId, // guarantee id immutability
  };

  return {
    ...composition,
    nodes,
  };
}

/**
 * Detects circular dependencies in the node dependencies graph and parent-child tree.
 */
function detectCycles(
  nodes: Readonly<Record<string, CompositionNode>>,
): { hasCycle: boolean; cyclePath: string[] } {
  const visited = new Set<string>();
  const inStack = new Set<string>();
  let cyclePath: string[] = [];

  function dfs(nodeId: string, currentPath: string[]): boolean {
    visited.add(nodeId);
    inStack.add(nodeId);

    const node = nodes[nodeId];
    if (node) {
      const neighbors = [...(node.dependencies ?? [])];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, [...currentPath, neighbor])) return true;
        } else if (inStack.has(neighbor)) {
          const idx = currentPath.indexOf(neighbor);
          cyclePath = idx >= 0 ? [...currentPath.slice(idx), neighbor] : [neighbor, ...currentPath];
          return true;
        }
      }
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const id of Object.keys(nodes)) {
    if (!visited.has(id)) {
      if (dfs(id, [id])) {
        return { hasCycle: true, cyclePath };
      }
    }
  }

  return { hasCycle: false, cyclePath: [] };
}

/**
 * Performs topological sort on nodes based on dependencies and hierarchy.
 */
function topologicalSort(
  nodes: Readonly<Record<string, CompositionNode>>,
  rootNodeId: string,
): string[] {
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  for (const id of Object.keys(nodes)) {
    inDegree.set(id, 0);
    graph.set(id, []);
  }

  // Populate graph from dependencies: A depends on B means B must execute before A
  for (const [id, node] of Object.entries(nodes)) {
    if (node.dependencies) {
      for (const depId of node.dependencies) {
        if (graph.has(depId)) {
          graph.get(depId)!.push(id);
          inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
        }
      }
    }
    // Also parent executes before child
    if (node.parentId && node.parentId !== id && graph.has(node.parentId)) {
      if (!node.dependencies?.includes(node.parentId)) {
        graph.get(node.parentId)!.push(id);
        inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
      }
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  // Ensure root comes first if degree is 0
  if (queue.includes(rootNodeId)) {
    queue.splice(queue.indexOf(rootNodeId), 1);
    queue.unshift(rootNodeId);
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    const neighbors = graph.get(current) ?? [];
    for (const neighbor of neighbors) {
      const nextDegree = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, nextDegree);
      if (nextDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  // If some nodes are unvisited due to isolated cycles or disconnected graphs, append them
  for (const id of Object.keys(nodes)) {
    if (!result.includes(id)) {
      result.push(id);
    }
  }

  return result;
}

/**
 * Validates a MotionComposition and checks capability schemas and conflicts.
 */
export function validateComposition(
  composition: MotionComposition,
  options: CompositionOptions = {},
): CompositionValidationResult {
  const errors: CompositionValidationError[] = [];
  const warnings: string[] = [];
  const conflicts: CompositionConflict[] = [];

  if (!composition || typeof composition !== "object") {
    return {
      valid: false,
      errors: [{ message: "Composition must be a valid object.", rule: "structure" }],
      warnings: [],
      conflicts: [],
    };
  }

  const root = composition.nodes[composition.rootNodeId];
  if (!root) {
    errors.push({
      nodeId: composition.rootNodeId,
      message: `Root node with ID "${composition.rootNodeId}" does not exist in nodes map.`,
      rule: "missing_node",
    });
  }

  // 1. Check duplicate / missing children references
  const registry = getEffectiveCompositionRegistry(options);
  const seenSelectors = new Map<string, string[]>();
  const backgroundZIndexes = new Map<number, string[]>();

  for (const [id, node] of Object.entries(composition.nodes)) {
    // Check parent exists
    if (node.parentId && !composition.nodes[node.parentId]) {
      errors.push({
        nodeId: id,
        field: "parentId",
        message: `Node "${id}" references non-existent parent "${node.parentId}".`,
        rule: "missing_node",
      });
    }

    // Check children exist
    if (node.children) {
      for (const childId of node.children) {
        if (!composition.nodes[childId]) {
          errors.push({
            nodeId: id,
            field: "children",
            message: `Node "${id}" references non-existent child "${childId}".`,
            rule: "missing_node",
          });
        }
      }
    }

    // Check capability resolution and schema validation
    if (node.capabilityId) {
      if (registry && !registry.hasCapability(node.capabilityId)) {
        errors.push({
          nodeId: id,
          field: "capabilityId",
          message: `Capability "${node.capabilityId}" is not registered in AI Motion Registry.`,
          rule: "missing_capability",
        });
      } else if (registry && options.validateSchemas !== false) {
        const schema = registry.getCapabilitySchema(node.capabilityId);
        if (schema) {
          const configToValidate = {
            ...(node.configuration ?? {}),
            ...(node.target?.selector ? { target: node.target.selector } : {}),
          };
          const valRes = validateConfiguration(schema, configToValidate, { allowUnknown: true });
          if (!valRes.valid) {
            for (const err of valRes.errors) {
              errors.push({
                nodeId: id,
                field: `configuration.${err.path}`,
                message: `Schema validation failed for "${node.capabilityId}": ${err.message}`,
                rule: "schema",
              });
            }
          }
        }
      }
    }

    // Check animation collisions on identical selectors
    if (node.target?.selector && node.capabilityId) {
      const sel = node.target.selector;
      const existing = seenSelectors.get(sel) ?? [];
      existing.push(id);
      seenSelectors.set(sel, existing);
    }

    // Check background z-index overlap
    if (node.type === "background" && node.layout?.zIndex !== undefined) {
      const z = node.layout.zIndex;
      const existing = backgroundZIndexes.get(z) ?? [];
      existing.push(id);
      backgroundZIndexes.set(z, existing);
    }

    // Accessibility check: node with expressive motion without reduced motion handling
    if (
      composition.accessibility.respectReducedMotion &&
      node.timing?.duration &&
      node.timing.duration > 800 &&
      !node.metadata?.hasReducedMotionFallback
    ) {
      conflicts.push({
        id: `conflict-a11y-${id}`,
        type: "accessibility_conflict",
        severity: "warning",
        message: `Node "${node.name}" has duration ${node.timing.duration}ms under strict reduced motion.`,
        nodeIds: [id],
        resolution: "Add static-fallback or skips-to-endpoint override for reduced motion.",
      });
    }
  }

  // 2. Identify selector collision conflicts
  for (const [sel, nodeIds] of seenSelectors.entries()) {
    if (nodeIds.length > 1) {
      conflicts.push({
        id: `conflict-collision-${sel}`,
        type: "animation_collision",
        severity: "warning",
        message: `Multiple nodes (${nodeIds.join(", ")}) apply animations to the same selector "${sel}".`,
        nodeIds,
        resolution: "Coordinate through a choreography group or unique target sub-selectors.",
      });
    }
  }

  // 3. Identify background z-index conflicts
  for (const [zIndex, nodeIds] of backgroundZIndexes.entries()) {
    if (nodeIds.length > 1) {
      conflicts.push({
        id: `conflict-zindex-${zIndex}`,
        type: "z_index_conflict",
        severity: "warning",
        message: `Multiple background nodes (${nodeIds.join(", ")}) share the same zIndex ${zIndex}.`,
        nodeIds,
        resolution: "Assign distinct z-index layers to prevent visual clipping.",
      });
    }
  }

  // 4. Circular dependency detection
  const cycle = detectCycles(composition.nodes);
  if (cycle.hasCycle) {
    errors.push({
      message: `Circular dependency detected: ${cycle.cyclePath.join(" -> ")}`,
      rule: "circular_dependency",
    });
    conflicts.push({
      id: "conflict-cycle",
      type: "dependency_cycle",
      severity: "error",
      message: `Circular dependency detected along path: ${cycle.cyclePath.join(" -> ")}`,
      nodeIds: cycle.cyclePath,
      resolution: "Break the cycle by removing or inverting dependent references.",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    conflicts,
  };
}

/**
 * Builds a structured CompositionTree and computes topological execution order.
 */
export function buildCompositionTree(
  composition: MotionComposition,
  options: CompositionOptions = {},
): CompositionResult {
  const validation = validateComposition(composition, options);
  const rootNode = composition.nodes[composition.rootNodeId];

  if (!validation.valid || !rootNode) {
    return {
      success: false,
      composition,
      executionOrder: [],
      validation,
      conflicts: validation.conflicts,
    };
  }

  // Build children-by-parent map
  const childrenByParentId: Record<string, CompositionNode[]> = {};
  for (const node of Object.values(composition.nodes)) {
    if (node.parentId) {
      if (!childrenByParentId[node.parentId]) {
        childrenByParentId[node.parentId] = [];
      }
      childrenByParentId[node.parentId].push(node);
    }
  }

  // Calculate tree depth
  function computeDepth(nodeId: string, currentDepth: number): number {
    const children = childrenByParentId[nodeId] ?? [];
    if (children.length === 0) return currentDepth;
    return Math.max(...children.map((child) => computeDepth(child.id, currentDepth + 1)));
  }

  const depth = computeDepth(composition.rootNodeId, 1);
  const executionOrder = topologicalSort(composition.nodes, composition.rootNodeId);

  const tree: CompositionTree = {
    root: rootNode,
    depth,
    totalNodes: Object.keys(composition.nodes).length,
    nodesById: composition.nodes,
    childrenByParentId,
  };

  return {
    success: true,
    composition,
    tree,
    executionOrder,
    validation,
    conflicts: validation.conflicts,
  };
}

/**
 * Serializes a MotionComposition to a JSON string.
 */
export function exportCompositionJson(
  composition: MotionComposition,
  options: { pretty?: boolean } = {},
): string {
  return options.pretty ? JSON.stringify(composition, null, 2) : JSON.stringify(composition);
}

/**
 * Deserializes a JSON string into a validated MotionComposition.
 */
export function importCompositionFromJson(
  json: string,
  options: CompositionOptions = {},
): CompositionResult {
  try {
    const parsed = JSON.parse(json, (k, v) => (k === "__proto__" || k === "constructor" || k === "prototype" ? undefined : v));
    const comp = createComposition(parsed);
    return buildCompositionTree(comp, options);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      composition: createComposition({ name: "Invalid Composition" }),
      executionOrder: [],
      validation: {
        valid: false,
        errors: [{ message: `JSON parsing error: ${message}`, rule: "structure" }],
        warnings: [],
        conflicts: [],
      },
      conflicts: [],
    };
  }
}

/**
 * Automates the creation of standard structured animated scenes and components.
 */
export function composeScene(
  request: ComposeSceneRequest,
  options: CompositionOptions = {},
): CompositionResult {
  const rootId = "scene-root";
  let composition = createComposition({
    name: request.name ?? `Scene (${request.type})`,
    description: request.description ?? `Auto-composed scene for ${request.type}`,
    rootNodeId: rootId,
    motionDNA: request.motionDNA ?? options.designContext?.motion.motionDNA,
    designSystem: request.designSystem,
    paletteId: request.paletteId ?? options.designContext?.palettePreference,
  });

  // Apply MotionSpecification if provided
  if (options.motionSpecification) {
    const spec = options.motionSpecification;
    composition = {
      ...composition,
      motionDNA: composition.motionDNA ?? spec.motionDNA,
      designSystem: composition.designSystem ?? spec.designSystem,
    };
  }

  switch (request.type) {
    case "hero": {
      const heroId = "hero-section";
      composition = addCompositionNode(
        composition,
        {
          id: heroId,
          name: "Hero Section Container",
          type: "component",
          target: { selector: request.targetSelector ?? "#hero", role: "banner" },
          layout: { position: "relative", display: "flex" },
        },
        rootId,
      );

      // Background
      const bgCap = request.backgroundCapability ?? "bg-fluid";
      const bgEffect = bgCap === "bg-cosmic" ? "nebula" : "metaballs";
      composition = addCompositionNode(
        composition,
        {
          id: "hero-bg",
          name: "Hero Dynamic Background",
          type: "background",
          target: { selector: "#hero-bg" },
          capabilityId: bgCap,
          category: "background",
          configuration: { effect: bgEffect, target: "#hero-bg" },
          layout: { position: "absolute", zIndex: 0 },
        },
        heroId,
      );

      // Title
      composition = addCompositionNode(
        composition,
        {
          id: "hero-title",
          name: "Hero Title Entrance",
          type: "element",
          target: { selector: "h1", tag: "h1", role: "heading" },
          capabilityId: "preset-fade-in",
          category: "preset",
          trigger: "load",
          timing: { duration: 600, delay: 100, easing: "ease-out" },
          dependencies: ["hero-bg"],
        },
        heroId,
      );

      // CTA Button
      composition = addCompositionNode(
        composition,
        {
          id: "hero-cta",
          name: "Hero Magnetic CTA",
          type: "element",
          target: { selector: "button.cta", tag: "button", role: "button" },
          capabilityId: "pointer-magnetic",
          category: "pointer",
          trigger: "hover",
          configuration: { strength: 0.3, distance: 90 },
          dependencies: ["hero-title"],
        },
        heroId,
      );
      break;
    }

    case "card-grid": {
      const gridId = "card-grid-container";
      composition = addCompositionNode(
        composition,
        {
          id: gridId,
          name: "Card Grid",
          type: "component",
          target: { selector: request.targetSelector ?? ".card-grid" },
          layout: { display: "grid" },
        },
        rootId,
      );

      const count = request.cardCount ?? 3;
      const cardIds: string[] = [];

      for (let i = 1; i <= count; i++) {
        const cardId = `card-item-${i}`;
        cardIds.push(cardId);
        composition = addCompositionNode(
          composition,
          {
            id: cardId,
            name: `Card Item ${i}`,
            type: "element",
            target: { selector: `.card:nth-child(${i})`, isCollection: false },
            capabilityId: "pointer-tilt",
            category: "pointer",
            trigger: "hover",
            configuration: { max: 12 },
          },
          gridId,
        );
      }

      // Add stagger controller
      composition = addCompositionNode(
        composition,
        {
          id: "card-stagger-controller",
          name: "Card Deck Stagger",
          type: "effect",
          target: { selector: ".card", isCollection: true },
          capabilityId: "effect-stagger",
          category: "visual-effect",
          trigger: "inView",
          stagger: { delay: 100, from: "first" },
          dependencies: cardIds,
        },
        gridId,
      );
      break;
    }

    case "interactive-button": {
      composition = addCompositionNode(
        composition,
        {
          id: "interactive-btn",
          name: "Magnetic Interactive Button",
          type: "element",
          target: { selector: request.targetSelector ?? "button" },
          capabilityId: "pointer-magnetic",
          category: "pointer",
          trigger: "hover",
          configuration: { strength: 0.3, distance: 80 },
        },
        rootId,
      );
      break;
    }

    case "scroll-section": {
      const sectionId = "scroll-reveal-section";
      composition = addCompositionNode(
        composition,
        {
          id: sectionId,
          name: "Scroll Reveal Section",
          type: "component",
          target: { selector: request.targetSelector ?? "section.reveal-section" },
          capabilityId: "effect-reveal",
          category: "visual-effect",
          trigger: "scroll",
          configuration: { direction: "up", duration: 700, once: true },
        },
        rootId,
      );
      break;
    }

    case "background-effect": {
      const bgId = "bg-layer";
      composition = addCompositionNode(
        composition,
        {
          id: bgId,
          name: "Atmospheric Canvas Layer",
          type: "background",
          target: { selector: "#bg-canvas" },
          capabilityId: request.backgroundCapability ?? "bg-cosmic",
          category: "background",
          configuration: { effect: "nebula", target: "#bg-canvas" },
          layout: { position: "absolute", zIndex: -1 },
        },
        rootId,
      );

      if (request.effectCapability) {
        composition = addCompositionNode(
          composition,
          {
            id: "overlay-effect-layer",
            name: "Overlay Visual Effect",
            type: "effect",
            capabilityId: request.effectCapability,
            category: "visual-effect",
            dependencies: [bgId],
          },
          rootId,
        );
      }
      break;
    }

    case "landing-page": {
      // Multi-component scene
      const heroRes = composeScene({ type: "hero", targetSelector: "#landing-hero" }, options);
      const gridRes = composeScene({ type: "card-grid", cardCount: 3 }, options);

      // Merge nodes into composition
      for (const node of Object.values(heroRes.composition.nodes)) {
        if (node.id !== heroRes.composition.rootNodeId) {
          composition = addCompositionNode(composition, node, node.parentId === heroRes.composition.rootNodeId ? rootId : node.parentId);
        }
      }
      for (const node of Object.values(gridRes.composition.nodes)) {
        if (node.id !== gridRes.composition.rootNodeId) {
          composition = addCompositionNode(composition, node, node.parentId === gridRes.composition.rootNodeId ? rootId : node.parentId);
        }
      }
      break;
    }
  }

  // Add any custom nodes requested
  if (request.customNodes) {
    for (const node of request.customNodes) {
      composition = addCompositionNode(composition, node);
    }
  }

  return buildCompositionTree(composition, options);
}
