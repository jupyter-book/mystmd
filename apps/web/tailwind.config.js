const colors = require('tailwindcss/colors');

module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    // Look to the actual packages too (better than node_modules for pnpm)
    '../../packages/myst-util-to-react/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/site/src/**/*.{js,ts,jsx,tsx}',
    '../../packages/icons/react/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.blue,
        success: colors.green[500],
        'curvenote-blue': '#225f9c',
      },
      // See https://github.com/tailwindlabs/tailwindcss-typography/blob/master/src/styles.js
      typography: (theme) => ({
        DEFAULT: {
          css: {
            code: {
              fontWeight: '400',
            },
            'code::before': {
              content: '',
            },
            'code::after': {
              content: '',
            },
            'blockquote p:first-of-type::before': { content: 'none' },
            'blockquote p:first-of-type::after': { content: 'none' },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            'li > p': {
              marginTop: 0,
              marginBottom: 0,
            },
          },
        },
        invert: {
          css: {
            '--tw-prose-code': theme('colors.pink[500]'),
          },
        },
        stone: {
          css: {
            '--tw-prose-code': theme('colors.pink[600]'),
          },
        },
      }),
      keyframes: {
        load: {
          '0%': { width: '0%' },
          '100%': { width: '50%' },
        },
        fadeIn: {
          '0%': { opacity: 0.0 },
          '25%': { opacity: 0.25 },
          '50%': { opacity: 0.5 },
          '75%': { opacity: 0.75 },
          '100%': { opacity: 1 },
        },
      },
      animation: {
        load: 'load 2.5s ease-out',
        'fadein-fast': 'fadeIn 1s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
