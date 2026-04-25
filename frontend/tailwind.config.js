/** @type {import('tailwindcss').Config} */
// Tokens locked from DESIGN.md §11. Do not introduce new colors, sizes, or
// spacing values without amending DESIGN.md and logging a decision.
export default {
  content: ['./index.html', './src/**/*.{vue,ts,js}'],
  theme: {
    colors: {
      transparent: 'transparent',
      paper: '#FAFAF8',
      surface: '#FFFFFF',
      overlay: '#F2F2EE',
      ink: '#0A0A0A',
      'ink-muted': '#5C5C5C',
      'ink-subtle': '#8B8B8B',
      accent: '#C8362D',
      'accent-tint': '#FBE8E6',
      tier: {
        1: '#C8362D',
        2: '#8B6F47',
        3: '#4A6B47',
        4: '#3D4A6B',
        5: '#0A0A0A',
      },
    },
    fontFamily: {
      display: ['Inter', 'Helvetica Neue', 'Arial', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
    },
    fontSize: {
      micro: ['11px', { lineHeight: '16px', letterSpacing: '0.08em', fontWeight: '500' }],
      small: ['14px', { lineHeight: '22px' }],
      body: ['16px', { lineHeight: '28px' }],
      h2: ['24px', { lineHeight: '32px', letterSpacing: '-0.005em', fontWeight: '500' }],
      h1: ['32px', { lineHeight: '40px', letterSpacing: '-0.01em', fontWeight: '500' }],
      display: ['48px', { lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: '500' }],
    },
    spacing: {
      0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px',
      6: '24px', 8: '32px', 12: '48px', 16: '64px',
    },
    borderRadius: { none: '0', DEFAULT: '0' },
    extend: {
      borderWidth: { '0.5': '0.5px' },
      transitionTimingFunction: { DEFAULT: 'cubic-bezier(0.4, 0.0, 0.2, 1)' },
      transitionDuration: { DEFAULT: '150ms' },
    },
  },
  plugins: [],
};
