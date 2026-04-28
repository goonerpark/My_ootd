/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'on-secondary-fixed': '#181c20',
        'surface-container-high': '#ebe7e7',
        'primary-fixed-dim': '#c3c7cc',
        'secondary-fixed': '#e0e2e8',
        secondary: '#5b5f63',
        'on-primary-container': '#95999d',
        'error-container': '#ffdad6',
        'surface-tint': '#5b5f63',
        'inverse-surface': '#313030',
        'on-tertiary-fixed-variant': '#4e453d',
        'surface-container-highest': '#e5e2e1',
        'surface-dim': '#dcd9d9',
        'primary-fixed': '#e0e3e8',
        'on-primary-fixed': '#181c20',
        'on-primary': '#ffffff',
        'secondary-container': '#e0e2e8',
        'on-secondary-fixed-variant': '#44474b',
        'tertiary-container': '#372f28',
        'surface-container-lowest': '#ffffff',
        outline: '#75777b',
        'on-secondary': '#ffffff',
        'on-error-container': '#93000a',
        'on-tertiary': '#ffffff',
        'primary-container': '#2d3135',
        'tertiary-fixed-dim': '#d2c4ba',
        'surface-container': '#f0eded',
        'on-primary-fixed-variant': '#43474b',
        'on-tertiary-fixed': '#211a14',
        'surface-container-low': '#f6f3f3',
        tertiary: '#211a14',
        'on-secondary-container': '#616569',
        'on-background': '#1c1b1c',
        'surface-variant': '#e5e2e1',
        error: '#ba1a1a',
        background: '#fcf8f8',
        'on-tertiary-container': '#a2968d',
        'tertiary-fixed': '#eee0d5',
        'inverse-primary': '#c3c7cc',
        'on-surface': '#1c1b1c',
        surface: '#fcf8f8',
        'secondary-fixed-dim': '#c4c6cc',
        primary: '#181c20',
        'on-error': '#ffffff',
        'surface-bright': '#fcf8f8',
        'on-surface-variant': '#44474a',
        'inverse-on-surface': '#f3f0f0',
        'outline-variant': '#c5c6ca'
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem'
      },
      boxShadow: {
        soft: '0 4px 24px rgba(0,0,0,0.04)',
        card: '0 8px 30px rgba(0,0,0,0.08)',
        bento: '0 8px 30px rgba(0,0,0,0.04)'
      },
      fontFamily: {
        sans: ['Manrope', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
        'body-lg': ['Manrope', 'sans-serif'],
        'label-sm': ['Manrope', 'sans-serif'],
        'headline-md': ['Manrope', 'sans-serif'],
        'display-lg': ['Manrope', 'sans-serif'],
        'body-md': ['Manrope', 'sans-serif'],
        'caption-xs': ['Manrope', 'sans-serif'],
        'title-sm': ['Manrope', 'sans-serif']
      },
      fontSize: {
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'label-sm': ['14px', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
        'headline-md': ['28px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-lg': ['40px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-md': ['16px', { lineHeight: '1.6', letterSpacing: '0', fontWeight: '400' }],
        'caption-xs': ['12px', { lineHeight: '1.4', letterSpacing: '0.03em', fontWeight: '500' }],
        'title-sm': ['20px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }]
      },
      spacing: {
        sm: '12px',
        'mobile-nav-height': '72px',
        xl: '64px',
        base: '8px',
        'container-max': '1200px',
        md: '24px',
        lg: '40px',
        xs: '4px',
        'sidebar-width': '280px',
        gutter: '16px'
      }
    }
  },
  plugins: []
};
