import { TargetKind } from '../state'
import { Directive } from './types'
import { unusedOptionsWarning } from './utils'

export type Args = {
  src: string
}

export type Opts = {
  name: string
}

const figure = {
  figure: {
    token: 'figure',
    numbered: TargetKind.figure,
    autoNumber: true,
    getArguments: info => {
      const args = { src: info.trim() }
      return { args, content: '' }
    },
    getOptions: data => {
      const { name, ...rest } = data
      unusedOptionsWarning('figure', rest)
      return { name }
    },
    renderer: (args, opts, target) => {
      const { src } = args
      const { id, number } = target ?? {}
      return [
        'figure',
        { id, class: 'numbered' },
        ['img', { src }],
        ['figcaption', { number }, 0]
      ]
    }
  } as Directive<Args, Opts>
}

export default figure
