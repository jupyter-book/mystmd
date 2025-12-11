import { describe, expect, test } from 'vitest';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { joinGatesPlugin } from './joinGates';

describe('Test gate directive joining', () => {
  test('Test basic gate', () => {
    const file = new VFile();
    const open = { type: 'node', gate: 'start' } as any;
    const paragraph = { type: 'paragraph' } as any;
    const close = { type: 'node', gate: 'end' } as any;
    const mdast = { type: 'root', children: [open, paragraph, close] } as any;
    unified().use(joinGatesPlugin).runSync(mdast, file);
    expect(file.messages.length).toBe(0);
    expect(open.gate).toBeUndefined();
    expect(mdast.children.length).toBe(1);
    expect(open.children[0]).toBe(paragraph);
  });
  test('Test mismatch gate', () => {
    const file = new VFile();
    const open = { type: 'node', gate: 'start' } as any;
    const paragraph = { type: 'paragraph' } as any;
    const close = { type: 'not-the-same-node', gate: 'end' } as any;
    const mdast = { type: 'root', children: [open, paragraph, close] } as any;
    unified().use(joinGatesPlugin).runSync(mdast, file);
    expect(file.messages.length).toBe(1); // Raise warning
    expect(open.gate).toBeUndefined();
    expect(mdast.children.length).toBe(1);
    expect(open.children[0]).toBe(paragraph);
  });
  test('Test gate without end', () => {
    const file = new VFile();
    const open = { type: 'node', gate: 'start' } as any;
    const paragraph = { type: 'paragraph' } as any;
    const mdast = { type: 'root', children: [open, paragraph] } as any;
    unified().use(joinGatesPlugin).runSync(mdast, file);
    expect(file.messages.length).toBe(1); // Raise error
    expect(open.gate).toBe('start');
    expect(mdast.children.length).toBe(1);
    expect(open.children[0]).toBe(paragraph);
  });
  test('Test nested gates', () => {
    const file = new VFile();
    const open = { type: 'node', gate: 'start' } as any;
    const open2 = { type: 'node', gate: 'start' } as any;
    const paragraph = { type: 'paragraph' } as any;
    const close = { type: 'node', gate: 'end' } as any;
    const close2 = { type: 'node', gate: 'end' } as any;
    const mdast = { type: 'root', children: [open, open2, paragraph, close, close2] } as any;
    unified().use(joinGatesPlugin).runSync(mdast, file);
    expect(file.messages.length).toBe(0);
    expect(open.gate).toBeUndefined();
    expect(mdast.children.length).toBe(1);
    expect(open.children[0]).toBe(open2);
    expect(open2.children[0]).toBe(paragraph);
  });
});
