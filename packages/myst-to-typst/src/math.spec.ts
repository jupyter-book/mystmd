import { describe, expect, it } from 'vitest';
import { resolveRecursiveCommands } from './math';

describe('resolveRecursiveCommands', () => {
  it('basic macro passes', () => {
    expect(
      resolveRecursiveCommands({
        '\\a': { macro: 'abc' },
        '\\b': { macro: 'xyz' },
      }),
    ).toEqual({
      '\\a': { macro: 'abc' },
      '\\b': { macro: 'xyz' },
    });
  });
  it('recursive macro fills', () => {
    expect(
      resolveRecursiveCommands({
        '\\a': { macro: 'abc' },
        '\\b': { macro: '\\a5' },
      }),
    ).toEqual({
      '\\a': { macro: 'abc' },
      '\\b': { macro: 'abc5' },
    });
  });
  it('similar macro does not fill', () => {
    expect(
      resolveRecursiveCommands({
        '\\a': { macro: 'abc' },
        '\\b': { macro: '\\ab' },
      }),
    ).toEqual({
      '\\a': { macro: 'abc' },
      '\\b': { macro: '\\ab' },
    });
  });
  it('doubly nested macro fills', () => {
    expect(
      resolveRecursiveCommands({
        '\\a': { macro: 'abc' },
        '\\b': { macro: '\\a5' },
        '\\c': { macro: '\\b4' },
      }),
    ).toEqual({
      '\\a': { macro: 'abc' },
      '\\b': { macro: 'abc5' },
      '\\c': { macro: 'abc54' },
    });
  });
  it('similar macro followed by matching macro fills correctly', () => {
    expect(
      resolveRecursiveCommands({
        '\\a': { macro: 'abc' },
        '\\b': { macro: '\\ab\\a' },
      }),
    ).toEqual({
      '\\a': { macro: 'abc' },
      '\\b': { macro: '\\ababc' },
    });
  });
  it('multiple macros fill', () => {
    expect(
      resolveRecursiveCommands({
        '\\a': { macro: '\\abc{}' },
        '\\b': { macro: '\\a5' },
        '\\c': { macro: '\\b4\\b\\a' },
      }),
    ).toEqual({
      '\\a': { macro: '\\abc{}' },
      '\\b': { macro: '\\abc{}5' },
      '\\c': { macro: '\\abc{}54\\abc{}5\\abc{}' },
    });
  });
  it('self-referential macros do not resolve', () => {
    expect(
      resolveRecursiveCommands({
        '\\a': { macro: '\\b' },
        '\\b': { macro: '\\a5' },
      }),
    ).toEqual({
      '\\a': { macro: '\\a5' },
      '\\b': { macro: '\\b5' },
    });
  });
});
