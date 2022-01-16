import fs from 'fs';
import YAML from 'yaml';
import { VersionId, KINDS, oxaLink, formatDate } from '@curvenote/blocks';
import { toMarkdown } from '@curvenote/schema';
import { Block, Version, User } from '../../models';
import { getChildren } from '../../actions/getChildren';
import { exportFromOxaLink, walkArticle, writeImagesToFiles } from '../utils';
import { localizationOptions } from '../utils/localizationOptions';
import { ISession } from '../../session/types';

type Options = {
  filename: string;
  images?: string;
};

export async function articleToMarkdown(session: ISession, versionId: VersionId, opts: Options) {
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
  const localization = localizationOptions(session, imageFilenames, article.references);
  const content = article.children.map((child) => {
    if (!child.version || !child.state) return '';
    const blockData = { oxa: oxaLink('', child.version.id), pinned: false };
    const md = toMarkdown(child.state.doc, localization);
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
  // TODO: Remove the title when Jupyter Book allows title to be defined in the yaml.
  // https://github.com/executablebooks/MyST-Parser/pull/492
  const titleString = `---\n${metadata}---\n\n# ${block.data.title}\n\n`;
  let file = titleString + content.join('\n\n');
  if (Object.keys(article.references).length > 0) {
    file += '\n\n### References\n\n```{bibliography}\n:filter: docname in docnames\n```';
  }
  file += '\n\n';
  fs.writeFileSync(opts.filename, file);
  return article;
}

export const oxaLinkToMarkdown = exportFromOxaLink(articleToMarkdown);
