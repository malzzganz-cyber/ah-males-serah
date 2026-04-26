import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0e1a',
          soft: '#0f1424',
        },
        ink: {
          DEFAULT: '#e6e9f2',
          muted: '#8a93ad',
          dim: '#5b657f',
        },
        card: {
          DEFAULT: '#141a2c',
          soft: '#1a2238',
          ring: '#222b44',
        },
        brand: {
          50: '#eafff3',
          100: '#c9ffdf',
          200: '#9bf7c0',
          300: '#5cf09a',
          400: '#22e07a',
          500: '#10c764',
          600: '#0aa654',
          700: '#0a7e42',
        },
        accent: {
          blue: '#3b82f6',
          purple: '#a855f7',
          orange: '#f59e0b',
          red: '#ef4444',
        },
      },
      boxShadow: {
        soft: '0 8px 30px -10px rgba(16, 199, 100, 0.35)',
        card: '0 4px 20px -6px rgba(0, 0, 0, 0.45)',
        glow: '0 0 24px rgba(16, 199, 100, 0.45)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grid-fade':
          'radial-gradient(circle at 50% 0%, rgba(16,199,100,0.15) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};

export default config;
