import { normalizeLabel } from 'myst-common';
import { texToTypst } from 'tex-to-typst';
import type { Handler, ITypstSerializer, MathPlugins } from './types.js';

function addMacrosToState(value: string, state: ITypstSerializer) {
  if (!state.options.math) return;
  Object.entries(state.options.math).forEach(([k, v]) => {
    const key = texToTypst(k).value;
    if (value.includes(key)) {
      const typstState = texToTypst(v.macro);
      state.data.mathPlugins[key] = typstState.value;
      typstState.macros?.forEach((macro) => {
        state.useMacro(macro);
      });
    }
  });
}

function findCommandInMacro(macro: string, command: string) {
  const escapedCommand = command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const commandRe = new RegExp(`${escapedCommand}(?![a-zA-Z])`, 'g');
  return [...macro.matchAll(commandRe)].length > 0;
}

function replaceCommandInMacro(macro: string, command: string, replaceValue: string) {
  const escapedCommand = command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const commandRe = new RegExp(`${escapedCommand}(?![a-zA-Z])`, 'g');
  return macro.replaceAll(commandRe, replaceValue);
}

/**
 * MyST typst exports currently require recursive commands to be resolved
 *
 * As opposed to tex where recursive commands can remain and the latex compiler
 * will handle them.
 *
 * All the state.options.math macros are passed to this function and resolved prior to
 * exporting typst.
 */
export function resolveRecursiveCommands(plugins: MathPlugins): MathPlugins {
  let pluginsUpdated = false;
  const newPlugins = Object.fromEntries(
    Object.entries(plugins).map(([command, value]) => {
      let newMacro = value.macro;
      Object.entries(plugins).forEach(([c, { macro: m }]) => {
        if (findCommandInMacro(newMacro, c)) {
          if (command === c) {
            // recursive issue
          } else {
            newMacro = replaceCommandInMacro(newMacro, c, m);
            pluginsUpdated = true;
          }
        }
      });
      return [command, { ...value, macro: newMacro }];
    }),
  );
  if (pluginsUpdated) return resolveRecursiveCommands(newPlugins);
  return newPlugins;
}

const math: Handler = (node, state) => {
  const { value, macros } = texToTypst(node.value);
  macros?.forEach((macro) => {
    state.useMacro(macro);
  });
  const { identifier: label } = normalizeLabel(node.label) ?? {};
  addMacrosToState(value, state);
  state.ensureNewLine();
  // Note: must have spaces $ math $ for the block!
  state.write(`$ ${value} $${label ? ` <${label}>` : ''}\n\n`);
  state.ensureNewLine(true);
};

const inlineMath: Handler = (node, state) => {
  const { value, macros } = texToTypst(node.value);
  macros?.forEach((macro) => {
    state.useMacro(macro);
  });
  addMacrosToState(value, state);
  state.write(`$${value}$`);
};

const MATH_HANDLERS = { math, inlineMath };

export default MATH_HANDLERS;
