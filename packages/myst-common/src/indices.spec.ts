import { beforeEach, describe, expect, test } from 'vitest';
import { VFile } from 'vfile';
import type { IndexTypeLists } from './indices';
import { createIndexEntries, parseIndexLine, splitEntryValue } from './indices';
import type { GenericNode } from './types';

describe('parseIndexLine', () => {
  let value: IndexTypeLists;
  let vfile: VFile;
  let node: GenericNode;
  beforeEach(() => {
    value = {
      single: [],
      pair: [],
      triple: [],
      see: [],
      seealso: [],
    };
    vfile = new VFile();
    node = { type: 'test' };
  });
  test('single: one', () => {
    parseIndexLine('single: one', value, vfile, node);
    expect(value.single).toEqual(['one']);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('single: one; two', () => {
    parseIndexLine('single: one; two', value, vfile, node);
    expect(value.single).toEqual(['one; two']);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('pair: one; two', () => {
    parseIndexLine('pair: one; two', value, vfile, node);
    expect(value.single).toEqual([]);
    expect(value.pair).toEqual(['one; two']);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('triple: one; two; three', () => {
    parseIndexLine('triple: one; two; three', value, vfile, node);
    expect(value.single).toEqual([]);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual(['one; two; three']);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('see: one; two', () => {
    parseIndexLine('see: one; two', value, vfile, node);
    expect(value.single).toEqual([]);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual(['one; two']);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('seealso: one; two', () => {
    parseIndexLine('seealso: one; two', value, vfile, node);
    expect(value.single).toEqual([]);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual(['one; two']);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('one; two', () => {
    parseIndexLine('one; two', value, vfile, node);
    expect(value.single).toEqual(['one; two']);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('one, two', () => {
    parseIndexLine('one, two', value, vfile, node);
    expect(value.single).toEqual(['one', 'two']);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('single: one: two', () => {
    parseIndexLine('single: one: two', value, vfile, node);
    expect(value.single).toEqual([]);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toEqual(1);
  });
  test('other: one; two', () => {
    parseIndexLine('other: one; two', value, vfile, node);
    expect(value.single).toEqual([]);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toEqual(1);
  });
  test('single: one\\: two', () => {
    parseIndexLine('single: one\\: two', value, vfile, node);
    expect(value.single).toEqual(['one: two']);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('one, two\\, three', () => {
    parseIndexLine('one, two\\, three', value, vfile, node);
    expect(value.single).toEqual(['one', 'two, three']);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('<empty>', () => {
    parseIndexLine('', value, vfile, node);
    expect(value.single).toEqual([]);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('single:', () => {
    parseIndexLine('single:', value, vfile, node);
    expect(value.single).toEqual(['']);
    expect(value.pair).toEqual([]);
    expect(value.triple).toEqual([]);
    expect(value.see).toEqual([]);
    expect(value.seealso).toEqual([]);
    expect(vfile.messages?.length).toBeFalsy();
  });
});

describe('splitEntryValue', () => {
  test('<empty>', () => {
    expect(splitEntryValue('')).toEqual({ splitEntry: [], emphasis: false });
  });
  test('one', () => {
    expect(splitEntryValue('one')).toEqual({ splitEntry: ['one'], emphasis: false });
  });
  test('one; two', () => {
    expect(splitEntryValue('one; two')).toEqual({ splitEntry: ['one', 'two'], emphasis: false });
  });
  test('one\\; two', () => {
    expect(splitEntryValue('one\\; two')).toEqual({ splitEntry: ['one; two'], emphasis: false });
  });
  test('!one; two', () => {
    expect(splitEntryValue('!one; two')).toEqual({ splitEntry: ['one', 'two'], emphasis: true });
  });
  test('\\!one; two', () => {
    expect(splitEntryValue('\\!one; two')).toEqual({
      splitEntry: ['!one', 'two'],
      emphasis: false,
    });
  });
  test('one; ', () => {
    expect(splitEntryValue('one; ')).toEqual({ splitEntry: ['one'], emphasis: false });
  });
});

describe('createIndexEntries', () => {
  let value: IndexTypeLists;
  let vfile: VFile;
  let node: GenericNode;
  beforeEach(() => {
    value = {
      single: [],
      pair: [],
      triple: [],
      see: [],
      seealso: [],
    };
    vfile = new VFile();
    node = { type: 'test' };
  });
  test('single: one', () => {
    value.single.push('one');
    expect(createIndexEntries(value, vfile, node)).toEqual([{ entry: 'one', emphasis: false }]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('single: ! one ; two', () => {
    value.single.push('! one ; two');
    expect(createIndexEntries(value, vfile, node)).toEqual([
      { entry: 'one', subEntry: { value: 'two', kind: 'entry' }, emphasis: true },
    ]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('single: one; two; three', () => {
    value.single.push('one; two; three');
    expect(createIndexEntries(value, vfile, node)).toEqual([]);
    expect(vfile.messages?.length).toEqual(2);
  });
  test('single:', () => {
    value.single.push('');
    expect(createIndexEntries(value, vfile, node)).toEqual([]);
    expect(vfile.messages?.length).toEqual(2);
  });
  test('pair: one; two', () => {
    value.pair.push('one; two');
    expect(createIndexEntries(value, vfile, node)).toEqual([
      { entry: 'one', subEntry: { value: 'two', kind: 'entry' }, emphasis: false },
      { entry: 'two', subEntry: { value: 'one', kind: 'entry' }, emphasis: false },
    ]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('pair: one', () => {
    value.pair.push('one');
    expect(createIndexEntries(value, vfile, node)).toEqual([]);
    expect(vfile.messages?.length).toEqual(2);
  });
  test('triple: !one; two; three', () => {
    value.triple.push('!one; two; three');
    expect(createIndexEntries(value, vfile, node)).toEqual([
      { entry: 'one', subEntry: { value: 'two', kind: 'entry' }, emphasis: true },
      { entry: 'two', subEntry: { value: 'one', kind: 'entry' }, emphasis: true },
      { entry: 'two', subEntry: { value: 'three', kind: 'entry' }, emphasis: true },
      { entry: 'three', subEntry: { value: 'two', kind: 'entry' }, emphasis: true },
      { entry: 'one', subEntry: { value: 'three', kind: 'entry' }, emphasis: true },
      { entry: 'three', subEntry: { value: 'one', kind: 'entry' }, emphasis: true },
    ]);
    expect(vfile.messages?.length).toBeFalsy();
  });
  test('triple: !one; two', () => {
    value.triple.push('!one; two');
    expect(createIndexEntries(value, vfile, node)).toEqual([]);
    expect(vfile.messages?.length).toEqual(2);
  });
  test('see: !one; two, see: one', () => {
    value.see.push('!one; two');
    value.see.push('one');
    expect(createIndexEntries(value, vfile, node)).toEqual([
      { entry: 'one', subEntry: { value: 'two', kind: 'see' }, emphasis: true },
    ]);
    expect(vfile.messages?.length).toEqual(1);
  });
  test('seealso: one; two, seealso: !one; two; thre', () => {
    value.seealso.push('one; two');
    value.seealso.push('!one; two; three');
    expect(createIndexEntries(value, vfile, node)).toEqual([
      { entry: 'one', subEntry: { value: 'two', kind: 'seealso' }, emphasis: false },
    ]);
    expect(vfile.messages?.length).toEqual(1);
  });
});
