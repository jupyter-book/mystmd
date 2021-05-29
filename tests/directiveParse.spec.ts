import parseStructure from '../src/directives2/parseStructure'

describe('directive parser', () => {
  it('parses a "null" directive (no args, content)', () => {
    const { args, options, body } = parseStructure('', '', {})
    expect(args).toEqual([])
    expect(options).toEqual({})
    expect(body).toEqual('')
  })
  it('parses a single arg directive', () => {
    const { args, options, body } = parseStructure('arg with space', '', {
      required_arguments: 1,
      final_argument_whitespace: true
    })
    expect(args).toEqual(['arg with space'])
    expect(options).toEqual({})
    expect(body).toEqual('')
  })
  it('parses a multi arg directive', () => {
    const { args, options, body } = parseStructure('arg with space', '', {
      required_arguments: 2,
      final_argument_whitespace: true
    })
    expect(args).toEqual(['arg', 'with space'])
    expect(options).toEqual({})
    expect(body).toEqual('')
  })
  it('parses a directive with content only', () => {
    const { args, options, body } = parseStructure('first line content', '', {
      has_content: true
    })
    expect(args).toEqual([])
    expect(options).toEqual({})
    expect(body).toEqual('first line content')
  })
  it('parses a directive with options as ---', () => {
    const { args, options, body } = parseStructure('', '---\na: 1\n---', {})
    expect(args).toEqual([])
    expect(options).toEqual({ a: 1 })
    expect(body).toEqual('')
  })
  it('parses a directive with options as :', () => {
    const { args, options, body } = parseStructure('', ':a: 1', {})
    expect(args).toEqual([])
    expect(options).toEqual({ a: 1 })
    expect(body).toEqual('')
  })
  it('parses a directive with options as --- and content', () => {
    const { args, options, body } = parseStructure(
      '',
      '---\na: 1\n---\ncontent\nlines',
      {
        has_content: true
      }
    )
    expect(args).toEqual([])
    expect(options).toEqual({ a: 1 })
    expect(body).toEqual('content\nlines')
  })
  it('parses a directive with options as : and content', () => {
    const { args, options, body } = parseStructure('', ':a: 1\n\ncontent\nlines', {
      has_content: true
    })
    expect(args).toEqual([])
    expect(options).toEqual({ a: 1 })
    expect(body).toEqual('content\nlines')
  })
})

// TODO more tests, including exception states (parity with myst-parser)
