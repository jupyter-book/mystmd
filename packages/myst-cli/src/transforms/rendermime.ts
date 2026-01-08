import type { GenericParent } from 'myst-common';

import type { VFile } from 'vfile';
import type { IMimeBundle, MultilineString } from '@jupyterlab/nbformat';
import { TexParser } from 'tex-to-myst';
import { BASE64_HEADER_SPLIT } from './images.js';
import type { FlowContent, PhrasingContent } from 'myst-spec';
import { migrate } from 'myst-migrate';
import { SPEC_VERSION } from '../spec-version.js';

function stripTextQuotes(content: string) {
  return content.replace(/^(["'])(.*)\1$/, '$2');
}

/*
 * Pull out PhrasingContent children
 */
function singleParagraphChildren(parents: GenericParent[]) {
  if (parents.length === 1 && parents[0].type === 'paragraph') {
    return parents[0].children as PhrasingContent[];
  } else {
    return [];
  }
}

export type MystParser = (source: string) => GenericParent;

interface MimeRendererMetadata {}

export abstract class MimeRenderer {
  abstract pattern: RegExp;

  renders(contentTypes: string[]): string | undefined {
    return contentTypes.find((contentType) => this.pattern.test(contentType));
  }

  abstract renderPhrasing(
    contentType: string,
    content: IMimeBundle[keyof IMimeBundle],
    vfile: VFile,
    parseMyst: MystParser,
    opts: MimeRendererMetadata,
  ): Promise<PhrasingContent[]>;

  abstract renderBlock(
    contentType: string,
    content: IMimeBundle[keyof IMimeBundle],
    vfile: VFile,
    parseMyst: MystParser,
    opts: MimeRendererMetadata,
  ): Promise<FlowContent[]>;
}

function ensureString(content: MultilineString) {
  if (typeof content === 'string') {
    return content;
  } else {
    return content.join('');
  }
}

export class MarkdownRenderer extends MimeRenderer {
  pattern = /^text\/markdown\b/;

  async renderBlock(_1: string, value: MultilineString, _2: VFile, parseMyst: MystParser) {
    const root = parseMyst(ensureString(value as any));
    return root.children as FlowContent[];
  }
  async renderPhrasing(
    contentType: string,
    value: MultilineString,
    vfile: VFile,
    parseMyst: MystParser,
  ) {
    const blocks = await this.renderBlock(contentType, value, vfile, parseMyst);
    // Expect that we only have paragraphs here
    return singleParagraphChildren(blocks as GenericParent[]);
  }
}

// TODO: if not parsing LaTeX, output raw nodes
interface MimeRendererMetadata {
  'parse-latex'?: boolean;
}

export class LaTeXRenderer extends MimeRenderer {
  pattern = /^text\/latex\b/;

  async renderBlock(_1: string, value: MultilineString, vfile: VFile) {
    const parser = new TexParser(value as string, vfile);
    const root = parser.ast as GenericParent;
    return root.children as FlowContent[];
  }
  async renderPhrasing(contentType: string, value: MultilineString, vfile: VFile) {
    const blocks = await this.renderBlock(contentType, value, vfile);
    return singleParagraphChildren(blocks as GenericParent[]);
  }
}

// TODO: handle this by tagging HTML nodes?
interface MimeRendererMetadata {
  'parse-html'?: boolean;
}
/*
 * Renderer for HTML content
 *
 * We can parse HTML as MyST AST, but this is a secondary transform.
 * As such, we probably should not treat this as a core part of the execution transforms.
 * This decision is reasonable because HTML to MyST likely shouldn't pull in referenceable content.
 * If it needs to, it's likely a content-author level decision.
 */
export class HTMLRenderer extends MimeRenderer {
  pattern = /^text\/html$/;

  async renderBlock(_1: string, value: MultilineString) {
    const result: FlowContent[] = [
      {
        type: 'html',
        value: ensureString(value),
      },
    ];
    return result;
  }
  async renderPhrasing(_1: string, value: MultilineString) {
    const result: PhrasingContent[] = [
      {
        type: 'html',
        value: ensureString(value),
      },
    ];
    return result;
  }
}

export class ImageRenderer extends MimeRenderer {
  pattern = /^image\//;

  async renderBlock(contentType: string, value: MultilineString) {
    const phrasingNodes = await this.renderPhrasing(contentType, value);
    const result: FlowContent[] = [{ type: 'paragraph', children: phrasingNodes }];
    return result;
  }
  async renderPhrasing(contentType: string, value: MultilineString) {
    const result: PhrasingContent[] = [
      {
        type: 'image',
        url: `data:${contentType}${BASE64_HEADER_SPLIT}${value}`,
      },
    ];
    return result;
  }
}

interface MimeRendererMetadata {
  'strip-quotes'?: boolean;
}
export class TextRenderer extends MimeRenderer {
  pattern = /^text\/plain$/;

  async renderBlock(
    contentType: string,
    value: MultilineString,
    vfile: VFile,
    parseMyst: MystParser,
    opts: MimeRendererMetadata,
  ) {
    const phrasingNodes = await this.renderPhrasing(contentType, value, vfile, parseMyst, opts);
    const result: FlowContent[] = [{ type: 'paragraph', children: phrasingNodes }];
    return result;
  }
  async renderPhrasing(
    _1: string,
    value: MultilineString,
    _2: VFile,
    _3: MystParser,
    opts: MimeRendererMetadata,
  ) {
    const content = ensureString(value);
    const result: PhrasingContent[] = [
      {
        type: 'text',
        value: opts['strip-quotes'] === false ? content : stripTextQuotes(content),
      },
    ];
    return result;
  }
}

export class ASTRenderer extends MimeRenderer {
  pattern = /^application\/vnd\.mystmd\.ast\+json\b/;

  async renderBlock(
    contentType: string,
    value: Record<string, any>,
    _1: VFile,
    _2: MystParser,
    _3: MimeRendererMetadata,
  ) {
    let match;
    let version: number;
    if ((match = contentType.match(/;version=(\d+)$/))) {
      version = parseInt(match[1]);
    } else {
      version = SPEC_VERSION;
    }
    const validFile = await migrate(
      { mdast: value as GenericParent, version: version },
      { to: SPEC_VERSION },
    );
    return validFile.mdast.children as FlowContent[];
  }
  async renderPhrasing(
    contentType: string,
    value: Record<string, any>,
    vfile: VFile,
    parseMyst: MystParser,
    opts: MimeRendererMetadata,
  ) {
    return singleParagraphChildren(
      (await this.renderBlock(contentType, value, vfile, parseMyst, opts)) as GenericParent[],
    );
  }
}

export const MIME_RENDERERS: MimeRenderer[] = [
  new ASTRenderer(),
  new MarkdownRenderer(),
  new LaTeXRenderer(),
  new ImageRenderer(),
  new HTMLRenderer(),
  new TextRenderer(),
];
export type { MimeRendererMetadata };
