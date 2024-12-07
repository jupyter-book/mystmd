import { describe, expect, it } from 'vitest';
import { mystToHast } from '../src/schema';
import { u } from 'unist-builder';
import { h } from 'hastscript';

const toHast: (node: any) => any = mystToHast();

describe('mystToHast', () => {
  it('Converts a keyboard node to kbd', () => {
    const hast = toHast(
      u('root', [u('paragraph', [u('keyboard', [u('text', { value: 'Ctrl' })])])]),
    );
    expect(hast).toStrictEqual(h(null, [h('p', [h('kbd', 'Ctrl')])]));
  });
});
