import { describe, expect, test } from 'vitest';
import { u } from 'unist-builder';
import { liftChildren, mergeTextNodes, toText } from './utils';

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
