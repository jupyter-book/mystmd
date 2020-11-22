import { Target, TargetKind } from '../state';
import { Directive } from './types';

const figure = {
  figure: {
    token: 'figure',
    numbered: TargetKind.figure,
    getArguments: (info) => {
      const args = { src: info.trim() };
      return { args, content: '' };
    },
    getOptions: (data) => data,
    renderer: (tokens, idx) => {
      const token = tokens[idx];
      const src = token.attrGet('src') ?? '';
      const { id, number } = token.meta?.target as Target ?? {};
      return [
        'figure', { id, class: 'numbered' },
        ['img', { src }],
        ['figcaption', { number }, 0],
      ];
    },
  } as Directive,
};

export default figure;
