import AdmZip from 'adm-zip';
import { Packer } from 'docx';
import type { GenericParent } from 'myst-common';
import type { RendererDoc } from 'myst-templates';
import { SourceFileKind } from 'myst-spec-ext';
import { describe, expect, it } from 'vitest';
import { VFile } from 'vfile';
import { castSession } from '../../session/cache.js';
import { Session } from '../../session/index.js';
import type { DocxRendererData } from '../types.js';
import { defaultWordRenderer, extractDocxParts } from './single.js';

describe('DOCX parts', () => {
  it('extracts resolved frontmatter and template parts', () => {
    const session = new Session();
    const abstractFile = '/abstract.md';
    const abstractMdast: GenericParent = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'An abstract.' }] }],
    };
    castSession(session).$setMdast(abstractFile, {
      pre: {
        file: abstractFile,
        location: '',
        kind: SourceFileKind.Part,
        mdast: abstractMdast,
        frontmatter: {},
      },
      post: {
        file: abstractFile,
        location: '',
        kind: SourceFileKind.Part,
        mdast: abstractMdast,
        frontmatter: {},
        sha256: '',
        references: {},
        dependencies: [],
      },
    });
    const mdast: GenericParent = {
      type: 'root',
      children: [
        {
          type: 'block',
          data: { part: 'custom' },
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Custom content.' }] }],
        },
        { type: 'paragraph', children: [{ type: 'text', value: 'Article body.' }] },
      ],
    };

    const parts = extractDocxParts(session, mdast, { parts: { abstract: [abstractFile] } }, [
      { id: 'custom' },
    ]);

    expect(Object.keys(parts)).toEqual(['custom', 'abstract']);
    expect(parts.abstract.definition.title).toBe('Abstract');
    expect(mdast.children).toEqual([
      { type: 'paragraph', children: [{ type: 'text', value: 'Article body.' }] },
    ]);
  });

  it('renders frontmatter before the body and backmatter after it', async () => {
    const data = {
      mdast: {
        type: 'root',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Article body.' }] }],
      },
      frontmatter: { title: 'Test article' },
      references: {},
      parts: {
        abstract: {
          definition: { id: 'abstract', title: 'Abstract' },
          mdast: {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'An abstract.' }] }],
          },
        },
        acknowledgments: {
          definition: { id: 'acknowledgments', title: 'Acknowledgments' },
          mdast: {
            type: 'root',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Thanks.' }] }],
          },
        },
      },
    } as DocxRendererData;
    const doc = defaultWordRenderer(
      new Session(),
      data,
      { title: 'Test article', authors: [], affiliations: [], collaborations: [] } as RendererDoc,
      {},
      '',
      new VFile(),
    );

    const buffer = await Packer.toBuffer(doc);
    const xml = new AdmZip(buffer).readAsText('word/document.xml');

    expect(xml.indexOf('An abstract.')).toBeLessThan(xml.indexOf('Article body.'));
    expect(xml.indexOf('Thanks.')).toBeGreaterThan(xml.indexOf('Article body.'));
  });
});
