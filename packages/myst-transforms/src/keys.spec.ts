import { describe, expect, test } from 'vitest';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { keysTransform, keysPlugin } from './keys';

describe('Test keys plugin', () => {
  test('Assigns a key', () => {
    const node = { type: 'node' } as any;
    const mdast = { children: [node] } as any;
    keysTransform(mdast);
    expect(node.key).toBeTruthy();
    // Starts with a lowercase letter to pass ID validation
    expect((node.key as string).match(/^[a-zA-Z]/)).toBeTruthy();
  });
  test('Test basic pipeline', () => {
    const file = new VFile();
    const node = { type: 'node' } as any;
    const mdast = { type: 'root', children: [node] } as any;
    unified().use(keysPlugin).runSync(mdast, file);
    expect(file.messages.length).toBe(0);
    expect(node.key).toBeTruthy();
    // Starts with a lowercase letter to pass ID validation
    expect((node.key as string).match(/^[a-zA-Z]/)).toBeTruthy();
  });
});
