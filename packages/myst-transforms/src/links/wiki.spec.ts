import { describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { Link } from './types';
import { WikiTransformer } from './wiki';

describe('Test WikiTransformer', () => {
  test('any wiki protocol', async () => {
    const file = new VFile();
    const t = new WikiTransformer();
    const link: Link = {
      type: 'link',
      url: 'wiki:hello_there_world',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe('https://en.wikipedia.org/wiki/hello_there_world');
    expect(link.children).toEqual([{ type: 'text', value: 'hello there world' }]);
    expect(link.data?.wiki).toEqual('https://en.wikipedia.org/');
    expect(link.data?.page).toEqual('hello_there_world');
  });
  test('Test with pre populated children', async () => {
    const file = new VFile();
    const t = new WikiTransformer();
    const link: Link = {
      type: 'link',
      url: 'wiki:hello_there_world',
      children: [{ type: 'text', value: 'wiki:hello_there_world' }],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe('https://en.wikipedia.org/wiki/hello_there_world');
    // This only works when run via myst-cli
    // expect(link.children).toEqual([{ type: 'text', value: 'hello there world' }]);
    expect(link.data?.wiki).toEqual('https://en.wikipedia.org/');
    expect(link.data?.page).toEqual('hello_there_world');
  });
  test('any wiki link', async () => {
    const file = new VFile();
    const t = new WikiTransformer();
    const link: Link = {
      type: 'link',
      url: 'https://en.wikipedia.org/wiki/hello_there',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe('https://en.wikipedia.org/wiki/hello_there');
    expect(link.children).toEqual([{ type: 'text', value: 'hello there' }]);
    expect(link.data?.wiki).toEqual('https://en.wikipedia.org/');
    expect(link.data?.page).toEqual('hello_there');
  });
  test('french wiki link', async () => {
    const file = new VFile();
    const t = new WikiTransformer();
    const link: Link = {
      type: 'link',
      url: 'https://fr.wikipedia.org/wiki/Croissant_(viennoiserie)',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe('https://fr.wikipedia.org/wiki/Croissant_(viennoiserie)');
    expect(link.children).toEqual([{ type: 'text', value: 'Croissant (viennoiserie)' }]);
    expect(link.data?.wiki).toEqual('https://fr.wikipedia.org/');
    expect(link.data?.page).toEqual('Croissant_(viennoiserie)');
  });
  test('various valid and invalid links', async () => {
    const t = new WikiTransformer();
    expect(t.test('wiki')).toBe(false);
    expect(t.test('wiki:')).toBe(true); // should pick up the protocol
    expect(t.test('https://fr.wikipedia.org/Croissant_(viennoiserie)')).toBe(false);
    expect(t.test('https://wikipedia.org/wiki/Rock')).toBe(true);
  });
  test('trailing slashes', async () => {
    const file = new VFile();
    const t = new WikiTransformer();
    const link: Link = {
      type: 'link',
      url: 'https://fr.wikipedia.org/wiki/Croissant_(viennoiserie)/edit',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(false); // passes test, but not validation
  });
  test('french default wiki transformer', async () => {
    const file = new VFile();
    const t = new WikiTransformer({ lang: 'fr' });
    const link: Link = {
      type: 'link',
      url: 'wiki:Croissant_(viennoiserie)',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe('https://fr.wikipedia.org/wiki/Croissant_(viennoiserie)');
    expect(link.children).toEqual([{ type: 'text', value: 'Croissant (viennoiserie)' }]);
    expect(link.data?.wiki).toEqual('https://fr.wikipedia.org/');
    expect(link.data?.page).toEqual('Croissant_(viennoiserie)');
  });
  test('custom wiki url', async () => {
    const file = new VFile();
    const t = new WikiTransformer({ url: 'https://wiki.seg.org/wiki' });
    expect(t.wikiUrl).toBe('https://wiki.seg.org/');
    expect(t.lang).toBe(undefined);
    const link: Link = {
      type: 'link',
      url: 'wiki:Knowledge_tree',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe('https://wiki.seg.org/wiki/Knowledge_tree');
    expect(link.children).toEqual([{ type: 'text', value: 'Knowledge tree' }]);
    expect(link.data?.wiki).toEqual('https://wiki.seg.org/');
    expect(link.data?.page).toEqual('Knowledge_tree');
  });
  test('custom wiki url resolves link', async () => {
    const file = new VFile();
    const t = new WikiTransformer({ url: 'https://wiki.seg.org/wiki' });
    expect(t.wikiUrl).toBe('https://wiki.seg.org/');
    expect(t.lang).toBe(undefined);
    const link: Link = {
      type: 'link',
      url: 'https://wiki.seg.org/wiki/Knowledge_tree',
      children: [],
    };
    expect(t.test(link.url)).toBe(true);
    expect(t.transform(link, file)).toBe(true);
    expect(link.url).toBe('https://wiki.seg.org/wiki/Knowledge_tree');
    expect(link.children).toEqual([{ type: 'text', value: 'Knowledge tree' }]);
    expect(link.data?.wiki).toEqual('https://wiki.seg.org/');
    expect(link.data?.page).toEqual('Knowledge_tree');
  });
});
