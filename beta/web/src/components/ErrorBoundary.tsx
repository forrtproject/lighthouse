import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Shows a message and a way out instead of a blank page if a view fails to render. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) { return { error }; }

  componentDidCatch(error: Error, info: ErrorInfo) { console.error(error, info.componentStack); }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page narrow">
        <section className="card empty-state" role="alert">
          <span className="eyebrow">Something went wrong</span>
          <h1>This page could not be shown</h1>
          <p>An error stopped this view from rendering. Reloading usually fixes it; if not, go back to the start page.</p>
          <p style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn-secondary" onClick={() => location.reload()}>Reload</button>
            <a className="btn-secondary" href="/">Start page</a>
          </p>
        </section>
      </div>
    );
  }
}
