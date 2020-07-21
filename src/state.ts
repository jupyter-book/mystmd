/* eslint-disable no-param-reassign */
import StateBlock from 'markdown-it/lib/rules_block/state_block';

export type StateEnv = {
  targets: Record<string, {
    name: string;
    internal: boolean;
    title?: string;
  }>;
};

export function getStateEnv(state: StateBlock): StateEnv {
  const env = state.env as StateEnv;
  if (!env.targets) env.targets = {};
  if (!state.env) state.env = env;
  return env;
}
