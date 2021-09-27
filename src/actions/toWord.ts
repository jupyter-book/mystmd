import * as fs from 'fs';
import fetch from 'node-fetch';
import { VersionId, KINDS, oxaLinkToId, oxaLink } from '@curvenote/blocks';
import {
  defaultNodes,
  defaultMarks,
  DocxSerializerState,
  createDocFromState,
  writeDocx,
} from 'prosemirror-docx';
import { nodeNames, Nodes } from '@curvenote/schema';
import { Block, Version } from '../models';
import { Session } from '../session';
import { getChildren } from './getChildren';
import { getEditorState } from './utils';

export async function articleToWord(session: Session, versionId: VersionId) {
  await getChildren(session, versionId);
  const block = await new Block(session, versionId).get();
  const version = await new Version(session, versionId).get();
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');

  const images: Record<string, Version> = {};

  const states = await Promise.all(
    data.order.map(async (k) => {
      const srcId = data.children[k]?.src;
      if (!srcId) return '';
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

  const buffers: Record<string, Buffer> = {};

  await Promise.all(
    Object.entries(images).map(async ([key, image]) => {
      await image.get();
      if (image.data.kind !== KINDS.Image) return;
      const response = await fetch(image.data.links.download);
      const buffer = await response.buffer();
      buffers[key] = buffer;
    }),
  );

  const nodes = {
    ...defaultNodes,
    aside: defaultNodes.blockquote,
    callout: defaultNodes.blockquote,
  };

  const opts = {
    getImageBuffer(key: string) {
      if (!buffers[key]) throw new Error('Could not decode image from oxa link');
      return buffers[key];
    },
  };

  const docxState = new DocxSerializerState(nodes, defaultMarks, opts);
  states.forEach((state) => {
    if (!state) return;
    docxState.renderContent(state.doc);
  });

  const doc = createDocFromState(docxState);
  writeDocx(doc, (buffer) => {
    fs.writeFileSync(`hello.docx`, buffer);
  });
}
