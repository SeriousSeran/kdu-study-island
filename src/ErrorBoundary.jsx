import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="card error-panel">
        <p className="eyebrow">Recovery</p>
        <h1>Something on this screen failed</h1>
        <p>Your saved progress is still kept in IndexedDB. Try another tab, then come back.</p>
        <button className="primary" onClick={() => this.setState({ error: null })}>Try again</button>
      </section>
    );
  }
}
