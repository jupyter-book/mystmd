import MarkdownIt from 'markdown-it'
import pluginDirectiveBase from '../src/directives/base'

const basicDirective = '```{name} arg string\ncontent\n```'

describe('base directive plugin', () => {
  const mdit = MarkdownIt().use(pluginDirectiveBase)
  describe('creates a token when', () => {
    it('parses a matched fence', () => {
      const tokens = mdit.parse(basicDirective, {})
      expect(tokens.map(t => JSON.parse(JSON.stringify(t)))).toEqual([
        {
          type: 'directive_base',
          tag: 'code',
          attrs: null,
          map: [0, 3],
          nesting: 0,
          level: 0,
          children: null,
          content: 'content\n',
          markup: '```',
          info: 'name',
          meta: { arg: 'arg string' },
          block: true,
          hidden: false
        }
      ])
    })
  })
})
