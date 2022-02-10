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
  mystToHast()(doc as any)
  const hast = toHast(doc as any)
  const html = toHtml(hast as any)
  return html as string
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

export function loadExample(filename: string): ConversionStructure {
  const data = fs.readFileSync(filename, 'utf8')
  const lines = data.split('\n')
  let description = ''
  let delimiter = ''
  let mdast = ''
  const conversions: Conversion[] = []
  let content = ''
  let format: ConversionFormats = ConversionFormats.myst
  let direction: ConversionDirections = ConversionDirections.roundtrip
  let newDelimiter
  let newFormat
  let newDirection
  lines.forEach((line) => {
    if (delimiter === '') {
      if (line.split(' ')[1] === 'mdast') {
        description = description.trim()
        ;[delimiter] = line.split(' ')
      } else {
        description += `${line}\n`
      }
      return
    }
    ;[newDelimiter, newFormat, newDirection] = line.split(' ')
    if (newDelimiter === delimiter) {
      if (mdast === '') {
        mdast = `${content.trim()}\n`
      } else {
        conversions.push({ content: content.trim(), direction, format })
      }
      content = ''
      newDirection = newDirection || ConversionDirections.roundtrip
      if (
        !(newFormat in ConversionFormats) ||
        !(newDirection in ConversionDirections)
      ) {
        throw Error(`Invalid format "${newFormat}" or direction "${newDirection}"`)
      }
      ;[format, direction] = [
        newFormat as ConversionFormats,
        newDirection as ConversionDirections,
      ]
    } else {
      content += line
      if (format !== ConversionFormats.html || !content.endsWith('>')) {
        content += '\n'
      }
    }
  })
  if (mdast === '') {
    mdast = content
  } else {
    conversions.push({ content: content.trim(), direction, format })
  }
  return { description, mdast, conversions }
}

function mystToMdast(mdast: string, myst: string, messagePrefix: string) {
  const newMdast = toYAML(fromMarkdown(myst))
  it(`${messagePrefix} myst -> mdast`, () => expect(newMdast).toEqual(mdast))
}

function mdastToMyst(mdast: string, myst: string, messagePrefix: string) {
  const newMyst = myst
  // TODO: toMarkdown
  // const newMyst = toMarkdown(fromYAML(mdast))
  it.skip(`${messagePrefix} mdast -> myst`, () => expect(newMyst).toEqual(myst))
}

function htmlToMdast(mdast: string, html: string, messagePrefix: string) {
  const newMdast = mdast
  // TODO: fromHTML
  // const newMdast = toYAML(fromHTML(html, document, DOMParser))
  it.skip(`${messagePrefix} html -> mdast`, () => expect(newMdast).toEqual(mdast))
}

async function mdastToHTML(mdast: string, html: string, messagePrefix: string) {
  const newHTML = await toHTML(fromYAML(mdast))
  it(`${messagePrefix} mdast -> html`, () => expect(newHTML).toEqual(html))
}

export function conversionTests(directory: string) {
  const dirSplit = directory.split(path.sep)
  describe(dirSplit[dirSplit.length - 1], () => {
    let exportFcn
    let importFcn
    const files = fs.readdirSync(directory)
    files.forEach((file) => {
      if (!file.endsWith('.txt')) return
      const structure = loadExample(path.join(directory, file))
      describe(structure.description, () => {
        structure.conversions.forEach(async (conversion) => {
          switch (conversion.format) {
            case ConversionFormats.myst:
              exportFcn = mdastToMyst
              importFcn = mystToMdast
              break
            case ConversionFormats.html:
              exportFcn = mdastToHTML
              importFcn = htmlToMdast
              break
            default:
              throw Error(`Invalid format ${conversion.format}`)
          }
          switch (conversion.direction) {
            case ConversionDirections.roundtrip:
              await exportFcn(structure.mdast, conversion.content, 'roundtrip: ')
              await importFcn(structure.mdast, conversion.content, '           ')
              break
            case ConversionDirections.export:
              await exportFcn(structure.mdast, conversion.content, '  one way: ')
              break
            case ConversionDirections.import:
              await importFcn(structure.mdast, conversion.content, '  one way: ')
              break
            default:
              throw Error(`Invalid direction ${conversion.direction}`)
          }
        })
      })
    })
  })
}
