import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { inlineMathSimplificationTransform } from './mathSimplifications';

describe('Test math transformations', () => {
  test.each([
    ['2.34', u('text', '2.34')],
    ['-2', u('text', '-2')],
    ['_2', u('subscript', [u('text', '2')])],
    ['^2', u('superscript', [u('text', '2')])],
    ['_{2}', u('subscript', [u('text', '2')])],
    ['^{+2}', u('superscript', [u('text', '+2')])],
    ['^{st}', u('superscript', [u('text', 'st')])],
    ['10^4', u('span', [u('text', '10'), u('superscript', [u('text', '4')])])],
    ['-10^4', u('span', [u('text', '-10'), u('superscript', [u('text', '4')])])],
    ['10^{-4}', u('span', [u('text', '10'), u('superscript', [u('text', '-4')])])],
    ['10_{+4.3}', u('span', [u('text', '10'), u('subscript', [u('text', '+4.3')])])],
    ['^{\\alpha}', u('superscript', [u('text', 'α')])],
    ['_{\\alpha}', u('subscript', [u('text', 'α')])],
    ['^{\\unknown}', u('inlineMath', '^{\\unknown}')],
    ['\\circ', u('text', '∘')],
    ['^{\\circ}', u('text', '°')],
  ])('%s', (value, after) => {
    const node = { type: 'inlineMath', value } as any;
    const mdast = { children: [node] } as any;
    inlineMathSimplificationTransform(mdast);
    expect(node).toMatchObject(after);
  });
});
