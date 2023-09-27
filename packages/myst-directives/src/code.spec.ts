import { describe, expect, test } from 'vitest';
import { getCodeBlockOptions } from './code.js';
import { VFile } from 'vfile';

describe('Code block options', () => {
  test('default options', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptions({}, vfile);
    expect(opts).toEqual({});
    expect(vfile.messages.length).toEqual(0);
  });
  test('number-lines', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptions({ 'number-lines': 1 }, vfile);
    expect(opts).toEqual({ showLineNumbers: true });
    expect(vfile.messages.length).toEqual(0);
  });
  test('number-lines: 2', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptions({ 'number-lines': 2 }, vfile);
    expect(opts).toEqual({ showLineNumbers: true, startingLineNumber: 2 });
    expect(vfile.messages.length).toEqual(0);
  });
  test('number-lines clashes with lineno-start', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptions({ 'number-lines': 1, 'lineno-start': 2 }, vfile);
    expect(opts).toEqual({ showLineNumbers: true, startingLineNumber: 2 });
    // Show warning!
    expect(vfile.messages.length).toEqual(1);
  });
  test('lineno-start activates showLineNumbers', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptions({ 'lineno-start': 1 }, vfile);
    expect(opts).toEqual({ showLineNumbers: true });
    expect(vfile.messages.length).toEqual(0);
  });
  test('emphasize-lines', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptions({ 'emphasize-lines': '3,5' }, vfile);
    expect(opts).toEqual({ emphasizeLines: [3, 5] });
    expect(vfile.messages.length).toEqual(0);
  });
  // See https://github.com/executablebooks/jupyterlab-myst/issues/174
  test(':lineno-start: 10, :emphasize-lines: 12,13', () => {
    const vfile = new VFile();
    const opts = getCodeBlockOptions({ 'lineno-start': 10, 'emphasize-lines': '12,13' }, vfile);
    expect(opts).toEqual({
      showLineNumbers: true,
      emphasizeLines: [12, 13],
      startingLineNumber: 10,
    });
    expect(vfile.messages.length).toEqual(0);
  });
});
