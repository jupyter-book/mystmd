import fs from 'fs'
import path from 'path'
import yaml from 'js-yaml'
import { MyST } from '../src'
import { tokensToMdast } from '../src/mdast'
import { GenericNode } from '../src/mdast/types'
import remarkRehype from 'remark-rehype'
import remarkParse from 'remark-parse'
import rehypeStringify from 'rehype-stringify'
import { toHast } from 'mdast-util-to-hast'
import { toHtml } from 'hast-util-to-html'
import { Plugin, unified } from 'unified'
import { visit } from 'unist-util-visit'
import { Root } from 'mdast'
import { map } from 'unist-util-map'

function toYAML(doc: GenericNode): string {
  return yaml.dump(doc)
}

function fromYAML(content: string): GenericNode {
  return yaml.load(content) as GenericNode
}

function fromMarkdown(content: string) {
  return tokensToMdast(MyST().parse(content, {}))
}

type Transformer = {
  tag: string
  getProps: (node: any) => Record<string, string>
}

const mystToHastTransformers: Record<string, Transformer> = {
  abbr: {
    tag: 'abbr',
    getProps(node: any) {
      return { title: node.title }
    },
  },
}

const mystToHast = () => (tree: Root) => {
  map(tree, (node: any) => {
    const transformer = mystToHastTransformers[node.type]
    if (!transformer) return node
    const data = node.data || (node.data = {})
    data.hName = transformer.tag
    data.hProperties = { ...data.hProperties, ...transformer.getProps(node) }
    return node
  })
}

type Options = {}

const jsonParser: Plugin<[Options?] | void[], string, Root> = function jsonParser() {
  this.Parser = (json: string) => JSON.parse(json)
}

const mystParser: Plugin<[Options?] | void[], string, Root> = function mystParser() {
  this.Parser = (content: string) => {
    return tokensToMdast(MyST().parse(content, {}))
  }
}

async function toHTML(doc: GenericNode): Promise<string> {
  const f = await unified()
    .use(jsonParser)
    .use(mystToHast)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(JSON.stringify(doc))
  // mystToHast()(doc as any)
  // const hast = toHast(doc as any)
  // const html = toHtml(hast as any)
  return f.value as string
}

export enum ConversionDirections {
  roundtrip = 'roundtrip',
  import = 'import',
  export = 'export',
}

export enum ConversionFormats {
  myst = 'myst',
  html = 'html',
  text = 'text',
  tex = 'tex',
}

export type Conversion = {
  content: string
  direction: ConversionDirections
  format: ConversionFormats
}

export type ConversionStructure = {
  description: string
  mdast: string
  conversions: Conversion[]
}

async function mystToMdast(myst: string, mdast: string) {
  const newAst = toYAML(fromMarkdown(myst))
  expect(newAst).toEqual(mdast)
}

async function mdastToHTML(mdast: string, html: string) {
  const newHTML = await toHTML(fromYAML(mdast))
  expect(newHTML).toEqual(html)
}

type TestCase = {
  title: string
  mdast: Root
  myst: string
  html: string
}

export function conversionTests(directory: string) {
  const dirSplit = directory.split(path.sep)
  describe(dirSplit[dirSplit.length - 1], () => {
    const files = fs.readdirSync(directory)
    files.forEach((file) => {
      if (!file.endsWith('.yml')) return
      const testYaml = fs.readFileSync(path.join(directory, file)).toString()
      const testCase = yaml.load(testYaml) as TestCase
      const { title, myst, html } = testCase
      const mdast = toYAML(testCase.mdast)
      it(`${title}: mdast --> html`, async () => mdastToHTML(mdast, html))
      it(`${title}: myst  --> mdast`, async () => mystToMdast(myst, mdast))
    })
  })
}
