import { u } from 'unist-builder';
import { toText } from './utils';

describe('Test math trasformations', () => {
  test('toText', () => {
    const para = u('paragraph', [u('text', { value: 'hello ' }), u('strong', { value: 'there' })]);
    expect(toText(para)).toBe('hello there');
  });
});
