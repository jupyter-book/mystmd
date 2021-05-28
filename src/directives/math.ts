import { TargetKind } from '../state'
import { Directive } from './types'
import { unusedOptionsWarning } from './utils'

export type Args = { [key: string]: any }

export type Opts = {
  name: string // Note you can also use `label` here.
}

const math = {
  math: {
    token: 'math',
    numbered: TargetKind.equation,
    skipParsing: true,
    getArguments: () => ({ args: {}, content: '' }),
    getOptions: data => {
      // See https://github.com/sphinx-doc/sphinx/issues/8476
      const { name, label, ...rest } = data
      unusedOptionsWarning('math', rest)
      return { name: name || label }
    },
    renderer: (args, opts, target) => {
      const { id, number } = target ?? {}
      return [
        'div',
        {
          class: target ? ['math', 'numbered'] : 'math',
          id,
          number
        },
        0
      ]
    }
  } as Directive<Args, Opts>
}

export default math
