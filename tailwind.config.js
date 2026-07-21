/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Backed by CSS variables (src/index.css) so light/dark is just a
        // different value for the same variable — no per-component dark:
        // classes needed anywhere else in the app.
        label:  'rgb(var(--color-label) / <alpha-value>)',
        label2: 'rgb(var(--color-label2) / <alpha-value>)',
        label3: 'rgb(var(--color-label3) / <alpha-value>)',
        separator: 'rgb(var(--color-separator) / <alpha-value>)',
        fill:    'rgb(var(--color-fill) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        tile:    'rgb(var(--color-tile) / <alpha-value>)',
        violet: {
          DEFAULT: 'rgb(var(--color-violet) / <alpha-value>)',
          hover:   'rgb(var(--color-violet-hover) / <alpha-value>)',
          soft:    'rgb(var(--color-violet-soft) / <alpha-value>)'
        },
        danger: 'rgb(var(--color-danger) / <alpha-value>)'
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"',
          'Inter', 'system-ui', 'sans-serif'
        ],
        mono: ['"SF Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px'
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.04), 0 12px 32px -16px rgba(0,0,0,0.12)'
      }
    }
  },
  plugins: []
}
