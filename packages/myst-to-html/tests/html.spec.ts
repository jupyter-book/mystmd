import { describe, expect, it } from 'vitest';
import { u } from 'unist-builder';
import { mystToHtml } from '../src';

describe('mystToHtml', () => {
  it('Converts a tag schema to a string', () => {
    const html = mystToHtml(u('root', [u('paragraph', [u('text', 'hello world')])]));
    expect(html).toBe('<p>hello world</p>');
  });
  it('Converts comment', () => {
    const html = mystToHtml(u('root', [u('comment', 'hello world')]) as any);
    expect(html).toBe('<!--hello world-->');
  });
  it('Html node is empty by default', () => {
    const html = mystToHtml(u('root', [u('html', '<p>hello world</>')]) as any);
    expect(html).toBe('');
  });
  it('Applies `math-inline` to `inlineMath` nodes', () => {
    const html = mystToHtml(u('root', [u('paragraph', [u('inlineMath', 'y = a x + b')])]));
    expect(html).toBe('<p><span class="math-inline">y = a x + b</span></p>');
  });
  it('Applies `math-display` to `math` nodes', () => {
    const html = mystToHtml(u('root', [u('math', 'y = a x + b')]));
    expect(html).toBe('<div class="math-display">y = a x + b</div>');
  });
});
