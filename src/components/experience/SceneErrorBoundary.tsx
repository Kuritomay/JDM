"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.failed) return <div className="fallback"><strong>3D EXPERIENCE UNAVAILABLE</strong><p>This browser cannot render the garage scene.</p></div>;
    return this.props.children;
  }
}
