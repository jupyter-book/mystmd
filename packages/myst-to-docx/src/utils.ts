import type { INumberingOptions, ISectionOptions } from 'docx';
import { Document, Packer, SectionType } from 'docx';
import type { Node as ProsemirrorNode } from 'prosemirror-model';
import type { IFootnotes } from './types';

export function createShortId() {
  return Math.random().toString(36).substr(2, 9);
}

export function createDocFromState(state: {
  numbering: INumberingOptions['config'];
  children: ISectionOptions['children'];
  footnotes?: IFootnotes;
}) {
  const doc = new Document({
    footnotes: state.footnotes,
    numbering: {
      config: state.numbering,
    },
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
        },
        children: state.children,
      },
    ],
  });
  return doc;
}

export async function writeDocx(
  doc: Document,
  write: ((buffer: Buffer) => void) | ((buffer: Buffer) => Promise<void>),
) {
  const buffer = await Packer.toBuffer(doc);
  return write(buffer);
}

export function getLatexFromNode(node: ProsemirrorNode): string {
  let math = '';
  node.forEach((child) => {
    if (child.isText) math += child.text;
    // TODO: improve this as we may have other things in the future
  });
  return math;
}

const DEFAULT_IMAGE_WIDTH = 70;
const DEFAULT_PAGE_WIDTH_PIXELS = 800;
// The docx width is about the page width of 8.5x11
const MAX_DOCX_IMAGE_WIDTH = 600;

export function getImageWidth(width?: number | string, maxWidth = MAX_DOCX_IMAGE_WIDTH): number {
  if (typeof width === 'number' && Number.isNaN(width)) {
    // If it is nan, return with the default.
    return getImageWidth(DEFAULT_IMAGE_WIDTH);
  }
  if (typeof width === 'string') {
    if (width.endsWith('%')) {
      return getImageWidth(Number(width.replace('%', '')));
    } else if (width.endsWith('px')) {
      return getImageWidth(Number(width.replace('px', '')) / DEFAULT_PAGE_WIDTH_PIXELS);
    }
    console.log(`Unknown width ${width} in getImageWidth`);
    return getImageWidth(DEFAULT_IMAGE_WIDTH);
  }
  let lineWidth = width ?? DEFAULT_IMAGE_WIDTH;
  if (lineWidth < 1) lineWidth *= 100;
  if (lineWidth > 100) lineWidth = 100;
  return (lineWidth / 100) * maxWidth;
}
