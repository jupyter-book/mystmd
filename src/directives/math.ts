import { TargetKind } from '../state';
import { Directive } from './types';
import { unusedOptionsWarning } from './utils';

export type Args = {
};

export type Opts = {
  label: string;
};

const math = {
  math: {
    token: 'math',
    numbered: TargetKind.equation,
    skipParsing: true,
    getArguments: () => ({ args: {}, content: '' }),
    getOptions: (data) => {
      const { label, ...rest } = data;
      unusedOptionsWarning('math', rest);
      return { label };
    },
    renderer: (args, opts, target) => {
      const { id, number } = target ?? {};
      return ['div', {
        class: target ? ['math', 'numbered'] : 'math',
        id,
        number,
      }, 0];
    },
  } as Directive<Args, Opts>,
};

export default math;
