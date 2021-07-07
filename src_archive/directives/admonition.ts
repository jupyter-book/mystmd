import { Directive } from './types'
import { unusedOptionsWarning } from './utils'

const admonitionTitles = {
  attention: 'Attention',
  caution: 'Caution',
  danger: 'Danger',
  error: 'Error',
  important: 'Important',
  hint: 'Hint',
  note: 'Note',
  seealso: 'See Also',
  tip: 'Tip',
  warning: 'Warning'
}
const DEFAULT_ADMONITION_CLASS = 'note'
type AdmonitionTypes = keyof typeof admonitionTitles | 'admonition'

export type Args = {
  title: string
}

export type Opts = {
  class: AdmonitionTypes
}

const createAdmonition = (kind: AdmonitionTypes): Directive<Args, Opts> => {
  const className = kind === 'admonition' ? DEFAULT_ADMONITION_CLASS : kind
  return {
    token: kind,
    getArguments: info => {
      const content = kind === 'admonition' ? '' : info
      const title = kind === 'admonition' ? info : admonitionTitles[kind]
      const args = { title }
      return { args, content }
    },
    getOptions: data => {
      const { class: overrideClass, ...rest } = data
      unusedOptionsWarning(kind, rest)
      return { class: overrideClass as AdmonitionTypes }
    },
    renderer: (args, opts) => {
      const { title } = args
      const { class: overrideClass } = opts
      return [
        'aside',
        { class: ['callout', overrideClass || className] },
        ['header', { children: title }],
        0
      ]
    }
  }
}

const admonitions = {
  admonition: createAdmonition('admonition'),
  callout: createAdmonition('admonition'),
  // All other admonitions
  attention: createAdmonition('attention'),
  caution: createAdmonition('caution'),
  danger: createAdmonition('danger'),
  error: createAdmonition('error'),
  important: createAdmonition('important'),
  hint: createAdmonition('hint'),
  note: createAdmonition('note'),
  seealso: createAdmonition('seealso'),
  tip: createAdmonition('tip'),
  warning: createAdmonition('warning')
}

export default admonitions
