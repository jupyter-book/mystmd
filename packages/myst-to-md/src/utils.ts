import type { Handle } from 'mdast-util-to-markdown';
import { fileError } from 'myst-common';
import type { Root } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import type { VFile } from 'vfile';
import type { NestedKinds, NestedLevels, NestedState, Validator } from './types';

type Kind = keyof NestedKinds;

function initializeNestedLevel(state: NestedState) {
  if (!state.nestedLevels) state.nestedLevels = { role: 0, directive: 0 };
  if (!state.nestedMaxLevels) state.nestedMaxLevels = { role: 0, directive: 0 };
  return state as NestedLevels;
}

export function incrementNestedLevel(kind: Kind, state: NestedState, value?: number) {
  const inc = value ?? 1;
  const $state = initializeNestedLevel(state);
  $state.nestedLevels[kind] += inc;
  if ($state.nestedLevels[kind] > $state.nestedMaxLevels[kind]) {
    $state.nestedMaxLevels[kind] = $state.nestedLevels[kind];
  }
}

export function popNestedLevel(kind: Kind, state: NestedState, value?: number) {
  const dec = value ?? 1;
  const $state = initializeNestedLevel(state);
  const nesting = $state.nestedMaxLevels[kind] - $state.nestedLevels[kind];
  $state.nestedLevels[kind] -= dec;
  if ($state.nestedLevels[kind] < 0) $state.nestedLevels[kind] = 0;
  if (!$state.nestedLevels[kind]) $state.nestedMaxLevels[kind] = 0;
  return nesting;
}

function unsupportedHandle(name: string, file: VFile) {
  return (node: any): string => {
    fileError(file, `Unsupported node type: ${name}`, { node, source: 'myst-to-md' });
    return '';
  };
}

export function unsupportedHandlers(tree: Root, supported: string[], file: VFile) {
  const handlers: Record<string, Handle> = {};
  selectAll('*', tree).forEach((node) => {
    const { type } = node;
    if (supported.includes(type)) return;
    handlers[type] = unsupportedHandle(type, file);
  });
  return handlers;
}

export function runValidators(tree: Root, validators: Record<string, Validator>, file: VFile) {
  Object.entries(validators).forEach(([key, validator]) => {
    selectAll(key, tree).forEach((node) => {
      validator(node, file);
    });
  });
}
