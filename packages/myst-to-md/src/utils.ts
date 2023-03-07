import type { NestedKinds, NestedLevels, NestedState } from './types';

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
