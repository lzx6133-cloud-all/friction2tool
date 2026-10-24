/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#f4f2ec',
        surface: '#fbfaf7',
        ink: '#1d1d19',
        muted: '#706d64',
        line: '#d9d5ca',
        accent: '#e15a2b',
        'accent-deep': '#a8431f',
        'accent-soft': '#f8e5dc',
        sage: '#dfe7d8',
        danger: '#b43320',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
      },
      boxShadow: {
        card: '0 1px 0 rgba(29, 29, 25, 0.06), 0 10px 30px -24px rgba(29, 29, 25, 0.35)',
        float: '0 24px 80px -32px rgba(29, 29, 25, 0.4)',
      },
      keyframes: {
        'soft-pulse': {
          '0%, 100%': { opacity: '0.38' },
          '50%': { opacity: '0.8' },
        },
        'slide-up': {
          from: { transform: 'translateY(8px)' },
          to: { transform: 'translateY(0)' },
        },
      },
      animation: {
        'soft-pulse': 'soft-pulse 1.5s ease-in-out infinite',
        'slide-up': 'slide-up 180ms ease-out both',
      },
    },
  },
  plugins: [],
};
