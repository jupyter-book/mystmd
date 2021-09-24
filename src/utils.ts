import { Document, Packer } from 'docx';
import { Node as ProsemirrorNode } from 'prosemirror-model';

export function createShortId() {
  return Math.random().toString(36).substr(2, 9);
}

export function writeDocx(doc: Document, write: (buffer: Buffer) => void) {
  Packer.toBuffer(doc).then(write);
}

export function getLatexFromNode(node: ProsemirrorNode): string {
  let math = '';
  node.forEach((child) => {
    if (child.isText) math += child.text;
    // TODO: improve this as we may have other things in the future
  });
  return math;
}
