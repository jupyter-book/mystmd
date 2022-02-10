import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { MyST, tokensToMyst, GenericNode, mystToHast, jsonParser } from '../src'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeFormat from 'rehype-format'
import { unified } from 'unified'
import { Root } from 'mdast'

async function fromMarkdown(content: string) {
  return tokensToMyst(MyST().parse(content, {}))
}

async function toHTML(doc: GenericNode): Promise<string> {
  const f = await unified()
    .use(jsonParser)
    .use(mystToHast)
    .use(remarkRehype)
    .use(rehypeFormat)
    .use(rehypeStringify)
    .process(JSON.stringify(doc))
  const html = f.value as string
  return html.trim()
}

type TestFile = {
  cases: TestCase[]
}
type TestCase = {
  title: string
  mdast: Root
  myst: string
  html: string
}

const directory = 'tests/myst'
const files: string[] = fs
  .readdirSync(directory)
  .filter((name) => name.endsWith('.yml'))

// For prettier printing of test cases
const length = files
  .map((f) => f.replace('.yml', ''))
  .reduce((a, b) => Math.max(a, b.length), 0)

const cases: [string, TestCase][] = files
  .map((file) => {
    const testYaml = fs.readFileSync(path.join(directory, file)).toString()
    const cases = yaml.load(testYaml) as TestFile
    return cases.cases.map((testCase) => {
      const section = `${file.replace('.yml', '')}:`.padEnd(length + 2, ' ')
      const name = `${section} ${testCase.title}`
      return [name, testCase] as [string, TestCase]
    })
  })
  .flat()

describe('Testing myst --> mdast conversions', () => {
  test.each(cases)('%s', async (_, { myst, mdast }) => {
    const mdastString = yaml.dump(mdast)
    const newAst = yaml.dump(await fromMarkdown(myst))
    expect(newAst).toEqual(mdastString)
  })
})

describe('Testing mdast --> html conversions', () => {
  test.each(cases)('%s', async (_, { html, mdast }) => {
    const newHTML = await toHTML(mdast as GenericNode)
    expect(newHTML).toEqual(html)
  })
})
