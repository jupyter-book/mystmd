import parseStructure from '../src/directives/parseStructure'
import { unchanged, class_option } from '../src/directives/optionConverters'

describe('directive parser', () => {
  it('parses a "null" directive (no args, content)', () => {
    const { args, options, body } = parseStructure('', '', {})
    expect(args).toEqual([])
    expect(options).toEqual({})
    expect(body).toEqual('')
  })
  it('parses a single arg directive', () => {
    const output = parseStructure('arg with space', '', {
      required_arguments: 1,
      final_argument_whitespace: true
    })
    expect(output).toEqual({
      args: ['arg with space'],
      options: {},
      body: '',
      bodyOffset: 1
    })
  })
  it('parses a multi arg directive', () => {
    const output = parseStructure('arg with space', '', {
      required_arguments: 2,
      final_argument_whitespace: true
    })
    expect(output).toEqual({
      args: ['arg', 'with space'],
      options: {},
      body: '',
      bodyOffset: 1
    })
  })
  it('parses a directive with content only', () => {
    const output = parseStructure('first line content', '', {
      has_content: true
    })
    expect(output).toEqual({
      args: [],
      options: {},
      body: 'first line content',
      bodyOffset: 0
    })
  })
  it('parses a directive with options as ---', () => {
    const output = parseStructure('', '---\na: 1\nb: class1 class2\n---', {
      option_spec: { a: unchanged, b: class_option }
    })
    expect(output).toEqual({
      args: [],
      options: { a: '1', b: ['class1', 'class2'] },
      body: '',
      bodyOffset: 5
    })
  })
  it('parses a directive with options as :', () => {
    const output = parseStructure('', ':a: 1', { option_spec: { a: unchanged } })
    expect(output).toEqual({
      args: [],
      options: { a: '1' },
      body: '',
      bodyOffset: 3
    })
  })
  it('parses a directive with options as --- and content', () => {
    const output = parseStructure('', '---\na: 1\n---\ncontent\nlines', {
      has_content: true,
      option_spec: { a: unchanged }
    })
    expect(output).toEqual({
      args: [],
      options: { a: '1' },
      body: 'content\nlines',
      bodyOffset: 4
    })
  })
  it('parses a directive with options as : and content', () => {
    const output = parseStructure('', ':a: 1\n\ncontent\nlines', {
      has_content: true,
      option_spec: { a: unchanged }
    })
    expect(output).toEqual({
      args: [],
      options: { a: '1' },
      body: 'content\nlines',
      bodyOffset: 4
    })
  })
})

// TODO more tests, including exception states (parity with myst-parser)
