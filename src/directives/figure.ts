import { TargetKind } from '../state';
import { Directive } from './types';

export type Args = {
  src: string;
};

export type Opts = {
};

const figure = {
  figure: {
    token: 'figure',
    numbered: TargetKind.figure,
    getArguments: (info) => {
      const args = { src: info.trim() };
      return { args, content: '' };
    },
    getOptions: (data) => data,
    renderer: (args, opts, target) => {
      const { src } = args;
      const { id, number } = target ?? {};
      return [
        'figure', { id, class: 'numbered' },
        ['img', { src }],
        ['figcaption', { number }, 0],
      ];
    },
  } as Directive<Args, Opts>,
};

export default figure;
