import { describe, expect, test } from 'vitest';
import { getCodeBlockOptions, parseTags } from './code.js';
import { VFile } from 'vfile';
import type { DirectiveData, GenericNode } from 'myst-common';

function getCodeBlockOptionsWrap(options: DirectiveData['options'], vfile: VFile) {
  return getCodeBlockOptions({ name: '', options, node: {} as any }, vfile);
}

describe('Code block options', () => {
  test('default options', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptionsWrap({}, vfile);
    expect(opts).toEqual({});
    expect(vfile.messages.length).toEqual(0);
  });
  test('number-lines', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptionsWrap({ 'number-lines': 1 }, vfile);
    expect(opts).toEqual({ showLineNumbers: true });
    expect(vfile.messages.length).toEqual(0);
  });
  test('number-lines: 2', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptionsWrap({ 'number-lines': 2 }, vfile);
    expect(opts).toEqual({ showLineNumbers: true, startingLineNumber: 2 });
    expect(vfile.messages.length).toEqual(0);
  });
  test('number-lines clashes with lineno-start', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptionsWrap({ 'number-lines': 1, 'lineno-start': 2 }, vfile);
    expect(opts).toEqual({ showLineNumbers: true, startingLineNumber: 2 });
    // Show warning!
    expect(vfile.messages.length).toEqual(1);
  });
  test('lineno-start activates showLineNumbers', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptionsWrap({ 'lineno-start': 1 }, vfile);
    expect(opts).toEqual({ showLineNumbers: true });
    expect(vfile.messages.length).toEqual(0);
  });
  test('emphasize-lines', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptionsWrap({ 'emphasize-lines': '3,5' }, vfile);
    expect(opts).toEqual({ emphasizeLines: [3, 5] });
    expect(vfile.messages.length).toEqual(0);
  });
  test.each([
    ['3', [3]],
    ['3,5', [3, 5]],
    ['3-6, 1', [1, 3, 4, 5, 6]],
    ['1-3,5', [1, 2, 3, 5]],
    ['2,4-6', [2, 4, 5, 6]],
    [' 1 - 2 , 4 ', [1, 2, 4]],
    ['3,5,4', [3, 4, 5]], // Out of order is fine
    ['3,,5', [3, 5]], // tolerant to extra comma
    ['3, ', [3]], // tolerant to trailing comma
    ['7-7', [7]], // valid single range
    ['3,3,3-3', [3]], // duplicates removed
    ['1-3,2', [1, 2, 3]], // duplicates removed
  ])('parses emphasize-lines="%s" into %j', (input, expected) => {
    const vfile = new VFile();
    const opts = getCodeBlockOptionsWrap({ 'emphasize-lines': input }, vfile);
    expect(opts).toEqual({ emphasizeLines: expected });
    expect(vfile.messages.length).toEqual(0);
  });
  test.each([
    ['abc'],
    ['one,two'],
    ['1-'],
    ['4--5'],
    ['1-3-5'],
    ['-2'], // Must be positive
    ['6-2'], // must be ascending
    ['5,6-2,7, 2-4', [2, 3, 4, 5, 7]], // Good numbers are still parsed
  ])(
    'invalid emphasize-lines="%s" logs warning and returns empty',
    (input, expected = undefined) => {
      const vfile = new VFile();
      const opts = getCodeBlockOptionsWrap({ 'emphasize-lines': input }, vfile);
      expect(opts).toEqual({ emphasizeLines: expected });
      expect(vfile.messages.length).toBeGreaterThan(0);
      expect(vfile.messages[0].message).toMatch(/Invalid emphasize-lines/i);
    },
  );
  // See https://github.com/jupyter-book/jupyterlab-myst/issues/174
  test(':lineno-start: 10, :emphasize-lines: 12,13', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptionsWrap({ 'lineno-start': 10, 'emphasize-lines': '12,13' }, vfile);
    expect(opts).toEqual({
      showLineNumbers: true,
      emphasizeLines: [12, 13],
      startingLineNumber: 10,
    });
    expect(vfile.messages.length).toEqual(0);
  });
  test.each([
    ['', undefined, 0],
    ['a  ,   b', ['a', 'b'], 0],
    ['  , a  ,   1', ['a', '1'], 0],
    ['[a, b]', ['a', 'b'], 0],
    ['[a, 1]', undefined, 1],
    ['[a, true]', undefined, 1],
    ['[a, yes]', ['a', 'yes'], 0],
    ["[a, '1']", ['a', '1'], 0],
    ['x', ['x'], 0],
    [[' x '], ['x'], 0], // Trimmed
    [[' x ,'], ['x ,'], 0], // Silly, but allowed if it is explicit
    [[1], undefined, 1],
  ])('parseTags(%s) -> %s', (input, output, numErrors) => {
    const vfile = new VFile();
    const tags = parseTags(input, vfile, {} as GenericNode);
    expect(tags).toEqual(output);
    expect(vfile.messages.length).toBe(numErrors);
  });
});
