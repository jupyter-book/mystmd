import { describe, expect, it } from 'vitest';
import { unified } from 'unified';
import { VFile } from 'vfile';
import mystToTypst from './index';
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

describe('math conversion', () => {
  it('should not produce label(...) inside math', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'math',
          value: '\\begin{equation}\n\\label{eq:1}\na=b\n\\end{equation}',
        },
      ],
    };
    const file = new VFile();
    const processor = unified().use(mystToTypst);
    const result = (processor.freeze().Compiler as any)(tree, file).result;
    expect(result.value).not.toContain('label(');
    expect(result.value.trim()).toBe('$ a = b $ <eq:1>');
  });

  it('should handle label correctly if provided in node', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'math',
          value: 'a=b',
          label: 'eq:1',
          identifier: 'eq-1',
        },
      ],
    };
    const file = new VFile();
    const processor = unified().use(mystToTypst);
    const result = (processor.freeze().Compiler as any)(tree, file).result;
    expect(result.value.trim()).toBe('$ a = b $ <eq:1>');
  });

  it('should strip begin/end equation', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'math',
          value: '\\begin{equation*}\na=b\n\\end{equation*}',
        },
      ],
    };
    const file = new VFile();
    const processor = unified().use(mystToTypst);
    const result = (processor.freeze().Compiler as any)(tree, file).result;
    expect(result.value).not.toContain('begin{equation*}');
    expect(result.value.trim()).toBe('$ a = b $');
  });

  it('should fix issue #2876: \\left|a\\right|', () => {
    const tree = {
      type: 'root',
      children: [
        {
          type: 'math',
          value: '\\dfrac{\\left|a\\right|}{b}',
        },
      ],
    };
    const file = new VFile();
    const processor = unified().use(mystToTypst);
    const result = (processor.freeze().Compiler as any)(tree, file).result;
    expect(result.value.trim()).toBe('$ frac(| a |, b) $');
  });
});
