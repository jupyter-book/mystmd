import type { GenericParent } from 'myst-common';

import type { VFile } from 'vfile';
import type { IMimeBundle } from '@jupyterlab/nbformat';
import { TexParser } from 'tex-to-myst';
import { BASE64_HEADER_SPLIT } from './images.js';
import type { FlowContent, PhrasingContent } from 'myst-spec';

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

export type MimeRendererOptions = {
  stripQuotes: boolean;
};

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
    opts: MimeRendererOptions,
  ): PhrasingContent[];

  abstract renderBlock(
    contentType: string,
    content: IMimeBundle[keyof IMimeBundle],
    vfile: VFile,
    parseMyst: MystParser,
    opts: MimeRendererOptions,
  ): FlowContent[];
}

export class MarkdownRenderer extends MimeRenderer {
  pattern = /^text\/markdown\b/;

  renderBlock(_1: string, value: string, _2: VFile, parseMyst: MystParser) {
    const root = parseMyst(value as string);
    return root.children as FlowContent[];
  }
  renderPhrasing(contentType: string, value: string, vfile: VFile, parseMyst: MystParser) {
    const blocks = this.renderBlock(contentType, value, vfile, parseMyst);
    // Expect that we only have paragraphs here
    return singleParagraphChildren(blocks as GenericParent[]);
  }
}
export class LaTeXRenderer extends MimeRenderer {
  pattern = /^text\/latex\b/;

  renderBlock(_1: string, value: string, vfile: VFile) {
    const parser = new TexParser(value as string, vfile);
    const root = parser.ast as GenericParent;
    return root.children as FlowContent[];
  }
  renderPhrasing(contentType: string, value: string, vfile: VFile) {
    const blocks = this.renderBlock(contentType, value, vfile);
    return singleParagraphChildren(blocks as GenericParent[]);
  }
}
export class HTMLRenderer extends MimeRenderer {
  pattern = /^text\/html$/;

  renderBlock(_1: string, value: string) {
    return [
      {
        type: 'html',
        value,
      },
    ] as FlowContent[];
  }
  renderPhrasing(_1: string, value: string) {
    return [
      {
        type: 'html',
        value,
      },
    ] as PhrasingContent[];
  }
}

export class ImageRenderer extends MimeRenderer {
  pattern = /^image\//;

  renderBlock(contentType: string, value: string) {
    const phrasingNodes = this.renderPhrasing(contentType, value);
    return [{ type: 'paragraph', children: phrasingNodes }] as FlowContent[];
  }
  renderPhrasing(contentType: string, value: string) {
    return [
      {
        type: 'image',
        url: `data:${contentType}${BASE64_HEADER_SPLIT}${value}`,
      },
    ] as PhrasingContent[];
  }
}

export class TextRenderer extends MimeRenderer {
  pattern = /^text\/plain$/;

  renderBlock(
    contentType: string,
    value: string,
    vfile: VFile,
    parseMyst: MystParser,
    opts: MimeRendererOptions,
  ) {
    const phrasingNodes = this.renderPhrasing(contentType, value, vfile, parseMyst, opts);
    return [{ type: 'paragraph', children: phrasingNodes }] as FlowContent[];
  }
  renderPhrasing(_1: string, value: string, _2: VFile, _3: MystParser, opts: MimeRendererOptions) {
    return [
      {
        type: 'text',
        value: opts.stripQuotes ? stripTextQuotes(value) : value,
      },
    ] as PhrasingContent[];
  }
}

export const MIME_RENDERERS: MimeRenderer[] = [
  new MarkdownRenderer(),
  new LaTeXRenderer(),
  new ImageRenderer(),
  new HTMLRenderer(),
  new TextRenderer(),
];
