import { describe, expect, it } from 'vitest';
import { mystToHast } from '../src/schema';
import { mystToHtml } from '../src/renderMdast';
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

describe('unhandled directives', () => {
  it('writes a directive with no body', () => {
    const tree = u('root', [u('mystDirective', { name: 'nope' })]);
    expect(mystToHtml(tree as any)).toBe(
      '<div class="directive unhandled"><p><code class="kind">{nope}</code></p></div>',
    );
  });
  it('writes a directive body', () => {
    const tree = u('root', [u('mystDirective', { name: 'nope', value: 'x' })]);
    expect(mystToHtml(tree as any)).toBe(
      '<div class="directive unhandled"><p><code class="kind">{nope}</code></p><pre><code>x</code></pre></div>',
    );
  });
});
