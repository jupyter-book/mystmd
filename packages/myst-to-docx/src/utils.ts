import type { INumberingOptions, ISectionOptions, ParagraphChild } from 'docx';
import {
  InternalHyperlink,
  SimpleField,
  Bookmark,
  SequentialIdentifier,
  TextRun,
  Document,
  Packer,
  SectionType,
} from 'docx';
import { Buffer } from 'buffer'; // Important for frontend development!
import type { Root } from 'mdast';
import type { Image as MdastImage } from 'myst-spec';
import type { Node as ProsemirrorNode } from 'prosemirror-model';
import type { IFootnotes, Options } from './types';
import { selectAll } from 'unist-util-select';

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
export const MAX_DOCX_IMAGE_WIDTH = 600;

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

async function getImageDimensions(file: Blob | Buffer): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // the following handler will fire after a successful loading of the image
    img.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = img;
      resolve({ width, height });
    };
    // and this handler will fire if there was an error with the image (like if it's not really an image or a corrupted one)
    img.onerror = () => {
      reject('There was some problem with the image.');
    };
    img.src = URL.createObjectURL(file as Blob);
  });
}

/**
 * For frontend development, fetch images as Blobs, get their dimensions and
 * return options for the docx serializer.
 *
 * @param tree the mdast document
 * @returns options for the serializer
 */
export async function fetchImagesAsBuffers(
  tree: Root,
): Promise<Required<Pick<Options, 'getImageBuffer' | 'getImageDimensions'>>> {
  const images = selectAll('image', tree) as MdastImage[];
  const buffers: Record<string, Buffer> = {};
  const dimensions: Record<string, { width: number; height: number }> = {};
  await Promise.all(
    images.map(async (image) => {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const buffer = await blob.arrayBuffer();
      dimensions[image.url] = await getImageDimensions(blob);
      buffers[image.url] = Buffer.from(buffer);
    }),
  );
  return {
    getImageBuffer(url: string) {
      return buffers[url];
    },
    getImageDimensions(url: string) {
      return dimensions[url];
    },
  };
}

export function createReferenceBookmark(
  id: string,
  kind: 'Equation' | 'Figure' | 'Table',
  before?: string,
  after?: string,
) {
  const textBefore = before ? [new TextRun(before)] : [];
  const textAfter = after ? [new TextRun(after)] : [];
  return new Bookmark({
    id,
    children: [...textBefore, new SequentialIdentifier(kind), ...textAfter],
  });
}

export function createReference(id: string, before?: string, after?: string) {
  const children: ParagraphChild[] = [];
  if (before) children.push(new TextRun(before));
  children.push(new SimpleField(`REF ${id} \\h`));
  if (after) children.push(new TextRun(after));
  const ref = new InternalHyperlink({ anchor: id, children });
  return ref;
}
