import type { PageFrontmatter } from 'myst-frontmatter';
import type { Handler, ITexSerializer } from './types';

function addMacrosToState(value: string, state: ITexSerializer) {
  if (!state.options.math) return;
  Object.entries(state.options.math).forEach(([k, v]) => {
    if (value.includes(k)) state.mathPlugins[k] = v;
  });
}

export function createMathCommands(plugins: PageFrontmatter['math']): string[] {
  if (!plugins || Object.keys(plugins).length === 0) return [];
  return Object.entries(plugins).map(([k, v]) => {
    const numArgs = v.match(/#([1-9])/g)?.length ?? 0;
    if (numArgs === 0) return `\\newcommand{${k}}{${v}}`;
    return `\\newcommand{${k}}[${numArgs}]{${v}}`;
  });
}

const math: Handler = (node, state) => {
  const { label, enumerated } = node;
  addMacrosToState(node.value, state);
  if (state.data.isInTable) {
    state.write('\\(\\displaystyle ');
    state.write(node.value);
    state.write(' \\)');
  } else {
    // TODO: AMS math
    state.write(`\\begin{equation${enumerated === false ? '*' : ''}}\n`);
    if (label) {
      state.write(`\\label{${label}}`);
    }
    state.ensureNewLine();
    state.write(node.value);
    state.ensureNewLine(true);
    state.write(`\\end{equation${enumerated === false ? '*' : ''}}`);
  }
  if (!state.data.isInTable) state.closeBlock(node);
};

const inlineMath: Handler = (node, state) => {
  addMacrosToState(node.value, state);
  state.write('$');
  state.text(node.value, true);
  state.write('$');
};

const MATH_HANDLERS = { math, inlineMath };

export default MATH_HANDLERS;
