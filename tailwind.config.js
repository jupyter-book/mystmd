module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
      },
      animation: {
        load: 'load 2.5s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
