/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FFF5F5', 100: '#FFE3E5', 200: '#FFB8BC', 300: '#FF8A91',
          400: '#F75568', 500: '#E63946', 600: '#D42535', 700: '#B01824',
          800: '#8A1219', 900: '#6B0E15',
        },
        accent: {
          50: '#FFFDF5', 100: '#FFFAE6', 200: '#FFF3B8', 300: '#FFE982',
          400: '#FFDE4A', 500: '#FFD700', 600: '#E6B800', 700: '#B38F00',
          800: '#806600', 900: '#4D3D00',
        },
        surface: {
          0: '#000000', 50: '#0A0A0B', 100: '#0F0F11', 200: '#141417',
          300: '#1A1A1F', 400: '#212127', 500: '#2A2A31', 600: '#3A3A45',
          700: '#4A4A57', 800: '#5C5C6E', 900: '#7A7A8C',
        },
        business: {
          50: '#E8EAF6', 100: '#C5CAE9', 200: '#9FA8DA', 300: '#7986CB',
          400: '#5C6BC0', 500: '#3F51B5', 600: '#3949AB', 700: '#303F9F',
          800: '#283593', 900: '#1A237E',
        },
        success: '#00D68F',
        error: '#FF3D71',
        warning: '#FFAA00',
        info: '#0095FF',
        dark: { 900: '#050507' },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
        display: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'xs': ['0.75rem', { lineHeight: '1.125rem' }],
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
        'base': ['0.875rem', { lineHeight: '1.375rem' }],
        'lg': ['1rem', { lineHeight: '1.5rem' }],
        'xl': ['1.125rem', { lineHeight: '1.625rem' }],
        '2xl': ['1.375rem', { lineHeight: '1.875rem' }],
        '3xl': ['1.75rem', { lineHeight: '2.125rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.625rem' }],
        '5xl': ['3rem', { lineHeight: '3.375rem', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '4.125rem', letterSpacing: '-0.03em' }],
        '7xl': ['4.5rem', { lineHeight: '4.875rem', letterSpacing: '-0.04em' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(230, 57, 70, 0.5), 0 0 40px rgba(230, 57, 70, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(230, 57, 70, 0.8), 0 0 80px rgba(230, 57, 70, 0.5)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(255, 215, 0, 0.15)',
        'glow-md': '0 0 40px rgba(255, 215, 0, 0.25)',
        'glow-lg': '0 0 60px rgba(255, 215, 0, 0.35)',
        'glow-xl': '0 0 100px rgba(255, 215, 0, 0.5)',
        'brand': '0 8px 32px rgba(230, 57, 70, 0.3)',
        'brand-lg': '0 16px 48px rgba(230, 57, 70, 0.4)',
        'brand-xl': '0 24px 64px rgba(230, 57, 70, 0.5)',
        'business': '0 8px 32px rgba(26, 35, 126, 0.4)',
        'business-lg': '0 16px 48px rgba(26, 35, 126, 0.5)',
        'inset-border': 'inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'elevation-1': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)',
        'elevation-2': '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
        'elevation-3': '0 12px 32px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3)',
        'elevation-4': '0 24px 64px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '48px',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')({ strategy: 'class' })],
};
