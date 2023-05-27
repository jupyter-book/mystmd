import type { Handler, ITexSerializer } from './types';

function addMacrosToState(value: string, state: ITexSerializer) {
  if (!state.options.math) return;
  Object.entries(state.options.math).forEach(([k, v]) => {
    if (value.includes(k)) state.data.mathPlugins[k] = v;
  });
}

type MathPlugins = ITexSerializer['data']['mathPlugins'];

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
): MathPlugins {
  if (!state.options.math) return plugins;
  const pluginsList = Object.entries(plugins);
  const addedPlugins: MathPlugins = {};
  Object.entries(state.options.math).forEach(([k, v]) => {
    if (plugins[k]) return;
    pluginsList.forEach(([, value]) => {
      if (value.includes(k)) addedPlugins[k] = v;
    });
  });
  const newPlugins = { ...addedPlugins, ...plugins };
  if (Object.keys(addedPlugins).length === 0) return newPlugins;
  return withRecursiveCommands(state, newPlugins);
}

const math: Handler = (node, state) => {
  const { label, enumerated } = node;
  state.usePackages('amsmath');
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
  state.usePackages('amsmath');
  addMacrosToState(node.value, state);
  state.write('$');
  state.text(node.value, true);
  state.write('$');
};

const MATH_HANDLERS = { math, inlineMath };

export default MATH_HANDLERS;
