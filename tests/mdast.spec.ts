import { MyST } from '../src'
import { tokensToMdast } from '../src/mdast'

const tokenizer = MyST()

describe('Basic', () => {
  it('can parse a simple header', () => {
    const tokens = tokenizer.parse('[alpha](https://example.com "bravo")', {})
    tokensToMdast(tokens)
    expect(tokens.length).toBe(3)
  })
})
