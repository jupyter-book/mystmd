import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { MyST, tokensToMyst, GenericNode, mystToHast, jsonParser } from '../../src'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
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
    .use(rehypeStringify)
    .process(JSON.stringify(doc))
  return f.value as string
}

type TestCase = {
  title: string
  mdast: Root
  myst: string
  html: string
}

export async function conversionTests(directory: string) {
  const dirSplit = directory.split(path.sep)
  describe(dirSplit[dirSplit.length - 1], () => {
    const files = fs.readdirSync(directory)
    files.map(async (file) => {
      if (!file.endsWith('.yml')) return
      const testYaml = fs.readFileSync(path.join(directory, file)).toString()
      const testCase = yaml.load(testYaml) as TestCase
      const { title, myst, html } = testCase
      const mdast = yaml.dump(testCase.mdast)
      it(`${title}: mdast --> html `, async () => {
        const newAst = yaml.dump(await fromMarkdown(myst))
        expect(newAst).toEqual(mdast)
      })
      it(`${title}: myst  --> mdast`, async () => {
        const newHTML = await toHTML(yaml.load(mdast) as GenericNode)
        expect(newHTML).toEqual(html)
      })
    })
  })
}
