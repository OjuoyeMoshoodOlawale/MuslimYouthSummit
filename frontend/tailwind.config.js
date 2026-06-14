/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: 'var(--brand-primary, #02462E)',
          gold: 'var(--brand-secondary, #FEC700)',
          lightgreen: 'var(--brand-accent, #6BBC01)',
          cream: 'var(--brand-bg, #FBF6E6)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-up': 'slideUp 0.5s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'countdown': 'countdownTick 0.3s ease',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(254,199,0,0.4)' }, '50%': { boxShadow: '0 0 0 12px rgba(254,199,0,0)' } },
        countdownTick: { '0%': { transform: 'scale(1.2)' }, '100%': { transform: 'scale(1)' } },
      },
      backgroundImage: {
        'hero-pattern': "url('/patterns/geometric.svg')",
        'gold-gradient': 'linear-gradient(135deg, #FEC700 0%, #f0b000 100%)',
        'green-gradient': 'linear-gradient(135deg, #02462E 0%, #035c3c 100%)',
      },
    },
  },
  plugins: [],
};
