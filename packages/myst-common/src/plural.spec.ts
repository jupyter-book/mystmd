import { describe, expect, it } from 'vitest';
import { plural } from './plural';

describe('isUrl', () => {
  it.each([
    ['%s book(s)', 0, '0 books'],
    ['%s book(s)', 1, '1 book'],
    ['%s book(s)', 2, '2 books'],
    ['%s dependenc(y|ies)', 0, '0 dependencies'],
    ['%s dependenc(y|ies)', 1, '1 dependency'],
    ['%s dependenc(y|ies)', 2, '2 dependencies'],
    ['%s stitch(es)', 0, '0 stitches'],
    ['%s stitch(es)', 1, '1 stitch'],
    ['%s stitch(es)', 2, '2 stitches'],
  ])('"%s" + %s ➡️ "%s"', (t, n, p) => {
    expect(plural(t, n)).toEqual(p);
  });
});
