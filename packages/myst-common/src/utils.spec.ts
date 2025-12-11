import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { liftChildren, mergeTextNodes, normalizeLabel, toText, slugToUrl } from './utils';

describe('Test text utils', () => {
  test('toText', () => {
    const para = u('paragraph', [u('text', { value: 'hello ' }), u('strong', { value: 'there' })]);
    expect(toText(para)).toBe('hello there');
  });
  test('mergeTextNodes', () => {
    const x = mergeTextNodes(
      u('root', [
        u('text', { position: { end: 'not' } }, 'hi'),
        u('text', { position: { end: 'yes' } }, 'hum'),
        u('blah'),
        u('text', 'x'),
        u('text', 'y'),
      ]),
    );
    expect(x.children?.length).toBe(3);
    expect(x.children?.[0].value).toBe('hihum');
    expect(x.children?.[0].position?.end).toBe('yes'); // Obviously a real position, but you get the idea
    expect(x.children?.[2].value).toBe('xy');
  });
});

describe('Test liftChildren', () => {
  test('liftChildren does not modify tree', () => {
    const before = u('root', [u('block', [u('paragraph', [u('text', 'value')])])]);
    const after = u('root', [u('block', [u('paragraph', [u('text', 'value')])])]);
    liftChildren(before, '_lift');
    expect(before).toEqual(after);
  });
  test('liftChildren lifts one child', () => {
    const before = u('root', [u('block', [u('paragraph', [u('text', 'value')])])]);
    const after = u('root', [u('block', [u('text', 'value')])]);
    liftChildren(before, 'paragraph');
    expect(before).toEqual(after);
  });
  test('liftChildren lifts adjacent node children', () => {
    const before = u('root', [
      u('block', [u('paragraph', [u('text', 'one')]), u('paragraph', [u('text', 'two')])]),
    ]);
    const after = u('root', [u('block', [u('text', 'one'), u('text', 'two')])]);
    liftChildren(before, 'paragraph');
    expect(before).toEqual(after);
  });
  test('liftChildren lifts nested node children', () => {
    const before = u('root', [
      u('block', [u('paragraph', [u('paragraph', [u('paragraph', [u('text', 'value')])])])]),
    ]);
    const after = u('root', [u('block', [u('text', 'value')])]);
    liftChildren(before, 'paragraph');
    expect(before).toEqual(after);
  });
  test('liftChildren does not lift root', () => {
    const before = u('root', [u('block', [u('paragraph', [u('text', 'value')])])]);
    const after = u('root', [u('block', [u('paragraph', [u('text', 'value')])])]);
    liftChildren(before, 'root');
    expect(before).toEqual(after);
  });
  test('liftChildren does not lift leaf', () => {
    const before = u('root', [u('block', [u('paragraph', [u('text', 'value')])])]);
    const after = u('root', [u('block', [u('paragraph', [u('text', 'value')])])]);
    liftChildren(before, 'text');
    expect(before).toEqual(after);
  });
});

describe('Test normalize labels', () => {
  test.each([
    ['test', 'test', 'test'],
    ['has spaces', 'has spaces', 'has-spaces'],
    ['has    many   spaces', 'has many spaces', 'has-many-spaces'],
    ['colon:Caps', 'colon:caps', 'colon-caps'],
    ['“MyST’s” ‘influence’', 'mysts influence', 'mysts-influence'],
  ])('normalize label "%s" -> "%s" (#%s)', (label, identifier, html_id) => {
    const result = normalizeLabel(label);
    expect(result?.label).toBe(label);
    expect(result?.identifier).toBe(identifier);
    expect(result?.html_id).toBe(html_id);
  });
});

describe('Test slug to URL', () => {
  test.each([
    [undefined, undefined],
    [null, undefined],
    ['', ''],
    ['folder.index.one', 'folder/index/one'],
    ['folder.index', 'folder'],
    ['folder.blah.two', 'folder/blah/two'],
    ['index', 'index'],
  ])('normalize label "%s" -> "%s" (#%s)', (slug, url) => {
    expect(url).toBe(slugToUrl(slug as any));
  });
});
