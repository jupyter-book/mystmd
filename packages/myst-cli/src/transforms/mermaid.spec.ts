import { describe, it, expect } from 'vitest';
import { VFile } from 'vfile';
import type { GenericParent } from 'myst-common';
import { mermaidTransform, renderMermaidDiagram } from './mermaid.js';

// Real tests that actually execute the Mermaid CLI
describe('mermaid transform - real CLI tests', () => {
  describe('renderMermaidDiagram - real CLI execution', () => {
    it('should render simple flowchart to base64 SVG', async () => {
      const file = new VFile();
      const mermaidNode = {
        type: 'mermaid' as const,
        value: 'flowchart LR\n  A --> B',
        identifier: 'test-diagram',
      };

      const result = await renderMermaidDiagram(file, mermaidNode);

      expect(result.type).toBe('image');
      if (result.type === 'image') {
        expect(result.url).toMatch(/^data:image\/svg\+xml;base64,/);
        expect(result.alt).toBe('Mermaid diagram: flowchart LR');
        expect(result.title).toBe('Mermaid diagram');
        expect(result.identifier).toBe('test-diagram');

        // Decode and verify SVG content
        const base64Content = result.url.replace('data:image/svg+xml;base64,', '');
        const svgContent = Buffer.from(base64Content, 'base64').toString('utf-8');

        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('A');
        expect(svgContent).toContain('B');

        // console.log('Generated SVG preview:', svgContent.substring(0, 200) + '...');
      }
    });

    it('should render complex diagram with decision nodes', async () => {
      const file = new VFile();
      const mermaidNode = {
        type: 'mermaid' as const,
        value: `graph TD
  A[Start] --> B{Decision}
  B -->|Yes| C[OK]
  B -->|No| D[Cancel]`,
        identifier: 'complex-diagram',
      };

      const result = await renderMermaidDiagram(file, mermaidNode);

      expect(result.type).toBe('image');
      if (result.type === 'image') {
        const base64Content = result.url.replace('data:image/svg+xml;base64,', '');
        const svgContent = Buffer.from(base64Content, 'base64').toString('utf-8');

        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('Start');
        expect(svgContent).toContain('Decision');
        expect(svgContent).toContain('OK');
        expect(svgContent).toContain('Cancel');

        // console.log('Complex diagram SVG preview:', svgContent.substring(0, 200) + '...');
      }
    });

    it('should render sequence diagram', async () => {
      const file = new VFile();
      const mermaidNode = {
        type: 'mermaid' as const,
        value: `sequenceDiagram
  participant Alice
  participant Bob
  Alice->>John: Hello John, how are you?
  loop Healthcheck
    John->>John: Fight against hypochondria
  end`,
        identifier: 'sequence-diagram',
      };

      const result = await renderMermaidDiagram(file, mermaidNode);

      expect(result.type).toBe('image');
      if (result.type === 'image') {
        const base64Content = result.url.replace('data:image/svg+xml;base64,', '');
        const svgContent = Buffer.from(base64Content, 'base64').toString('utf-8');

        expect(svgContent).toContain('<svg');
        expect(svgContent).toContain('Alice');
        expect(svgContent).toContain('Bob');
        expect(svgContent).toContain('John');

        // console.log('Sequence diagram SVG preview:', svgContent.substring(0, 200) + '...');
      }
    });

    it('should preserve node metadata in image output', async () => {
      const file = new VFile();
      const mermaidNode = {
        type: 'mermaid' as const,
        value: 'flowchart LR\n  A --> B',
        identifier: 'preserved-id',
        label: 'preserved-label',
        html_id: 'preserved-html-id',
      };

      const result = await renderMermaidDiagram(file, mermaidNode);

      expect(result.type).toBe('image');
      if (result.type === 'image') {
        expect(result.identifier).toBe('preserved-id');
        expect(result.label).toBe('preserved-label');
        expect(result.html_id).toBe('preserved-html-id');
      }
    });
  });

  describe('mermaidTransform - real tree transformation', () => {
    it('should transform all mermaid nodes in a tree', async () => {
      const file = new VFile();
      const tree: GenericParent = {
        type: 'root',
        children: [
          {
            type: 'mermaid',
            value: 'flowchart LR\n  A --> B',
            identifier: 'diagram1',
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', value: 'Some text' }],
          },
          {
            type: 'mermaid',
            value: 'graph TD\n  A --> B --> C',
            identifier: 'diagram2',
          },
        ],
      };

      await mermaidTransform(tree, file);

      expect(tree.children[0].type).toBe('image');
      if (tree.children[0].type === 'image') {
        expect(tree.children[0].url).toMatch(/^data:image\/svg\+xml;base64,/);
        expect(tree.children[0].identifier).toBe('diagram1');
      }

      expect(tree.children[1].type).toBe('paragraph'); // Should remain unchanged

      expect(tree.children[2].type).toBe('image');
      if (tree.children[2].type === 'image') {
        expect(tree.children[2].url).toMatch(/^data:image\/svg\+xml;base64,/);
        expect(tree.children[2].identifier).toBe('diagram2');
      }
    });
  });

  describe('base64 validation - real SVG content', () => {
    it('should produce valid base64 data URLs with real SVG content', async () => {
      const file = new VFile();
      const mermaidNode = {
        type: 'mermaid' as const,
        value: 'flowchart LR\n  A --> B',
      };

      const result = await renderMermaidDiagram(file, mermaidNode);

      expect(result.type).toBe('image');
      if (result.type === 'image') {
        expect(result.url).toMatch(/^data:image\/svg\+xml;base64,/);

        // Verify the base64 content can be decoded
        const base64Content = result.url.replace('data:image/svg+xml;base64,', '');
        const decodedSvg = Buffer.from(base64Content, 'base64').toString('utf-8');

        expect(decodedSvg).toContain('<svg');
        expect(decodedSvg).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(decodedSvg).toContain('A');
        expect(decodedSvg).toContain('B');

        // Log the actual SVG content for inspection
        // console.log('Real SVG content length:', decodedSvg.length);
        // console.log('Real SVG preview:', decodedSvg.substring(0, 500) + '...');
      }
    });
  });
});
