import type { FootnoteDefinition } from 'myst-spec';
import { unified } from 'unified';
import { VFile } from 'vfile';
import { footnotesTransform, footnotesPlugin } from './footnotes';
import type { References } from './types';

describe('Test footnotes plugin', () => {
  test('Pulls out references for footnotes', () => {
    const file = new VFile();
    const node = {
      type: 'footnoteDefinition',
      identifier: 'x',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'test' }] }],
    } as FootnoteDefinition;
    const mdast = { children: [node] } as any;
    const references: Pick<References, 'footnotes'> = { footnotes: {} };
    footnotesTransform(mdast, file, { references });
    expect((node as any).key).toBeTruthy();
    expect((references.footnotes?.['x'] as any).children[0].children[0].value).toBe('test');
  });
  test('Test basic pipeline', () => {
    const file = new VFile();
    const node = {
      type: 'footnoteDefinition',
      identifier: 'x',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'test' }] }],
    } as FootnoteDefinition;
    const mdast = { type: 'root', children: [node] } as any;
    const references: Pick<References, 'footnotes'> = { footnotes: {} };
    unified().use(footnotesPlugin, { references }).runSync(mdast, file);
    expect(file.messages.length).toBe(0);
    expect((node as any).key).toBeTruthy();
    expect((references.footnotes?.['x'] as any).children[0].children[0].value).toBe('test');
  });
});
