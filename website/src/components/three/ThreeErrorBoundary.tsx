import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { FallbackScene } from "./FallbackScene";

interface Props {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface State {
  readonly hasError: boolean;
  readonly error?: Error;
}

export class ThreeErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.warn("[AF Motion 3D] WebGL or Canvas rendering error caught:", error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <FallbackScene error={this.state.error} />;
    }

    return this.props.children;
  }
}
