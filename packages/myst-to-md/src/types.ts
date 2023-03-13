import type { Handle, State } from 'mdast-util-to-markdown';

export type NestedKinds = {
  role: number;
  directive: number;
};

export type NestedLevels = {
  nestedLevels: NestedKinds;
  nestedMaxLevels: NestedKinds;
};

export type NestedState = State & Partial<NestedLevels>;

export type Parent = Parameters<Handle>[1];
