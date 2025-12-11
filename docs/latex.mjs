import { DEFAULT_HANDLERS } from 'tex-to-myst';

const latexDirective = {
  name: 'myst:tex-list',
  run() {
    const keys = Object.keys(DEFAULT_HANDLERS);
    const macros = keys
      .filter((k) => k.startsWith('macro_'))
      .map((k) => ({
        type: 'listItem',
        children: [{ type: 'inlineCode', value: `\\${k.replace('macro_', '')}` }],
      }));
    const environments = keys
      .filter((k) => k.startsWith('env_'))
      .map((k) => ({
        type: 'listItem',
        children: [{ type: 'inlineCode', value: `\\begin{${k.replace('env_', '')}}` }],
      }));
    return [
      {
        type: 'details',
        children: [
          { type: 'summary', children: [{ type: 'text', value: 'LaTeX Macros' }] },
          { type: 'list', children: macros },
        ],
      },
      {
        type: 'details',
        children: [
          { type: 'summary', children: [{ type: 'text', value: 'LaTeX Environments' }] },
          { type: 'list', children: environments },
        ],
      },
    ];
  },
};

const plugin = { name: 'LaTeX List', directives: [latexDirective] };

export default plugin;
