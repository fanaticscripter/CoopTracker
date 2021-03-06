const colors = require('tailwindcss/colors');
const plugin = require('tailwindcss/plugin');

module.exports = {
  purge: ['./index.html', './src/**/*.{vue,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        ultrawide: '1440px',
      },
      colors: {
        gray: {
          ...colors.gray,
          750: '#333338',
        },
        'cool-gray': colors.coolGray,
      },
      transitionDuration: {
        0: '0ms',
      },
      maxWidth: {
        xxs: '16rem',
        ultrawide: '90rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Use !class to apply class as important!
    plugin(({ addVariant }) => {
      addVariant('important', ({ container }) => {
        container.walkRules(rule => {
          rule.selector = `.\\!${rule.selector.slice(1)}`;
          rule.walkDecls(decl => {
            decl.important = true;
          });
        });
      });
    }),
  ],
};
