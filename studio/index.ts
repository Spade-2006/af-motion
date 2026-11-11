/**
 * AF Motion Studio — Main Entry Point
 *
 * Visual playground and developer tool for creating, previewing, and exporting
 * AF Motion animations, procedural backgrounds, visual styles, design systems,
 * Motion DNA profiles, physics, gestures, advanced motion & morphing, and code snippets.
 */

export * from "./types/index.js";
export * from "./engine/animation-engine.js";
export * from "./engine/background-engine.js";
export * from "./engine/code-generator.js";
export * from "./engine/style-explorer-engine.js";
export * from "./engine/design-system-dna-engine.js";
export * from "./engine/choreography-builder-engine.js";
export * from "./components/StudioHeader.js";
export * from "./components/AnimationEditor.js";
export * from "./components/BackgroundEditor.js";
export * from "./components/PreviewStage.js";
export * from "./components/TimelineController.js";
export * from "./components/CodeExportPanel.js";
export * from "./components/FutureModulePlaceholders.js";
export * from "./components/style-explorer/StyleCatalog.js";
export * from "./components/style-explorer/StyleCustomizer.js";
export * from "./components/style-explorer/StyleComponentPreview.js";
export * from "./components/style-explorer/StyleComparisonView.js";
export * from "./components/style-explorer/StyleIntelligencePanel.js";
export * from "./components/style-explorer/StyleDetailInspector.js";
export * from "./components/style-explorer/StyleCodeExport.js";
export * from "./components/style-explorer/StyleExplorer.js";
export * from "./components/design-systems/DesignSystemPaletteSelector.js";
export * from "./components/design-systems/DesignSystemTokenEditor.js";
export * from "./components/design-systems/MotionDNAEditor.js";
export * from "./components/design-systems/DesignSystemLivePreview.js";
export * from "./components/design-systems/DesignSystemCompatibilityPanel.js";
export * from "./components/design-systems/DesignSystemCodeExport.js";
export * from "./components/design-systems/DesignSystemStudio.js";
export * from "./components/choreography/ChoreographyTimelineEditor.js";
export * from "./components/choreography/ChoreographyPlaybackController.js";
export * from "./components/choreography/ChoreographySystemManager.js";
export * from "./components/choreography/ChoreographyLivePreview.js";
export * from "./components/choreography/ChoreographyIntelligencePanel.js";
export * from "./components/choreography/ChoreographyTemplateSelector.js";
export * from "./components/choreography/ChoreographyCodeExport.js";
export * from "./components/choreography/ChoreographyStudio.js";
export * from "./engine/scene-3d-studio-engine.js";
export * from "./components/scene-3d/Scene3DHierarchyPanel.js";
export * from "./components/scene-3d/Scene3DGeometryEditor.js";
export * from "./components/scene-3d/Scene3DCameraLightingEditor.js";
export * from "./components/scene-3d/Scene3DMaterialEditor.js";
export * from "./components/scene-3d/Scene3DLiveViewport.js";
export * from "./components/scene-3d/Scene3DIntelligencePanel.js";
export * from "./components/scene-3d/Scene3DTemplateSelector.js";
export * from "./components/scene-3d/Scene3DCodeExport.js";
export * from "./components/scene-3d/Scene3DStudio.js";
export * from "./types/advanced-3d.js";
export * from "./engine/advanced-3d-engine.js";
export * from "./components/scene-3d/Physics3DPlayground.js";
export * from "./components/scene-3d/RigidBodyConstraintEditor.js";
export * from "./components/scene-3d/SoftBodyClothPlayground.js";
export * from "./components/scene-3d/ProceduralTerrainEditor.js";
export * from "./components/scene-3d/WorldGeneratorEditor.js";
export * from "./components/scene-3d/ModelIntelligencePanel.js";
export * from "./components/scene-3d/Morphing3DPlayground.js";
export * from "./components/scene-3d/UnifiedSceneCompositionEditor.js";
export * from "./components/scene-3d/Advanced3DDiagnostics.js";
export * from "./components/scene-3d/Advanced3DPresetLibrary.js";
export * from "./components/scene-3d/Advanced3DCodeExport.js";
export * from "./types/motion-physics.js";
export * from "./engine/motion-physics-engine.js";
export * from "./components/motion-physics/MotionPhysicsStudio.js";
export * from "./components/motion-physics/PhysicsPlayground.js";
export * from "./components/motion-physics/AdvancedSpringEditor.js";
export * from "./components/motion-physics/InertiaForceEditor.js";
export * from "./components/motion-physics/CollisionConstraintEditor.js";
export * from "./components/motion-physics/PhysicsCompositionBuilder.js";
export * from "./components/motion-physics/PhysicsPresetLibrary.js";
export * from "./components/motion-physics/PhysicsDiagnosticsPanel.js";
export * from "./components/motion-physics/PhysicsCodeExport.js";
export * from "./types/interactions.js";
export * from "./engine/interactions-engine.js";
export * from "./components/interactions/InteractionPlayground.js";
export * from "./components/interactions/InteractiveCanvas.js";
export * from "./components/interactions/PointerDragEditor.js";
export * from "./components/interactions/TouchMultitouchEditor.js";
export * from "./components/interactions/GestureRecognitionEditor.js";
export * from "./components/interactions/GestureSequenceBuilder.js";
export * from "./components/interactions/CursorMagneticEditor.js";
export * from "./components/interactions/EventInspectorTimeline.js";
export * from "./components/interactions/InteractionPresetLibrary.js";
export * from "./components/interactions/InteractionDiagnosticsPanel.js";
export * from "./components/interactions/InteractionCodeExport.js";
export * from "./types/advanced-motion.js";
export * from "./engine/advanced-motion-engine.js";
export * from "./components/advanced-motion/AdvancedMotionStudio.js";
export * from "./components/advanced-motion/LayoutAnimationEditor.js";
export * from "./components/advanced-motion/SvgMorphEditor.js";
export * from "./components/advanced-motion/MotionPathEditor.js";
export * from "./components/advanced-motion/KineticTypographyEditor.js";
export * from "./components/advanced-motion/SharedElementEditor.js";
export * from "./components/advanced-motion/ViewTransitionPlayground.js";
export * from "./components/advanced-motion/UnifiedCompositionBuilder.js";
export * from "./components/advanced-motion/AdvancedMotionPreviewCanvas.js";
export * from "./components/advanced-motion/AdvancedMotionPresetLibrary.js";
export * from "./components/advanced-motion/AdvancedMotionTimeline.js";
export * from "./components/advanced-motion/AdvancedMotionDiagnostics.js";
export * from "./components/advanced-motion/AdvancedMotionCodeExport.js";

export * from "./types/gpu-simulations.js";
export * from "./engine/gpu-simulations-engine.js";
export * from "./components/gpu-simulations/GpuSimulationStudio.js";
export * from "./components/gpu-simulations/GpuBackendInspector.js";
export * from "./components/gpu-simulations/ParticleSystemEditor.js";
export * from "./components/gpu-simulations/FluidSimulationEditor.js";
export * from "./components/gpu-simulations/EnvironmentalEffectsEditor.js";
export * from "./components/gpu-simulations/InteractiveForcesEditor.js";
export * from "./components/gpu-simulations/SimulationCompositionBuilder.js";
export * from "./components/gpu-simulations/SimulationViewport.js";
export * from "./components/gpu-simulations/SimulationPresetLibrary.js";
export * from "./components/gpu-simulations/SimulationTimeline.js";
export * from "./components/gpu-simulations/SimulationDiagnostics.js";
export * from "./components/gpu-simulations/SimulationCodeExport.js";

export * from "./types/unified-playground.js";
export * from "./engine/unified-playground-engine.js";
export * from "./components/unified-playground/UnifiedPlayground.js";
export * from "./components/unified-playground/UnifiedLiveStage.js";
export * from "./components/unified-playground/UnifiedCompositionEditor.js";
export * from "./components/unified-playground/UnifiedPresetHub.js";
export * from "./components/unified-playground/UnifiedDesignBridge.js";
export * from "./components/unified-playground/UnifiedTelemetryPanel.js";
export * from "./components/unified-playground/AIMotionIntelligencePanel.js";
export * from "./components/unified-playground/DesignToMotionPanel.js";
export * from "./components/unified-playground/AISceneGeneratorPanel.js";
export * from "./components/unified-playground/AIAgentsPanel.js";
export * from "./components/unified-playground/UnifiedCodeExportModal.js";

export * from "./components/StudioApp.js";
export * from "./mount.js";

// Re-export original DOM playground for backward compatibility with existing tests
export {
  createStudio,
  createStudioShareUrl,
  generateUsageSnippet,
  readStudioSettings,
  STUDIO_PRESETS,
  type UsageSnippetSettings,
  type EffectName,
} from "./playground.js";
