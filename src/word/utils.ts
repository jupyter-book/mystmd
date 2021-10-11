import fetch from 'node-fetch';
import { VersionId, KINDS, oxaLinkToId, oxaLink, Blocks } from '@curvenote/blocks';
import { Document, INumberingOptions, ISectionOptions, SectionType } from 'docx';
import { IPropertiesOptions } from 'docx/build/file/core-properties';
import { nodeNames, Nodes } from '@curvenote/schema';
import { Session } from '../session';
import { getEditorState } from '../actions/utils';
import { Version } from '../models';
import { createCurvenoteFooter } from './footers';

type ArticleState = {
  states: (ReturnType<typeof getEditorState> | null)[];
  images: Record<string, Version>;
};

export async function walkArticle(session: Session, data: Blocks.Article) {
  const images: ArticleState['images'] = {};

  const states = await Promise.all(
    data.order.map(async (k) => {
      const srcId = data.children[k]?.src;
      if (!srcId) return null;
      const child = await new Version(session, srcId).get();
      switch (child.data.kind) {
        case KINDS.Content: {
          const state = getEditorState(child.data.content);
          state.doc.descendants((node) => {
            switch (node.type.name) {
              case nodeNames.image: {
                const { src } = node.attrs as Nodes.Image.Attrs;
                const id = oxaLinkToId(src)?.block as VersionId;
                if (id) images[src] = new Version(session, id);
                break;
              }
              default:
                break;
            }
          });
          return state;
        }
        case KINDS.Image: {
          const state = getEditorState(child.data.caption ?? '', 'paragraph');
          const key = oxaLink('', child.id);
          if (key) images[key] = child;
          return state;
        }
        default:
          return null;
      }
    }),
  );

  return {
    states,
    images,
  };
}

export async function loadImagesToBuffers(article: ArticleState) {
  const buffers: Record<string, Buffer> = {};

  await Promise.all(
    Object.entries(article.images).map(async ([key, image]) => {
      await image.get();
      if (image.data.kind !== KINDS.Image) return;
      const response = await fetch(image.data.links.download);
      const buffer = await response.buffer();
      buffers[key] = buffer;
    }),
  );
  return buffers;
}

export function createSingleDocument(
  state: {
    numbering: INumberingOptions['config'];
    children: ISectionOptions['children'];
  },
  opts?: Omit<IPropertiesOptions, 'sections'>,
) {
  const doc = new Document({
    ...opts,
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
  });
  return doc;
}
