import { Component } from 'react';

/**
 * Catches render errors from any child (previously one bad component — e.g.
 * ChatEmptyState calling an undefined `t` — unmounted the entire app, because
 * React only surfaces errors to the nearest error boundary and there wasn't
 * one). Shows a friendly fallback with a reload button instead of a blank
 * page, and logs the error so it isn't silently swallowed.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught a render error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-cream px-6 text-center">
        <h1 className="font-heading text-2xl font-bold text-text-primary">
          Ups, terjadi kesalahan
        </h1>
        <p className="max-w-md text-sm text-text-secondary">
          Halaman ini gagal dimuat. Silakan muat ulang — jika masalah
          berlanjut, hubungi tim FurKeeper.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-brand-burgundy px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-burgundy/90"
        >
          Muat ulang halaman
        </button>
      </div>
    );
  }
}