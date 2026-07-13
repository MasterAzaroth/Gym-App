/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        iron: '#17191C',
        graphite: '#2C3036',
        steel: '#4A5058',
        chalk: '#E9EAEC',
        paper: '#FAFAF9',
        // IWF competition plate colours — used to encode data, not decorate
        plate: {
          red: '#C8102E',    // 25 kg
          blue: '#0B5FA5',   // 20 kg
          yellow: '#E8B10E', // 15 kg
          green: '#1E7A45',  // 10 kg
          white: '#D8D8D4'   //  5 kg
        }
      },
      fontFamily: {
        display: ['"Archivo Black"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        card: '0 1px 2px rgba(23,25,28,0.06), 0 8px 24px -12px rgba(23,25,28,0.18)'
      }
    }
  },
  plugins: []
}
