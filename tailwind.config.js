/**
 * Tailwind config mirrors DESIGN_MANIFEST.md token names so utility classes
 * like bg-surface, text-ink, ring-signal resolve to the CSS custom properties
 * defined in src/styles/tokens.css. The theme switch on <html data-theme="..">
 * flows through automatically because the utility classes read var(--...).
 *
 * Components that need a colour outside this map are violating the Calm
 * Dashboard System and should be flagged in the next audit.
 */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        bg:            'var(--bg)',
        surface:       'var(--surface)',
        'surface-2':   'var(--surface-2)',
        'surface-3':   'var(--surface-3)',
        line:          'var(--line)',
        'line-strong': 'var(--line-strong)',

        ink:           'var(--ink)',
        'ink-soft':    'var(--ink-soft)',
        'ink-mute':    'var(--ink-mute)',
        'ink-faint':   'var(--ink-faint)',

        signal:        'var(--signal)',
        'signal-soft': 'var(--signal-soft)',
        'signal-line': 'var(--signal-line)',

        warm:          'var(--warm)',
        'warm-soft':   'var(--warm-soft)',

        // Explicit stone-50 so the requested bg-stone-50 utility in
        // MasterDashboard.js resolves to the Manifest page ground colour.
        stone: {
          50: '#FAFAF9'
        }
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace']
      }
    }
  },
  plugins: []
};
