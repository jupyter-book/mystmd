import { texToTypst } from 'tex-to-typst';
import type { Handler, ITypstSerializer } from './types.js';

function addMacrosToState(value: string, state: ITypstSerializer) {
  if (!state.options.math) return;
  Object.entries(state.options.math).forEach(([k, v]) => {
    const key = texToTypst(k);
    if (value.includes(key)) state.data.mathPlugins[key] = texToTypst(v);
  });
}

type MathPlugins = ITypstSerializer['data']['mathPlugins'];

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
  state: ITypstSerializer,
  plugins = state.data.mathPlugins,
): MathPlugins {
  if (!state.options.math) return plugins;
  const pluginsList = Object.entries(plugins);
  const addedPlugins: MathPlugins = {};
  Object.entries(state.options.math).forEach(([k, v]) => {
    const key = texToTypst(k);
    if (plugins[key]) return;
    pluginsList.forEach(([, value]) => {
      if (value.includes(key)) addedPlugins[key] = texToTypst(v);
    });
  });
  const newPlugins = { ...addedPlugins, ...plugins };
  if (Object.keys(addedPlugins).length === 0) return newPlugins;
  return withRecursiveCommands(state, newPlugins);
}

const math: Handler = (node, state) => {
  const value = texToTypst(node.value);
  addMacrosToState(value, state);
  state.ensureNewLine();
  // Note: must have spaces $ math $ for the block!
  state.write(`$ ${value} $${node.label ? ` <${node.label}>` : ''}\n\n`);
  state.ensureNewLine(true);
};

const inlineMath: Handler = (node, state) => {
  const value = texToTypst(node.value);
  addMacrosToState(value, state);
  state.write(`$${value}$`);
};

const MATH_HANDLERS = { math, inlineMath };

export default MATH_HANDLERS;
