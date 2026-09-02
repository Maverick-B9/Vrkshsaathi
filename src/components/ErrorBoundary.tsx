import React, { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-field-parchment flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center border border-laterite-clay/20">
            <h1 className="text-2xl font-bold text-laterite-clay mb-4">
              Something went wrong
            </h1>
            <p className="text-ink-bark mb-4">
              The application failed to initialize.
            </p>
            <p className="text-slate-bark text-sm bg-slate-100 p-4 rounded text-left overflow-auto mb-6">
              {this.state.error?.message}
            </p>
            <p className="text-slate-bark text-xs">
              Note: This is likely a configuration or initialization issue, not a code bug. Please check your environment variables and configuration.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-4 py-2 bg-laterite-clay text-white rounded hover:bg-opacity-90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
