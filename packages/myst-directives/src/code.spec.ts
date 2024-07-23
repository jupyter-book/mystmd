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
