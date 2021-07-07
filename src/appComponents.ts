/** This module defines the components of the documentation build system */
import Token from 'markdown-it/lib/token'

export interface ILoggerProps {
  message: string
  docId?: string
  line?: number
  category?: string
  subcategory?: string
}

/** An abstraction of the console logging methods. */
export interface ILogger {
  debug(props: ILoggerProps): void
  info(props: ILoggerProps): void
  warn(props: ILoggerProps): void
  error(props: ILoggerProps): void
}

// Taken from https://github.com/microsoft/TypeScript/issues/1897#issuecomment-822032151
/** A JSON serializable value */
export type TJSONValue =
  | string
  | number
  | boolean
  | null
  | TJSONValue[]
  | { [key: string]: TJSONValue }

/** Specification for a single global configuration option */
export interface IConfigSpec {
  name: string
  default: TJSONValue
  validator?: (value: TJSONValue, logger: ILogger) => TJSONValue
  /** Whether a change to this variable necessitates reparsing all documents,
   * or a refresh of the render
   */
  rebuild: 'tokens' | 'render' | 'none'
}

/** The current configuration */
export type TConfig = { [key: string]: TJSONValue }

/** Interface to a doc caching store
 *
 * This will store a copy of the tokens for each document,
 * together with the date it was added, and a hash of the source text.
 * Using the hash, we can decide if the content has changed and should be reparsed.
 */
export interface IDocCache {
  clear(): void
  putDoc(docId: string, src: string, tokens: Token[]): void
  getDoc(docId: string): undefined | Token[]
  listDocIds(): string[]
  cacheTime(docId: string): undefined | Date
  changed(docId: string, src: string): boolean
  removeDoc(docId: string): void
}

/** Interface to a global state (environment) database
 *
 * This will store data such as the configuration and reference target location
 */
export interface IEnvDB {
  clear(): void
  getConfig(): undefined | TConfig
  putConfig(config: TConfig): void
  // putGlobal(key: string, value: TJSONValue): void
  // getGlobal(key: string): TJSONValue
  // putDoc(docId: string, env: { [key: string]: TJSONValue }): void
  // removeDoc(docId: string): void
}

/** A tokenizer for a specific source file format */
export interface ITokenizer {
  tokenize(
    docId: string,
    src: string,
    config: TConfig,
    logger: ILogger
  ): { tokens: Token[]; forDb: { [key: string]: TJSONValue } }
}

/** A render for a specific output file format
 *
 * It may first apply mutations to the token stream in the post transforms.
 */
export interface IBuilder {
  applyPostTransforms(tokens: Token[], config: TConfig, logger: ILogger): Token[]
  render(docId: string, tokens: Token[], config: TConfig, logger: ILogger): string
}

/** The whole application */
export class Application {
  public logger: ILogger
  public configSpec: IConfigSpec[]
  public docCache: IDocCache
  public envDB: IEnvDB
  // TODO eventually this should be a mapping for different file formats
  public tokenizer: ITokenizer
  public builder: IBuilder

  constructor(
    logger: ILogger,
    configSpec: IConfigSpec[],
    docCache: IDocCache,
    envDB: IEnvDB,
    tokenizer: ITokenizer,
    builder: IBuilder
  ) {
    this.logger = logger
    this.configSpec = configSpec
    this.docCache = docCache
    this.envDB = envDB
    this.tokenizer = tokenizer
    this.builder = builder
  }

  /** Set the full config for all options in configSpec and persist
   *
   * If a value has changed that requires document rebuild, we wipe the cache.
   */
  setConfig(values: TConfig): void {
    const oldConfig = this.envDB.getConfig() || {}
    const newConfig: TConfig = {}
    let rebuild = 0
    const rebuildMap = {
      none: 0,
      render: 1,
      tokens: 2
    }
    for (const option of this.configSpec) {
      if (option.name in values) {
        const value = option.validator
          ? option.validator(values[option.name], this.logger)
          : values[option.name]
        if (value !== oldConfig[option.name]) {
          rebuild = Math.max(rebuildMap[option.rebuild], rebuild)
        }
        newConfig[option.name] = value
      } else {
        newConfig[option.name] = option.default
      }
    }
    // TODO log warning if key in values is not in spec?
    this.envDB.putConfig(newConfig)
    if (rebuild == 2) {
      this.docCache.clear()
      this.envDB.clear()
    } else if (rebuild == 1) {
      // TODO handle this
    }
  }

  /** Parse a single document to tokens and persist */
  tokenizeDoc(docID: string, src: string): void {
    if (!this.docCache.changed(docID, src)) {
      return
    }
    const config = this.envDB.getConfig() || {} // TODO assert config not null?
    const { tokens, forDb } = this.tokenizer.tokenize(docID, src, config, this.logger)
    this.docCache.putDoc(docID, src, tokens)
    // this.envDB.putDoc(docID, env)
  }

  /** Render a single document */
  renderDoc(docID: string): string {
    let tokens = this.docCache.getDoc(docID) || [] // TODO assert tokens not null?
    const config = this.envDB.getConfig() || {} // TODO assert config not null?
    // TODO parse the envDB in a readonly manner
    tokens = this.builder.applyPostTransforms(tokens, config, this.logger)
    return this.builder.render(docID, tokens, config, this.logger)
  }
}
