module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      typography: (theme) => ({
        DEFAULT: {
          css: {
            code: {
              color: theme('colors.pink[500]'),
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
