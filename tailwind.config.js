/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // iOS greyscale
        label: '#1C1C1E',        // primary text
        label2: '#6E6E73',       // secondary text
        label3: '#AEAEB2',       // tertiary / placeholder
        separator: '#E5E5EA',
        fill: '#F2F2F7',         // grouped background
        surface: '#FFFFFF',      // card
        // Accent
        violet: {
          DEFAULT: '#6E56CF',
          hover: '#5F48BC',
          soft: '#F1EDFC'
        },
        danger: '#D93843'
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
