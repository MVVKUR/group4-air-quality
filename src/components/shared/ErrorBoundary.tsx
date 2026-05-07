import { Component, type ReactNode } from 'react';
import { ErrorState } from './ErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      // Surface the original error in dev for inspection.
      // eslint-disable-next-line no-console
      console.error('Caught render error:', error);
    }
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title="Something went wrong"
          message={this.state.error?.message ?? 'An unexpected error occurred while rendering this view.'}
          onRetry={this.reset}
        />
      );
    }
    return this.props.children;
  }
}
