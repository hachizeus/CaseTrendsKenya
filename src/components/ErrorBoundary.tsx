import React, { ReactNode, Component, ErrorInfo } from "react";
import { AlertCircle, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback?.(this.state.error!, this.resetError) || (
          <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-center mb-2">Oops! Something went wrong</h1>
              <p className="text-center text-muted-foreground mb-4">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <details className="mb-6 p-3 bg-secondary rounded-lg">
                <summary className="cursor-pointer font-medium text-sm mb-2">
                  Error details
                </summary>
                <pre className="text-xs text-muted-foreground overflow-auto max-h-40 whitespace-pre-wrap break-words">
                  {this.state.error?.stack}
                </pre>
              </details>
              <div className="flex gap-2">
                <button
                  onClick={this.resetError}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  to="/"
                  className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg font-medium hover:bg-secondary/80 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" /> Home
                </Link>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
