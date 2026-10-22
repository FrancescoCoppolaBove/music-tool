import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportError } from '../../monitoring';

interface Props {
  children: ReactNode;
  /** Shown in the fallback and attached to the error report. */
  label?: string;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors so one broken tool doesn't blank the whole app.
 * Give it a `key` that changes on navigation to reset it.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, { boundary: this.props.label, componentStack: info.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={{
        margin: '48px auto', maxWidth: 480, padding: '24px 28px', textAlign: 'center',
        background: '#161b22', border: '1px solid #30363d', borderRadius: 12, color: '#c9d1d9',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎵</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 17, color: '#e6edf3' }}>
          {this.props.label ? `${this.props.label} hit a wrong note` : 'Something went wrong'}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#8b949e', lineHeight: 1.5 }}>
          The error has been reported. Try again, or switch to another tool.
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #30363d', background: '#21262d', color: '#e6edf3', fontWeight: 600, cursor: 'pointer' }}
        >
          Try again
        </button>
      </div>
    );
  }
}
