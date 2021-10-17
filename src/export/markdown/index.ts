import fs from 'fs';
import YAML from 'yaml';
import { VersionId, KINDS, oxaLink, formatDate } from '@curvenote/blocks';
import { toMarkdown } from '@curvenote/schema';
import { Block, Version, User } from '../../models';
import { Session } from '../../session';
import { getChildren } from '../../actions/getChildren';
import { exportFromOxaLink, walkArticle, writeImagesToFiles } from '../utils';

type Options = {
  images?: string;
};

export async function articleToMarkdown(
  session: Session,
  versionId: VersionId,
  filename: string,
  opts?: Options,
) {
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
  const article = await walkArticle(session, data);

  const imageFilenames = await writeImagesToFiles(article.images, opts?.images ?? 'images');

  const content = article.children.map((child) => {
    if (!child.version || !child.state) return '';
    const blockData = { oxa: oxaLink('', child.version.id), pinned: false };
    const md = toMarkdown(child.state.doc, { localizeImageSrc: (src) => imageFilenames[src] });
    return `+++ ${JSON.stringify(blockData)}\n\n${md}`;
  });

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
