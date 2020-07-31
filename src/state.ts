/* eslint-disable no-param-reassign */

export type StateEnv = {
  targets: Record<string, {
    name: string;
    internal: boolean;
    title?: string;
  }>;
};

export function getStateEnv(state: {env: any}): StateEnv {
  const env = state.env as StateEnv;
  if (!env.targets) env.targets = {};
  if (!state.env) state.env = env;
  return env;
}
