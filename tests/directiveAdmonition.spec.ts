import MarkdownIt from 'markdown-it'
import pluginDirectiveBase from '../src/directives/base'
import pluginDirectiveAdmonition from '../src/directives/admonition'

const basicDirective = '```{admonition} arg string\ncontent\n```'
const noteDirective = '```{note}\ncontent\n```'
const classOptionDirective =
  '```{admonition} arg string\n:class: class1 class2\ncontent\n```'
const nestedDirective =
  '````{admonition} arg string\ncontent\n```{admonition} arg string2\ncontent2\n```\n````'

describe('base directive plugin', () => {
  const mdit = MarkdownIt().use(pluginDirectiveBase).use(pluginDirectiveAdmonition)
  describe('creates admonition token when', () => {
    it('parses a matched admonition fence', () => {
      const tokens = mdit.parse(basicDirective, {})
      // console.log(tokens.map(token => JSON.stringify(token)))
      expect(tokens.map(token => JSON.stringify(token))).toEqual([
        '{"type":"open_admonition","tag":"aside","attrs":[["class","admonition' +
          '"]],"map":[0,3],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"open_admonition_title","tag":"div","attrs":[["class","admonition-title"]],"map":null,"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"inline","tag":"","attrs":null,"map":[0,0],"nesting":0,"level":0,"children":[{"type":"text","tag":"","attrs":null,"map":null,"nesting":0,"level":0,"children":null,"content":"arg string","markup":"","info":"","meta":null,"block":false,"hidden":false}],"content":"arg string","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"close_admonition_title","tag":"div","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"open_admonition_body","tag":"div","attrs":[["class","admonition-body"]],"map":[1,2],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"paragraph_open","tag":"p","attrs":null,"map":[1,2],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"inline","tag":"","attrs":null,"map":[1,2],"nesting":0,"level":1,"children":[{"type":"text","tag":"","attrs":null,"map":null,"nesting":0,"level":0,"children":null,"content":"content","markup":"","info":"","meta":null,"block":false,"hidden":false}],"content":"content","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"paragraph_close","tag":"p","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"close_admonition_body","tag":"div","attrs":null,"map":null,"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"close_admonition","tag":"aside","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}'
      ])
      // const html = mdit.render(basicDirective)
      // console.log(html)
    })
    it('parses a matched fence that includes a nested admonition', () => {
      const tokens = mdit.parse(nestedDirective, {})
      // console.log(tokens.map(token => JSON.stringify(token)))
      expect(tokens.map(token => JSON.stringify(token))).toEqual([
        '{"type":"open_admonition","tag":"aside","attrs":[["class","admonition' +
          '"]],"map":[0,6],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"open_admonition_title","tag":"div","attrs":[["class","admonition-title"]],"map":null,"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"inline","tag":"","attrs":null,"map":[0,0],"nesting":0,"level":0,"children":[{"type":"text","tag":"","attrs":null,"map":null,"nesting":0,"level":0,"children":null,"content":"arg string","markup":"","info":"","meta":null,"block":false,"hidden":false}],"content":"arg string","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"close_admonition_title","tag":"div","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"open_admonition_body","tag":"div","attrs":[["class","admonition-body"]],"map":[1,5],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"paragraph_open","tag":"p","attrs":null,"map":[1,2],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"inline","tag":"","attrs":null,"map":[1,2],"nesting":0,"level":1,"children":[{"type":"text","tag":"","attrs":null,"map":null,"nesting":0,"level":0,"children":null,"content":"content","markup":"","info":"","meta":null,"block":false,"hidden":false}],"content":"content","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"paragraph_close","tag":"p","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"open_admonition","tag":"aside","attrs":[["class","admonition' +
          '"]],"map":[2,5],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"open_admonition_title","tag":"div","attrs":[["class","admonition-title"]],"map":null,"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"inline","tag":"","attrs":null,"map":[2,2],"nesting":0,"level":0,"children":[{"type":"text","tag":"","attrs":null,"map":null,"nesting":0,"level":0,"children":null,"content":"arg string2","markup":"","info":"","meta":null,"block":false,"hidden":false}],"content":"arg string2","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"close_admonition_title","tag":"div","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"open_admonition_body","tag":"div","attrs":[["class","admonition-body"]],"map":[3,4],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"paragraph_open","tag":"p","attrs":null,"map":[3,4],"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"inline","tag":"","attrs":null,"map":[3,4],"nesting":0,"level":1,"children":[{"type":"text","tag":"","attrs":null,"map":null,"nesting":0,"level":0,"children":null,"content":"content2","markup":"","info":"","meta":null,"block":false,"hidden":false}],"content":"content2","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"paragraph_close","tag":"p","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":true,"hidden":false}',
        '{"type":"close_admonition_body","tag":"div","attrs":null,"map":null,"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"close_admonition","tag":"aside","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"close_admonition_body","tag":"div","attrs":null,"map":null,"nesting":1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}',
        '{"type":"close_admonition","tag":"aside","attrs":null,"map":null,"nesting":-1,"level":0,"children":null,"content":"","markup":"","info":"","meta":null,"block":false,"hidden":false}'
      ])
      // const html = mdit.render(nestedDirective)
      // console.log(html)
    })
    it('parses a matched admonition fence with class option', () => {
      const html = mdit.render(classOptionDirective)
      expect(html).toEqual(
        '<aside class="admonition class1 class2"><div class="admonition-title">arg string</div><div class="admonition-body"><div></aside>'
      )
    })
    it('parses a matched note admonition fence', () => {
      const html = mdit.render(noteDirective)
      expect(html).toEqual(
        '<aside class="admonition note"><div class="admonition-title">Note</div><div class="admonition-body"><p>content</p>\n<div></aside>'
      )
    })
  })
})
