import fs from 'fs';
import YAML from 'yaml';
import { VersionId, KINDS, oxaLink, formatDate } from '@curvenote/blocks';
import { toMarkdown } from '@curvenote/schema';
import { Block, Version, User } from '../../models';
import { Session } from '../../session';
import { getChildren } from '../../actions/getChildren';
import { getEditorState } from '../../actions/utils';
import { exportFromOxaLink } from '../utils';

export async function articleToMarkdown(session: Session, versionId: VersionId, filename: string) {
  const [block, version] = await Promise.all([
    new Block(session, versionId).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  const authors = await Promise.all(
    block.data.authors.map(async (author) => {
      if (author.user) {
        const user = await new User(session, author.user).get();
        return `@${user.data.username}`;
      }
      return author.plain as string;
    }),
  );
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');
  const content = await Promise.all(
    data.order.map(async (k) => {
      const srcId = data.children[k]?.src;
      if (!srcId) return '';
      const child = await new Version(session, srcId).get();
      const blockData = { oxa: oxaLink('', srcId), pinned: false };
      const blockString = `+++ ${JSON.stringify(blockData)}\n\n`;
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
  const metadata = YAML.stringify({
    title: block.data.title,
    description: block.data.description,
    date: formatDate(data.date),
    author: authors,
    name: block.data.name,
    oxa: oxaLink('', block.id),
  });
  const titleString = `---\n${metadata}---\n\n`;
  const file = titleString + content.join('\n\n');
  fs.writeFileSync(filename, file);
}

export const oxaLinkToMarkdown = exportFromOxaLink(articleToMarkdown);
