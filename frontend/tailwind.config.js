/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        apple: {
          blue: '#0071E3',
          'blue-hover': '#0077ED',
          indigo: '#5E5CE6',
          purple: '#AF52DE',
          pink: '#FF2D55',
          teal: '#64D2FF',
          mint: '#30D158',
          orange: '#FF9F0A',
          yellow: '#FFD60A',
          red: '#FF453A',
          gray: {
            50: '#F5F5F7',
            100: '#E8E8ED',
            200: '#D2D2D7',
            300: '#86868B',
            400: '#6E6E73',
            500: '#424245',
            600: '#333336',
            700: '#242426',
            800: '#1D1D1F',
            900: '#151516',
            950: '#0B0B0C',
          }
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.75)',
          'light-border': 'rgba(255, 255, 255, 0.4)',
          dark: 'rgba(22, 24, 29, 0.72)',
          'dark-elevated': 'rgba(29, 32, 40, 0.82)',
          'dark-border': 'rgba(255, 255, 255, 0.08)',
          'dark-border-subtle': 'rgba(255, 255, 255, 0.04)',
        }
      },
      boxShadow: {
        'glass-sm': '0 2px 10px 0 rgba(0, 0, 0, 0.1)',
        'glass-md': '0 8px 30px 0 rgba(0, 0, 0, 0.25)',
        'glass-lg': '0 20px 50px 0 rgba(0, 0, 0, 0.35)',
        'glow-blue': '0 0 25px -5px rgba(0, 113, 227, 0.4)',
        'glow-purple': '0 0 25px -5px rgba(175, 82, 222, 0.35)',
        'glow-mint': '0 0 25px -5px rgba(48, 209, 88, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
        'apple': '24px',
      },
      borderRadius: {
        'apple': '18px',
        'apple-sm': '12px',
        'apple-lg': '24px',
        'apple-xl': '32px',
      }
    },
  },
  plugins: [],
}
