import { escapeHtml } from 'markdown-it/lib/common/utils'

const HTML_EMPTY_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
])

type AttrTypes = string | string[] | number | boolean | undefined | null

type HTMLAttributes = {
  // String Arrays are joined by ' ' for attributes (like class names)
  [attr: string]: AttrTypes
}

// Same typing as prosemirror-model
export interface IHTMLOutputSpecArray {
  0: string
  1?: HTMLOutputSpec | 0 | HTMLAttributes
  2?: HTMLOutputSpec | 0
  3?: HTMLOutputSpec | 0
  4?: HTMLOutputSpec | 0
  5?: HTMLOutputSpec | 0
  6?: HTMLOutputSpec | 0
  7?: HTMLOutputSpec | 0
  8?: HTMLOutputSpec | 0
  9?: HTMLOutputSpec | 0
}
type HTMLOutputSpecArrayInternal = [
  string,
  HTMLOutputSpec | 0 | HTMLAttributes,
  HTMLOutputSpec | 0
]
export type HTMLOutputSpec = IHTMLOutputSpecArray

const formatAttr = (key: string, value: AttrTypes): string | null => {
  let v: string
  if (value == null) return null
  if (Array.isArray(value)) {
    v = value.join(' ')
  } else if (typeof value === 'number') {
    v = String(value)
  } else if (typeof value === 'boolean') {
    if (!value) return null
    v = ''
  } else {
    v = value
  }
  return `${key}="${escapeHtml(v)}"`
}

export function formatTag(
  tag: string,
  attributes: HTMLAttributes,
  inline: boolean
): string {
  const { children, ...rest } = attributes
  const join = inline ? '' : '\n'
  const attrs = Object.entries(rest)
    .filter(([, value]) => value != null && value !== false)
    .map(([key, value]) => formatAttr(key, value))
    .filter(value => value != null)
    .join(' ')
  const html = `<${escapeHtml(tag)}${attrs ? ` ${attrs}` : ''}>`
  if (children) return `${html}${join}${escapeHtml(String(children))}`
  return html
}

function toHTMLRecurse(
  template: HTMLOutputSpec,
  inline: boolean
): [string, string | null] {
  // Convert to an internal type which is actually an array
  const T = template as HTMLOutputSpecArrayInternal
  // Cannot have more than one hole in the template
  const atMostOneHole = T.flat(Infinity).filter(v => v === 0).length <= 1
  if (!atMostOneHole)
    throw new Error('There cannot be more than one hole in the template.')
  // Grab the tag and attributes if they exist!
  const tag = T[0]
  const hasAttrs = !Array.isArray(T?.[1]) && typeof T?.[1] === 'object'
  const attrs = hasAttrs ? (T[1] as HTMLAttributes) : {}
  // These are the tag arrays before and after the hole.
  const before: string[] = []
  const after: string[] = []
  before.push(formatTag(tag, attrs, inline))
  let foundHole = false
  T.slice(hasAttrs ? 2 : 1).forEach(value => {
    const v = value as HTMLOutputSpec | 0
    if (v === 0) {
      foundHole = true
      return
    }
    // Recurse, if a hole is found then split the return
    const [b, a] = toHTMLRecurse(v, inline)
    before.push(b)
    if (a) {
      foundHole = true
      after.push(a)
    }
  })
  const join = inline ? '' : '\n'
  const closingTag = HTML_EMPTY_ELEMENTS.has(tag) ? '' : `</${tag}>`
  if (!foundHole) {
    if (closingTag) before.push(closingTag)
    return [before.join(join), null]
  }
  if (closingTag) after.push(closingTag)
  return [before.join(join), after.join(join)]
}

/**
 * A helper function to create valid HTML with a "hole" (represented by zero) for content.
 *
 * The content is escaped and null/undefined attributes are not included.
 *
 * **A simple wrapper tag:**
 * ```
 * const attr = 'hello';
 * const html = toHTML(['tag', {attr}, 0]);
 * console.log(html);
 * > ['<tag attr="hello">', '</tag>']
 * ```
 *
 * **A nested wrapper tag:**
 * ```
 * const html = toHTML([
 *  'tag', {attr},
 *  ['img', {src}],
 *  ['caption', 0],
 * ]);
 * console.log(html);
 * > ['<tag attr="x"><img src="src"><caption>', '</caption></tag>']
 * ```
 *
 * You can include `children` in the `attrs` and that adds inline content for a tag.
 *
 * You can also send in a list of strings for `attrs`, which are joined with a space (`' '`).
 *
 * Types are based on prosemirror-model.
 *
 * @param spec The spec for the dom model.
 * @param opts Options dict, `inline` creates HTML that is on a single line.
 */
export function toHTML(
  template: HTMLOutputSpec,
  opts = { inline: false }
): [string, string | null] {
  const [before, after] = toHTMLRecurse(template, opts.inline)
  const join = opts.inline ? '' : '\n'
  return [`${before}${join}`, after ? `${after}${join}` : null]
}
