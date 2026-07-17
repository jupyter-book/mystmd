import type { Handler, ITexSerializer, SimplifiedMathPlugins } from './types.js';
import { addIndexEntries } from './utils.js';

// Top level environments in amsmath version 2.1 (and eqnarray), see:
// http://anorien.csc.warwick.ac.uk/mirrors/CTAN/macros/latex/required/amsmath/amsldoc.pdf
const TOP_LEVEL_ENVIRONMENTS = [
  'equation',
  'multline',
  'gather',
  'align',
  'alignat',
  'flalign',
  'eqnarray',
];
// The other environments can be inside of an equation
// const MATRIX_ENVIRONMENTS = ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'];

const RE_OPEN = new RegExp(`^\\\\begin{(${TOP_LEVEL_ENVIRONMENTS.join('|')})([*]?)}`);

function isTopLevelAmsmathEnvironment(value: string): boolean {
  // First test if there are multiple environments in this equation
  const matchOpen = value.trim().match(RE_OPEN);
  if (!matchOpen) return false;
  const [, environment, star] = matchOpen;
  const end = `\\end{${environment}${star}}`;
  const matchClose = value.trim().endsWith(end);
  if (!matchClose) return false;
  return true;
}

function addMacrosToState(value: string, state: ITexSerializer) {
  if (!state.options.math) return;
  Object.entries(state.options.math).forEach(([k, v]) => {
    if (value.includes(k)) state.data.mathPlugins[k] = v.macro;
  });
}

/**
 * Add any required recursive commands found, for example,
 * if only `\aMat` was included in the content, but sill requires other commands:
 *
 * ```javascript
 * {
 *    '\aNrm': "a",
 *    '\aMat': '[\mathrm{\aNrm}]',
 * }
 * ```
 */
export function withRecursiveCommands(
  state: ITexSerializer,
  plugins = state.data.mathPlugins,
): SimplifiedMathPlugins {
  if (!state.options.math) return plugins;
  const pluginsList = Object.entries(plugins);
  const addedPlugins: SimplifiedMathPlugins = {};
  Object.entries(state.options.math).forEach(([k, v]) => {
    if (plugins[k]) return;
    pluginsList.forEach(([, value]) => {
      if (value.includes(k)) addedPlugins[k] = v.macro;
    });
  });
  const newPlugins = { ...addedPlugins, ...plugins };
  if (Object.keys(addedPlugins).length === 0) return newPlugins;
  return withRecursiveCommands(state, newPlugins);
}

const math: Handler = (node, state) => {
  const { label, enumerated } = node;
  const tightBefore = node.tight === true || node.tight === 'before';
  const tightAfter = node.tight === true || node.tight === 'after';
  if (tightBefore) {
    // Removes the preceding space
    state.ensureNewLine(true);
  }
  state.usePackages('amsmath');
  addMacrosToState(node.value, state);
  addIndexEntries(node, state);
  if (state.data.isInTable) {
    state.write('\\(\\displaystyle ');
    state.write(node.value);
    state.write(' \\)');
  } else {
    // Check if the node is an AMSMath environment, if so, render it directly
    const isAmsMath = isTopLevelAmsmathEnvironment(node.value);
    if (isAmsMath) {
      // TODO: labels may be stripped previously in the transform, we may need to back that out
      state.ensureNewLine();
      state.write(node.value);
      state.ensureNewLine(true);
    } else {
      // Otherwise enclose the math environment by equation + label
      state.write(`\\begin{equation${enumerated === false ? '*' : ''}}\n`);
      if (label) {
        state.write(`\\label{${label}}`);
      }
      state.ensureNewLine();
      state.write(node.value);
      state.ensureNewLine(true);
      state.write(`\\end{equation${enumerated === false ? '*' : ''}}`);
    }
  }
  if (state.data.isInTable) return;
  if (tightAfter) {
    state.ensureNewLine(true);
  } else {
    state.closeBlock(node);
  }
};

const inlineMath: Handler = (node, state) => {
  state.usePackages('amsmath');
  addMacrosToState(node.value, state);
  state.write('$');
  state.text(node.value, true);
  state.write('$');
};

const MATH_HANDLERS = { math, inlineMath };

export default MATH_HANDLERS;
