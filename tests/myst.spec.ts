import { MyST } from '../src/app'

describe('hi', () => {
  it('there', () => {
    const myst = new MyST()
    const output = myst.render('test')
    expect(output).toEqual('<p>test</p>\n')
  })
})
