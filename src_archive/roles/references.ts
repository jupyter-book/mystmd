/* eslint-disable no-param-reassign */
import Token from 'markdown-it/lib/token'
import MarkdownIt from 'markdown-it'
import { StateEnv, TargetKind } from '../state'
import { toHTML } from '../utils'
import { Role } from './types'

const REF_PATTERN = /^(.+?)<([^<>]+)>$/ // e.g. 'Labeled Reference <ref>'

const renderReferenceError = (ref: string) => {
  const [html] = toHTML(
    [
      'span',
      {
        class: 'error',
        title: `The reference '${ref}' was not found.`,
        children: `Reference '${ref}' not found.`
      }
    ],
    { inline: true }
  )
  return html
}

/**
 * Renders a reference as an anchor link.
 */
const renderReference =
  (opts: { numbered: boolean; brackets: boolean; kind?: TargetKind }) =>
  (tokens: Token[], idx: number, options: MarkdownIt.Options, env: StateEnv) => {
    const token = tokens[idx]
    const ref = token.attrGet('ref') ?? ''
    const target = env.targets[ref]
    if (!target || (opts.kind && target?.kind !== opts.kind))
      return renderReferenceError(ref)
    const { id, title, defaultReference, number } = target
    let text = token.content || title || defaultReference
    if (opts.numbered) {
      // See https://www.sphinx-doc.org/en/master/usage/restructuredtext/roles.html#role-numref
      text = text.replace(/%s/g, String(number)).replace(/\{number\}/g, String(number))
    }
    if (opts.brackets) {
      text = `${token.content}(${number})`
    }
    const [html] = toHTML(
      [
        'a',
        {
          href: `#${id}`,
          title: title || defaultReference,
          children: text
        }
      ],
      { inline: true }
    )
    return html
  }

const getReferenceAttrs = (content: string) => {
  const match = REF_PATTERN.exec(content)
  if (match == null) return { attrs: { ref: content }, content: '' }
  const [, modified, ref] = match
  return { attrs: { ref: ref.trim() }, content: modified.trim() }
}

const roles = {
  ref: {
    token: 'ref',
    getAttrs: getReferenceAttrs,
    renderer: renderReference({ numbered: false, brackets: false })
  } as Role,
  numref: {
    token: 'numref',
    getAttrs: getReferenceAttrs,
    renderer: renderReference({ numbered: true, brackets: false })
  } as Role,
  eq: {
    token: 'eq',
    getAttrs: getReferenceAttrs,
    renderer: renderReference({
      numbered: true,
      brackets: true,
      kind: TargetKind.equation
    })
  } as Role
}

export default roles
