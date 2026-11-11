import React from "react";
import { PlaygroundLayout } from "@/playground/components/PlaygroundLayout";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientSurface } from "@/components/effects/GradientSurface";

export interface PlaygroundPageProps {
  readonly initialDemoId?: string;
}

export const PlaygroundPage: React.FC<PlaygroundPageProps> = ({
  initialDemoId,
}) => {
  return (
    <main className="relative w-full min-h-screen overflow-hidden">
      <GridBackground variant="grid" fadeEdges />
      <GradientSurface variant="indigo" position="top" className="opacity-45" />
      <PlaygroundLayout initialDemoId={initialDemoId} />
    </main>
  );
};

export default PlaygroundPage;
