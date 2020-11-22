import { Target, TargetKind } from '../state';
import { toHTML } from '../utils';
import { DirectiveConstructor } from './types';

const figure = {
  figure: {
    token: 'figure',
    numbered: TargetKind.figure,
    getArguments: (info) => {
      const attrs = { src: info.trim() };
      return { attrs, content: '' };
    },
    getOptions: (data) => data,
    renderer: (tokens, idx) => {
      const token = tokens[idx];
      const src = token.attrGet('src') ?? '';
      const { id, number } = token.meta?.target as Target ?? {};
      return toHTML([
        'figure', { id, class: 'numbered' },
        ['img', { src }],
        ['figcaption', { number }, 0],
      ]);
    },
  } as DirectiveConstructor,
};

export default figure;
