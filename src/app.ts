// TODO add crypto-browserify for use in the browser
import { createHash } from 'crypto'
import MarkdownIt from 'markdown-it'

import Token from 'markdown-it/lib/token'

import {
  Application,
  ILogger,
  ILoggerProps,
  IDocCache,
  IEnvDB,
  ITokenizer,
  IBuilder,
  TConfig,
  TJSONValue
} from './appComponents'

/** Log to the console */
class ConsoleLogger implements ILogger {
  composeMessage(props: ILoggerProps): string {
    return `${props.docId}:${props.line}: ${props.message} [${props.category}.${props.subcategory}]`
  }
  debug(props: ILoggerProps): void {
    console.debug(this.composeMessage(props))
  }
  info(props: ILoggerProps): void {
    console.info(this.composeMessage(props))
  }
  warn(props: ILoggerProps): void {
    console.warn(this.composeMessage(props))
  }
  error(props: ILoggerProps): void {
    console.error(this.composeMessage(props))
  }
}

class InMemoryDocCache implements IDocCache {
  private docs: Map<string, { date: Date; hash: string; tokens: Token[] }> = new Map()
  private hashDoc(src: string): string {
    return createHash('md5').update(src).digest('hex')
  }
  putDoc(docId: string, src: string, tokens: Token[]): void {
    this.docs.set(docId, { date: new Date(), hash: this.hashDoc(src), tokens: tokens })
  }
  getDoc(docId: string): undefined | Token[] {
    return this.docs.get(docId)?.tokens
  }
  listDocIds(): string[] {
    return [...this.docs.keys()]
  }
  cacheTime(docId: string): undefined | Date {
    return this.docs.get(docId)?.date
  }
  changed(docId: string, src: string): boolean {
    const currentHash = this.docs.get(docId)?.hash
    return currentHash ? currentHash === this.hashDoc(src) : true
  }
  removeDoc(docId: string): void {
    this.docs.delete(docId)
  }
  clear(): void {
    this.docs.clear()
  }
}

class InMemoryEnvDB implements IEnvDB {
  private config?: TConfig
  clear(): void {
    this.config = undefined
  }
  getConfig(): undefined | TConfig {
    return this.config
  }
  putConfig(config: TConfig): void {
    this.config = config
  }
}

class MdItTokenizer implements ITokenizer {
  private mdit: MarkdownIt
  constructor(mdit: MarkdownIt) {
    this.mdit = mdit
  }
  tokenize(docId: string, src: string, config: TConfig, logger: ILogger) {
    const env: any = { docId, config, logger }
    const tokens = this.mdit.parse(src, env)
    return { tokens, forDb: env.db || {} }
  }
}

class MdItBuilder implements IBuilder {
  private mdit: MarkdownIt
  constructor(mdit: MarkdownIt) {
    this.mdit = mdit
  }
  applyPostTransforms(tokens: Token[], config: TConfig, logger: ILogger) {
    return tokens
  }
  render(docId: string, tokens: Token[], config: TConfig, logger: ILogger): string {
    const env: any = { docId, config, logger }
    return this.mdit.renderer.render(tokens, this.mdit.options, env)
  }
}

export class MyST {
  private app: Application

  constructor() {

    const mdit = MarkdownIt('commonmark')

    this.app = new Application(
      new ConsoleLogger(),
      [],
      new InMemoryDocCache(),
      new InMemoryEnvDB(),
      new MdItTokenizer(mdit),
      new MdItBuilder(mdit)
    )
  }

  render(src: string): string {
    const docID = 'main'
    this.app.tokenizeDoc(docID, src)
    return this.app.renderDoc(docID)
  }
}
