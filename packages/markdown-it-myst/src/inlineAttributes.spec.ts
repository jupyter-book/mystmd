// parseRoleHeader.spec.ts
import { describe, expect, test } from 'vitest';
import { inlineOptionsToTokens, tokenizeInlineAttributes } from './inlineAttributes';

describe('parseRoleHeader', () => {
  // Good (valid) test cases
  test.each([
    ['simple', [{ kind: 'bare', value: 'simple' }]],
    [
      'someRole .cls1 .cls2',
      [
        { kind: 'bare', value: 'someRole' },
        { kind: 'class', value: 'cls1' },
        { kind: 'class', value: 'cls2' },
      ],
    ],
    [
      'myRole #foo',
      [
        { kind: 'bare', value: 'myRole' },
        { kind: 'id', value: 'foo' },
      ],
    ],
    [
      'myRole .red #xyz attr="value"',
      [
        { kind: 'bare', value: 'myRole' },
        { kind: 'class', value: 'red' },
        { kind: 'id', value: 'xyz' },
        { kind: 'attr', key: 'attr', value: 'value' },
      ],
    ],
    [
      'roleName data="some \\"escaped\\" text"',
      [
        { kind: 'bare', value: 'roleName' },
        { kind: 'attr', key: 'data', value: 'some "escaped" text' },
      ],
    ],
    ['.className', [{ kind: 'class', value: 'className' }]],
    [
      'myRole open=true',
      [
        { kind: 'bare', value: 'myRole' },
        { kind: 'attr', key: 'open', value: 'true' },
      ],
    ],
    [
      'myRole open=""',
      [
        { kind: 'bare', value: 'myRole' },
        { kind: 'attr', key: 'open', value: '' },
      ],
    ],
    [
      'myRole #foo.',
      [
        { kind: 'bare', value: 'myRole' },
        { kind: 'unknown', value: '#foo.' },
      ],
    ],
    [
      'myRole foo="{testing .blah}`content`"',
      [
        { kind: 'bare', value: 'myRole' },
        { kind: 'attr', key: 'foo', value: '{testing .blah}`content`' },
      ],
    ],
    ['cite:p', [{ kind: 'bare', value: 'cite:p' }]],
    ['CITE:P', [{ kind: 'bare', value: 'CITE:P' }]],
    ['1', [{ kind: 'bare', value: '1' }]],
    ['    abc   ', [{ kind: 'bare', value: 'abc' }]],
    [
      'half-quote blah="asdf',
      [
        { kind: 'bare', value: 'half-quote' },
        { kind: 'unknown', value: 'blah="asdf' },
      ],
    ],
  ])('parses valid header: %s', (header, expected) => {
    const result = tokenizeInlineAttributes(header);
    expect(result).toEqual(expected);
  });

  // Error test cases
  test.each([
    [
      'Extra bare token after name',
      'myRole anotherWord',
      'No additional bare tokens allowed after the first token',
    ],
    ['Multiple IDs', 'myRole #first #second', 'Cannot have more than one ID defined'],
    ['ID starts with a digit', 'myRole #1bad', 'ID cannot start with a number: "1bad"'],
    ['Unknown token', 'myRole #bad.', 'Unknown token "#bad."'],
    ['Unknown token', 'myRole .class.no.space', 'Classes must be separated by spaces'],
  ])('throws error: %s', (_, header, expectedMessage) => {
    expect(() => inlineOptionsToTokens(header, 0, null as any)).toThrow(expectedMessage);
  });
});
