/** Parse the fist line and content of a directive token to its structure
 *
 * The code is adapted from: myst_parser/parse_directives.py
 * and is common for all directives
 */

import yaml from 'js-yaml'
import { OptionSpecConverter } from './optionConverters'

/** Structure of a directive */
export interface IDirectiveStruct {
  args: string[]
  options: { [key: string]: any }
  body: string
  bodyOffset: number
}

/** Data required to parse a directive first line and content to its structure */
export interface IDirectiveSpec {
  /** number of required arguments */
  required_arguments?: number
  /** number of optional arguments */
  optional_arguments?: number
  /** indicating if the final argument may contain whitespace */
  final_argument_whitespace?: boolean
  /** if content is allowed */
  has_content?: boolean
  /** mapping known option names to conversion functions */
  option_spec?: {
    [key: string]: OptionSpecConverter
  }
}

export const DirectiveSpecDefaults: IDirectiveSpec = {
  required_arguments: 0,
  optional_arguments: 0,
  final_argument_whitespace: false,
  has_content: false,
  option_spec: {}
}

/** Raise on parsing/validation error. */
export class DirectiveParsingError extends Error {}

/**
 * This function contains the logic to take the first line of a directive,
 * and the content, and turn it into the three core components:
 * arguments (list), options (key, val mapping), body (text).
 */
export default function parseStructure(
  firstLine: string,
  content: string,
  directiveSpec: IDirectiveSpec,
  skipValidation?: boolean
): IDirectiveStruct {
  const fullSpec = { ...DirectiveSpecDefaults, ...directiveSpec }
  let body = content.trim() ? content.split(/\r?\n/) : []
  let bodyOffset = 0
  let options = {}
  if (Object.keys(fullSpec.option_spec || {})) {
    ;[body, options, bodyOffset] = parseDirectiveOptions(
      body,
      fullSpec,
      !skipValidation
    )
  }
  let args: string[] = []
  if (
    !fullSpec.required_arguments &&
    !fullSpec.optional_arguments &&
    !Object.keys(options).length
  ) {
    if (firstLine) {
      bodyOffset = 0
      body = [firstLine].concat(body)
    }
  } else {
    args = parseDirectiveArguments(firstLine, fullSpec)
  }
  // remove first line of body if blank, to allow space between the options and the content
  if (body.length && !body[0].trim()) {
    body.shift()
  }
  // check for body content
  if (body.length && !fullSpec.has_content) {
    throw new DirectiveParsingError('Has content but content not allowed')
  }
  return { args, options, body: body.join('\n'), bodyOffset }
}

function parseDirectiveOptions(
  content: string[],
  fullSpec: IDirectiveSpec,
  validate: boolean
): [string[], { [key: string]: any }, number] {
  // instantiate options
  let bodyOffset = 1
  let options: { [key: string]: any } = {}
  let yamlBlock: null | string[] = null

  // TODO allow for indented content (I can't remember why this was needed?)

  if (content.length && content[0].startsWith('---')) {
    // options contained in YAML block, ending with '---'
    bodyOffset++
    const newContent: string[] = []
    yamlBlock = []
    let foundDivider = false
    for (const line of content.slice(1)) {
      if (line.startsWith('---')) {
        bodyOffset++
        foundDivider = true
        continue
      }
      if (foundDivider) {
        newContent.push(line)
      } else {
        bodyOffset++
        yamlBlock.push(line)
      }
    }
    content = newContent
  } else if (content.length && content[0].startsWith(':')) {
    bodyOffset++
    const newContent: string[] = []
    yamlBlock = []
    let foundDivider = false
    for (const line of content) {
      if (!foundDivider && !line.startsWith(':')) {
        bodyOffset++
        foundDivider = true
        continue
      }
      if (foundDivider) {
        newContent.push(line)
      } else {
        bodyOffset++
        yamlBlock.push(line.slice(1))
      }
    }
    content = newContent
  }

  if (yamlBlock !== null) {
    try {
      const output = yaml.load(yamlBlock.join('\n'))
      if (output !== null && typeof output === 'object') {
        options = output
      } else {
        throw new DirectiveParsingError(`not dict: ${output}`)
      }
    } catch (error) {
      throw new DirectiveParsingError(`Invalid options YAML: ${error}`)
    }
  }

  if (!validate) {
    return [content, options, bodyOffset]
  }

  for (const [name, value] of Object.entries(options)) {
    const convertor = fullSpec.option_spec ? fullSpec.option_spec[name] : null
    if (!convertor) {
      throw new DirectiveParsingError(`Unknown option: ${name}`)
    }
    let converted_value = value
    if (value === null || value === false) {
      converted_value = ''
    }
    try {
      converted_value = convertor(`${converted_value}`)
    } catch (error) {
      throw new DirectiveParsingError(
        `Invalid option value: (option: '${name}'; value: ${value})\n${error}`
      )
    }
    options[name] = converted_value
  }

  return [content, options, bodyOffset]
}

function parseDirectiveArguments(
  firstLine: string,
  fullSpec: IDirectiveSpec
): string[] {
  let args = firstLine.trim() ? firstLine.trim()?.split(/\s+/) : []
  const totalArgs =
    (fullSpec.required_arguments || 0) + (fullSpec.optional_arguments || 0)
  if (args.length < (fullSpec.required_arguments || 0)) {
    throw new DirectiveParsingError(
      `${fullSpec.required_arguments} argument(s) required, ${args.length} supplied`
    )
  } else if (args.length > totalArgs) {
    if (fullSpec.final_argument_whitespace) {
      // note split limit does not work the same as in python
      const arr = firstLine.split(/\s+/)
      args = arr.splice(0, totalArgs - 1)
      // TODO is it ok that we effectively replace all whitespace with single spaces?
      args.push(arr.join(' '))
    } else {
      throw new DirectiveParsingError(
        `maximum ${totalArgs} argument(s) allowed, ${args.length} supplied`
      )
    }
  }
  return args
}
