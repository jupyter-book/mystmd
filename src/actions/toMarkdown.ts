import { VersionId, KINDS, oxaLink, formatDate } from '@curvenote/blocks';
import { toMarkdown } from '@curvenote/schema';

import { Block, Version } from '../models';
import { Session } from '../session';
import { getChildren } from './getChildren';
import { getEditorState } from './utils';

export async function articleToMarkdown(session: Session, versionId: VersionId) {
  await getChildren(session, versionId);
  const block = await new Block(session, versionId).get();
  const version = await new Version(session, versionId).get();
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');
  const content = await Promise.all(
    data.order.map(async (k) => {
      const srcId = data.children[k]?.src;
      if (!srcId) return '';
      const child = await new Version(session, srcId).get();
      const blockString = `+++ ${oxaLink('', srcId, { pinned: false })}\n\n`;
      switch (child.data.kind) {
        case KINDS.Content: {
          const state = getEditorState(child.data.content);
          return blockString + toMarkdown(state.doc);
        }
        case KINDS.Image: {
          const state = getEditorState(child.data.caption ?? '', 'paragraph');
          return blockString + toMarkdown(state.doc);
        }
        default:
          return '';
      }
    }),
  );
  const metadata = Object.entries({
    title: block.data.title,
    description: block.data.description,
    date: formatDate(data.date),
    author: block.data.authors[0].user,
    name: block.data.name,
  }).map(([k, v]) => `${k}: ${v}`);
  const titleString = [`---`, ...metadata, '---\n\n'].join('\n');
  return titleString + content.join('\n\n');
}
