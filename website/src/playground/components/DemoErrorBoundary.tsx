import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  readonly children: ReactNode;
  readonly demoId: string;
  readonly onReset?: () => void;
}

interface State {
  readonly hasError: boolean;
  readonly errorMessage?: string;
}

export class DemoErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  public override componentDidUpdate(prevProps: Props): void {
    if (prevProps.demoId !== this.props.demoId && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: undefined });
    }
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn("[AF Motion Playground] Isolated demonstration error:", error, info);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="w-full h-full min-h-[260px] flex flex-col items-center justify-center p-8 rounded-xl bg-[#0b0d14] border border-rose-500/30 text-center"
        >
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Demonstration Error Isolated
          </h3>
          <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
            {this.state.errorMessage || "An unexpected error occurred in this demo."}
          </p>
          <Button
            variant="secondary"
            size="sm"
            iconLeading={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => {
              this.setState({ hasError: false, errorMessage: undefined });
              this.props.onReset?.();
            }}
          >
            Reset Demonstration
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
