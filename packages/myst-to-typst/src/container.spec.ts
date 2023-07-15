import { describe, expect, it } from 'vitest';
import { CaptionKind, determineCaptionKind } from './container';

describe('determineCaptionKind', () => {
  it('iframe -> figure', () => {
    const node = {
      type: 'iframe',
    };
    expect(determineCaptionKind(node)).toEqual(CaptionKind.fig);
  });
  it('container[table] -> table', () => {
    const node = {
      type: 'container',
      children: [{ type: 'table' }],
    };
    expect(determineCaptionKind(node)).toEqual(CaptionKind.table);
  });
  it('container[embed[block[text]]] -> null', () => {
    const node = {
      type: 'container',
      children: [{ type: 'embed', children: [{ type: 'block', children: [{ type: 'text' }] }] }],
    };
    expect(determineCaptionKind(node)).toEqual(null);
  });
});
