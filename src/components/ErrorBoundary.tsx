import { Component, type ErrorInfo, type ReactNode } from 'react';
import { clearStoredSettings } from '../state/settings';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Guitar Scale Visualizer failed to render', error, info.componentStack);
  }

  private handleReset = () => {
    try {
      clearStoredSettings();
    } catch {
      // Storage may be unavailable; reloading with defaults still recovers.
    }
    window.location.reload();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-5 py-10">
        <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] p-6">
          <h1 className="text-lg font-bold text-[var(--text)]">The fretboard stopped rendering</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            Something in the current combination of settings could not be drawn. Resetting to the
            default key, scale and fret range will clear it. Nothing is stored anywhere except this
            browser.
          </p>
          <p className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2 font-mono text-xs break-words text-[var(--text-dim)]">
            {error.message}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="mt-4 h-9 rounded-lg border border-[var(--accent)] px-3 text-sm font-semibold text-[var(--text)]"
          >
            Reset settings and reload
          </button>
        </div>
      </div>
    );
  }
}
