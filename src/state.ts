/* eslint-disable no-param-reassign */

import { escapeHtml } from 'markdown-it/lib/common/utils';

export enum TargetKind {
  ref='ref',
  figure='fig',
  equation='eq',
}

export type Target = {
  name: string;
  kind: TargetKind;
  title?: string;
  number?: number;
};

export type StateEnv = {
  targets: Record<string, Target>;
  numbering: {
    eq: number;
  };
};

export function getStateEnv(state: {env: any}): StateEnv {
  const env = state.env as StateEnv;
  if (!env.targets) env.targets = {};
  if (!state.env) state.env = env;
  return env;
}

/** Get the next equation number.
 *
 * Can input `{ numbering: { eq:100 } }` to start counting at a different numebr.
 *
 * @param state MarkdownIt state that will be modified
 */
function nextEquationNumber(state: { env: any }) {
  const env = state.env as StateEnv;
  if (!env.numbering) env.numbering = { eq: 0 };
  if (!state.env) state.env = env;
  env.numbering.eq += 1;
  return env.numbering.eq;
}

/** Create a new internal target.
 *
 * @param state MarkdownIt state that will be modified
 * @param id The reference id that will be used for the target
 */
export function newTarget(state: { env: any }, id: string) {
  const env = getStateEnv(state);
  const target: Target = {
    name: `${TargetKind.ref}-${escapeHtml(id)}`,
    kind: TargetKind.ref,
  };
  env.targets[id] = target;
  return target;
}

/** Create a new referenced equation, which is numbered
 *
 * @param state MarkdownIt state that will be modified
 * @param id The reference id that will be used for the equation
 */
export function newEquation(state: { env: any }, id: string) {
  const env = getStateEnv(state);
  const num = nextEquationNumber(state);
  const target: Target = {
    name: `${TargetKind.equation}-${escapeHtml(id)}`,
    kind: TargetKind.equation,
    number: num,
  };
  env.targets[id] = target;
  return target;
}
