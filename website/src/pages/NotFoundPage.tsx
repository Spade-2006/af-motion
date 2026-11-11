import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { GridBackground } from "@/components/effects/GridBackground";
import { GradientSurface } from "@/components/effects/GradientSurface";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Compass, Play, Layers, Code2 } from "lucide-react";

export interface NotFoundPageProps {
  readonly invalidHash?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ invalidHash }) => {
  return (
    <main className="relative w-full min-h-screen overflow-hidden flex items-center">
      <GridBackground variant="grid" fadeEdges />
      <GradientSurface variant="indigo" position="top" className="opacity-35" />

      <PageContainer maxWidth="lg" className="py-32 relative z-10">
        <Card variant="glow" className="p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6">
          <Badge variant="cyan" size="sm">
            404 · Route Not Found
          </Badge>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Unrecognized Destination
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            The route{" "}
            <code className="px-2 py-0.5 rounded bg-white/[0.06] text-cyan-300 font-mono text-xs">
              {invalidHash || "#unknown"}
            </code>{" "}
            does not match an active AF Motion page. Choose a verified destination below.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              iconLeading={<ArrowLeft className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#overview";
              }}
            >
              Return Home
            </Button>
            <Button
              variant="secondary"
              size="md"
              iconLeading={<Compass className="w-4 h-4 text-cyan-400" />}
              onClick={() => {
                window.location.hash = "#onboarding";
              }}
            >
              Onboarding
            </Button>
            <Button
              variant="outline"
              size="md"
              iconLeading={<Layers className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#features";
              }}
            >
              Features
            </Button>
            <Button
              variant="outline"
              size="md"
              iconLeading={<Play className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#playground";
              }}
            >
              Playground
            </Button>
            <Button
              variant="outline"
              size="md"
              iconLeading={<Code2 className="w-4 h-4" />}
              onClick={() => {
                window.location.hash = "#examples";
              }}
            >
              Examples
            </Button>
          </div>
        </Card>
      </PageContainer>
    </main>
  );
};
