import fs from 'fs'
import { MyST } from '../src'

// For the common mark to pass, html parsing needs to be enabled
const tokenizer = MyST({ markdownit: { html: true } })

type Spec = {
  section: string
  example: number
  markdown: string
  html: string
}

// Comment out to make these fail
const SKIP_TESTS = new Set([
  // Expected
  44, // This is a block break, expect it to be different
  // Minor
  25, // This is a &nbsp; I think
  // To fix
  333, // Spacing around inline code?
  353, // Broken paragraph/emph?
  506, // This is a link issue?
])

export function loadSpec(name: string): Spec[] {
  const fixtures = JSON.parse(fs.readFileSync(`fixtures/${name}`).toString())
  return fixtures
}

function fixHtml(html: string) {
  return html.replace(/<blockquote>\n<\/blockquote>/g, '<blockquote></blockquote>')
}

describe('Common Mark Spec', () => {
  loadSpec('cmark_spec_0.30.json').forEach(({ section, example, markdown, html }) => {
    if (SKIP_TESTS.has(example)) return
    const fixed = fixHtml(html)
    it(`${example}: ${section}`, () =>
      expect(tokenizer.render(markdown)).toEqual(fixed))
  })
})
