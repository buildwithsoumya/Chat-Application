import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
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
        <div className="flex flex-col items-center justify-center h-full w-full min-h-[400px] p-6 text-center space-y-4">
          <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md">
            We're sorry, but an unexpected error occurred. Please try refreshing the page or navigating back.
          </p>
          <div className="flex gap-4 mt-6">
            <Button onClick={() => window.location.reload()} variant="default">
              Refresh Page
            </Button>
            <Button onClick={() => this.setState({ hasError: false, error: null })} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
