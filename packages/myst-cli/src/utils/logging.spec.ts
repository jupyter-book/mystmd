import { describe, expect, it } from 'vitest';
import { VFile } from 'vfile';
import { fileError, fileInfo, fileWarn } from 'myst-common';
import { messageKind, messagePosition } from './logging';

const position = { start: { line: 2, column: 3 }, end: { line: 2, column: 8 } };

describe('messageKind', () => {
  it('classifies info, warnings and errors', () => {
    const file = new VFile();
    expect(messageKind(fileInfo(file, 'info'))).toBe('info');
    expect(messageKind(fileWarn(file, 'warn'))).toBe('warn');
    expect(messageKind(fileError(file, 'error'))).toBe('error');
  });
});

describe('messagePosition', () => {
  it('uses the position of a node', () => {
    const message = fileWarn(new VFile(), 'warn', { node: { type: 'text', position } });
    expect(messagePosition(message)).toEqual(position);
  });
  it('expands a point to a position', () => {
    const message = new VFile().message('warn', { line: 4, column: 1 });
    expect(messagePosition(message)).toEqual({
      start: { line: 4, column: 1 },
      end: { line: 4, column: 1 },
    });
  });
  it('is undefined without a place', () => {
    expect(messagePosition(fileWarn(new VFile(), 'warn'))).toBeUndefined();
  });
});
