"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class DriveErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) {}
  render() {
    if (this.state.failed) return <div className="fallback"><strong>THE ROAD COULD NOT BE RENDERED.</strong><p>This browser cannot open the 3D drive. The message and music remain available on a WebGL-capable device.</p></div>;
    return this.props.children;
  }
}
