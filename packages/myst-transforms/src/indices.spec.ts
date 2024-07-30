import { describe, expect, test } from 'vitest';
import { indexIdentifierTransform } from './indices';

describe('Test indexEntry plugin', () => {
  test('adds label/identifier/html_id to indexEntries', () => {
    const mdast = {
      children: [
        { type: 'node', label: 'just-a-label' },
        { type: 'node', indexEntries: [] },
      ],
    } as any;
    indexIdentifierTransform(mdast);
    expect(mdast.children[0].identifier).toBe(undefined);
    expect(mdast.children[1].label).toBeTruthy();
    expect(mdast.children[1].identifier).toBeTruthy();
    expect(mdast.children[1].html_id).toBeTruthy();
  });
});
