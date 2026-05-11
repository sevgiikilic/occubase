/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pulse: {
          50:  '#effaf8',
          100: '#d5f1ed',
          200: '#ace3dc',
          300: '#76cdc4',
          400: '#3fb1a8',
          500: '#1f968d',
          600: '#0f7a74',
          700: '#0c625e',
          800: '#0d4f4c',
          900: '#0c3f3d',
        },
        ink: {
          50:  '#f5f7fb',
          100: '#e8edf6',
          200: '#cfd9ea',
          300: '#a3b3d0',
          400: '#6b80a8',
          500: '#4a5e85',
          600: '#344768',
          700: '#243450',
          800: '#16223a',
          900: '#0b1428',
        },
        paper: '#fbfaf7',
        line:  '#ece9e1',
      },
      fontFamily: {
        display: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'SF Mono', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px rgba(11,20,40,0.04)',
        'sm': '0 1px 2px rgba(11,20,40,0.04), 0 1px 3px rgba(11,20,40,0.05)',
        'md': '0 4px 6px -2px rgba(11,20,40,0.04), 0 8px 24px -6px rgba(11,20,40,0.08)',
        'lg': '0 10px 15px -3px rgba(11,20,40,0.06), 0 20px 40px -12px rgba(11,20,40,0.14)',
        'brand': '0 10px 24px -10px rgba(15,122,116,0.45)',
      },
    },
  },
  plugins: [],
}
