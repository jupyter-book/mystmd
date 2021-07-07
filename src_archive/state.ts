/* eslint-disable no-param-reassign */

import { escapeHtml } from 'markdown-it/lib/common/utils'

export enum TargetKind {
  ref = 'ref',
  equation = 'eq',
  figure = 'fig',
  table = 'table',
  code = 'code'
}

const RefFormatter: { [kind: string]: (id: string, num?: number) => string } = {
  ref(id) {
    return `[${id}]`
  },
  eq(id, num) {
    return `Eq ${num}`
  },
  fig(id, num) {
    return `Fig ${num}`
  },
  table(id, num) {
    return `Table ${num}`
  },
  code(id, num) {
    return `Code ${num}`
  }
}

export type Target = {
  id: string
  name: string
  kind: TargetKind
  defaultReference: string
  title?: string
  number?: number
}

export type StateEnv = {
  targets: Record<string, Target>
  numbering: {
    eq: number
    fig: number
    table: number
    code: number
  }
}

export function getStateEnv(state: { env: any }): StateEnv {
  const env = (state.env as StateEnv) ?? {}
  if (!env.targets) env.targets = {}
  if (!env.numbering) {
    env.numbering = {
      eq: 0,
      fig: 0,
      table: 0,
      code: 0
    }
  }
  if (!state.env) state.env = env
  return env
}

/** Get the next number for an equation, figure, code or table
 *
 * Can input `{ numbering: { equation: 100 } }` to start counting at a different numebr.
 *
 * @param state MarkdownIt state that will be modified
 */
function nextNumber(state: { env: any }, kind: TargetKind) {
  if (kind === TargetKind.ref) throw new Error('Targets are not numbered?')
  const env = getStateEnv(state)
  env.numbering[kind] += 1
  return env.numbering[kind]
}

/** Create a new internal target.
 *
 * @param state MarkdownIt state that will be modified
 * @param name The reference name that will be used for the target. Note some directives use label.
 * @param kind The target kind: "ref", "equation", "code", "table" or "figure"
 */
export function newTarget(
  state: { env: any },
  name: string | undefined,
  kind: TargetKind
): Target {
  const env = getStateEnv(state)
  const number = kind === TargetKind.ref ? undefined : nextNumber(state, kind)
  // TODO: not sure about this - if name is not provided, then you get `fig-1` etc.
  const useName = name ? escapeHtml(name) : `${kind}-${String(number)}`
  const id = name ? `${kind}-${escapeHtml(useName)}` : useName
  const target: Target = {
    id,
    name: useName,
    defaultReference: RefFormatter[kind](id, number),
    kind,
    number
  }
  env.targets[useName] = target
  return target
}
