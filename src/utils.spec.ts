import { formatTag, toHTML } from './utils'

describe('Utils', () => {
  it('html formatting is simple', () => {
    const f = formatTag('figure', { id: 'one', class: 'numbered' }, false)
    expect(f).toBe('<figure id="one" class="numbered">')
  })
  it('strips dangerous tags', () => {
    const f = formatTag('figure', { id: 'one', class: '<script>' }, false)
    expect(f).toBe('<figure id="one" class="&lt;script&gt;">')
  })
})

describe('toHTML', () => {
  it('Converts a tag schema to a string', () => {
    const [a, b] = toHTML([
      'figure',
      { hi: '1' },
      ['img', { src: '2' }],
      ['figcaption', { number: '3' }, 0]
    ])
    expect(a).toBe('<figure hi="1">\n<img src="2">\n<figcaption number="3">\n')
    expect(b).toBe('</figcaption>\n</figure>\n')
  })
  it('Raises errors on multiple holes', () => {
    expect(() =>
      toHTML([
        'figure',
        { hi: '1' },
        0,
        ['img', { src: '2' }],
        ['figcaption', { number: '3' }, 0]
      ])
    ).toThrow()
  })
})
