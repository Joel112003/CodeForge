/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base
        base: {
          950: '#1A1612', // deep charcoal
          cream: '#F5F0E8', // warm cream (used as bg-neutral in light mode)
        },
        // Accent
        accent: {
          700: '#C4622D', // burnt sienna (primary accent)
          600: '#D97A3B', // lighter burnt sienna
          800: '#A84D22', // darker burnt sienna
        },
        // Warm neutrals only
        warm: {
          50: '#F5F0E8',
          100: '#EFEAE0',
          200: '#E8E2D9',
          300: '#DFD7CD',
          400: '#C4BDB4',
          500: '#8C8478',
          600: '#6B6459',
          700: '#4A4440',
          800: '#3A3530',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        mono: ['DM Mono', 'monospace'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Display scale with soul
        'display-lg': ['120px', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.03em' }],
        'display-md': ['96px', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.03em' }],
        'display-sm': ['80px', { lineHeight: '1.1', fontWeight: '600', letterSpacing: '-0.03em' }],
        'display-xs': ['64px', { lineHeight: '1.15', fontWeight: '600', letterSpacing: '-0.03em' }],
        // Body tight
        'body-lg': ['16px', { lineHeight: '1.6', letterSpacing: '0em' }],
        'body-md': ['14px', { lineHeight: '1.6', letterSpacing: '0em' }],
        'body-sm': ['12px', { lineHeight: '1.5', letterSpacing: '0em' }],
        // Labels with wide tracking
        'label': ['12px', { lineHeight: '1.2', letterSpacing: '0.2em', fontWeight: '500', textTransform: 'uppercase' }],
      },
      spacing: {
        // Intentional whitespace
        'breathing': '2rem',
        'breathing-lg': '4rem',
      },
      borderRadius: {
        // Sharp corners or very subtle
        'none': '0px',
        'xs': '2px',
        'sm': '3px',
      },
      borderWidth: {
        // Thin 1px only
        DEFAULT: '1px',
      },
      boxShadow: {
        none: 'none',
      },
      opacity: {
        0: '0',
        5: '0.05',
        10: '0.1',
        20: '0.2',
        30: '0.3',
        40: '0.4',
        50: '0.5',
        60: '0.6',
        70: '0.7',
        80: '0.8',
        90: '0.9',
        95: '0.95',
        100: '1',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        200: '200ms',
        300: '300ms',
      },
    },
  },
  corePlugins: {
    // Disable conflicting utilities
    grayscale: false,
    blur: false,
    dropShadow: false,
  },
  plugins: [],
}
