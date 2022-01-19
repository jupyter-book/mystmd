import { Document, SectionType } from 'docx';
import { IPropertiesOptions } from 'docx/build/file/core-properties';
import { DocxSerializerState } from 'prosemirror-docx';
import { createCurvenoteFooter } from './footers';

export function createSingleDocument(
  state: DocxSerializerState,
  opts?: Omit<IPropertiesOptions, 'sections'>,
) {
  const doc = new Document({
    ...opts,
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
        footers: {
          default: createCurvenoteFooter(),
        },
      },
    ],
    features: {
      updateFields: true,
    },
  });
  return doc;
}

export function getDefaultSerializerOptions(buffers: Record<string, Buffer>) {
  return {
    getImageBuffer(key: string) {
      if (!buffers[key]) throw new Error('Could not decode image from oxa link');
      return buffers[key];
    },
  };
}
