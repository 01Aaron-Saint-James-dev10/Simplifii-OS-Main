import React from 'react';
import {
  SURFACE_BASE,
  TEXT_PRIMARY,
  TEXT_MUTED,
  ACCENT_PULSE,
  FONT_DISPLAY,
  FONT_BODY,
  FONT_SYSTEM,
  BORDER_RADIUS,
} from '../../theme/tokens';

/**
 * ErrorBoundary
 *
 * Catches any JS error in child components and renders a recovery UI
 * instead of a white screen. Logs the error for debugging.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: SURFACE_BASE,
          padding: 32,
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 28,
            fontWeight: 700,
            color: ACCENT_PULSE,
            marginBottom: 16,
          }}
        >
          S
        </span>
        <h1
          style={{
            fontFamily: FONT_BODY,
            fontSize: 18,
            fontWeight: 700,
            color: TEXT_PRIMARY,
            margin: '0 0 8px',
          }}
        >
          Something went wrong
        </h1>
        <p
          style={{
            fontFamily: FONT_BODY,
            fontSize: 13,
            color: TEXT_MUTED,
            margin: '0 0 24px',
            maxWidth: 360,
            lineHeight: 1.5,
          }}
        >
          An unexpected error occurred. Refreshing usually fixes it.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            fontFamily: FONT_SYSTEM,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#000',
            background: ACCENT_PULSE,
            border: 'none',
            borderRadius: BORDER_RADIUS,
            padding: '12px 28px',
            cursor: 'pointer',
            minHeight: 44,
            minWidth: 44,
          }}
        >
          Refresh
        </button>
      </div>
    );
  }
}
