import { describe, expect, test } from 'vitest';
import { texToText } from './utils';

describe('utils', () => {
  test('', () => {
    const node = {
      type: 'argument',
      content: [
        { type: 'string', content: '1' },
        { type: 'string', content: ',' },
        { type: 'string', content: '2' },
      ],
    };
    expect(texToText(node)).toBe('1,2');
  });
});
