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
        'on-secondary-fixed-variant': '#41484a',
        'secondary-fixed-dim': '#c0c8cb',
        'on-secondary-container': '#5c6466',
        tertiary: '#65494c',
        'surface-container-high': '#e9e8e5',
        'surface-container-highest': '#e4e2e0',
        'on-error': '#ffffff',
        'on-tertiary-fixed-variant': '#5a4043',
        'on-surface': '#1b1c1a',
        'on-tertiary-fixed': '#2b1618',
        'surface-tint': '#506354',
        'secondary-fixed': '#dde4e7',
        'inverse-on-surface': '#f2f0ee',
        'surface-container': '#efeeeb',
        'primary-container': '#5a6d5e',
        'on-primary-container': '#d9eedb',
        'on-error-container': '#93000a',
        'primary-fixed': '#d3e8d5',
        'on-secondary': '#ffffff',
        outline: '#737873',
        'on-primary-fixed-variant': '#394b3d',
        'primary-fixed-dim': '#b7ccba',
        'on-tertiary-container': '#ffe2e4',
        'on-background': '#1b1c1a',
        'tertiary-fixed-dim': '#e3bdc1',
        'on-surface-variant': '#434843',
        'on-primary': '#ffffff',
        surface: '#fbf9f6',
        'surface-dim': '#dbdad7',
        'outline-variant': '#c3c8c1',
        secondary: '#586062',
        'tertiary-container': '#7f6164',
        error: '#ba1a1a',
        'surface-container-lowest': '#ffffff',
        'secondary-container': '#dae1e4',
        background: '#fbf9f6',
        'inverse-surface': '#30312f',
        'on-primary-fixed': '#0e1f14',
        'on-tertiary': '#ffffff',
        'inverse-primary': '#b7ccba',
        'surface-container-low': '#f5f3f1',
        'on-secondary-fixed': '#161d1f',
        'surface-variant': '#e4e2e0',
        primary: '#425547',
        'surface-bright': '#fbf9f6',
        'error-container': '#ffdad6',
        'tertiary-fixed': '#ffd9dc'
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
        sans: ['Plus Jakarta Sans', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
        headline: ['Be Vietnam Pro', 'Pretendard', 'Noto Sans KR', 'sans-serif'],
        'body-lg': ['Plus Jakarta Sans', 'sans-serif'],
        'label-sm': ['Plus Jakarta Sans', 'sans-serif'],
        'headline-md': ['Be Vietnam Pro', 'sans-serif'],
        'display-lg': ['Be Vietnam Pro', 'sans-serif'],
        'body-md': ['Plus Jakarta Sans', 'sans-serif'],
        'caption-xs': ['Plus Jakarta Sans', 'sans-serif'],
        'title-sm': ['Be Vietnam Pro', 'sans-serif']
      },
      fontSize: {
        'headline-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'label-sm': ['13px', { lineHeight: '1', letterSpacing: '0.02em', fontWeight: '500' }],
        'caption-xs': ['12px', { lineHeight: '1.4', letterSpacing: '0.03em', fontWeight: '500' }],
        'title-sm': ['20px', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-lg': ['40px', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }]
      },
      spacing: {
        sm: '8px',
        xl: '40px',
        md: '16px',
        xs: '4px',
        'container-margin': '20px',
        lg: '24px',
        unit: '4px',
        gutter: '12px',
        'mobile-nav-height': '72px',
        'sidebar-width': '280px'
      }
    }
  },
  plugins: []
};