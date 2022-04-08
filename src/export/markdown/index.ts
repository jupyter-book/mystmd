import path from 'path';
import YAML from 'yaml';
import { VersionId, KINDS, oxaLink, formatDate } from '@curvenote/blocks';
import { createId, toMyst } from '@curvenote/schema';
import { writeBibtex } from '../utils/writeBibtex';
import { Block, Version } from '../../models';
import { getChildren } from '../../actions/getChildren';
import { exportFromOxaLink, walkArticle, writeImagesToFiles } from '../utils';
import { localizationOptions } from '../utils/localizationOptions';
import { ISession } from '../../session/types';
import { writeFileToFolder } from '../../utils';

type Options = {
  path?: string;
  filename: string;
  images?: string;
  writeBibtex?: boolean;
  bibtex?: string;
  renderReferences?: boolean;
};

export async function articleToMarkdown(session: ISession, versionId: VersionId, opts: Options) {
  const [block, version] = await Promise.all([
    new Block(session, versionId).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  const authors = block.data.authors.map((author) => author.name || '');
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');
  const article = await walkArticle(session, data);

  const imageFilenames = await writeImagesToFiles(session.log, article.images, {
    buildPath: opts?.path,
    basePath: opts?.images ?? 'images',
    simple: true,
  });
  const localization = localizationOptions(session, imageFilenames, article.references);
  const mdastName = `${opts.filename.replace(/\.md$/, '')}.mdast.json`;
  const articleMdastSnippets = {};
  const content = article.children.map((child) => {
    if (!child.version || !child.state) return '';
    const blockData = { oxa: oxaLink('', child.version.id) };
    const { content: md, mdastSnippets } = toMyst(child.state.doc, {
      ...localization,
      renderers: { iframe: 'myst' },
      createMdastImportId() {
        return `${mdastName}#${createId()}`;
      },
    });
    if (Object.keys(mdastSnippets).length) {
      Object.assign(articleMdastSnippets, mdastSnippets);
    }
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
  if (opts.renderReferences && Object.keys(article.references).length > 0) {
    file += '\n\n### References\n\n```{bibliography}\n:filter: docname in docnames\n```';
  }
  file += '\n\n';
  writeFileToFolder(opts, file);
  if (Object.keys(articleMdastSnippets).length) {
    const normalizedSnippets = Object.fromEntries(
      Object.entries(articleMdastSnippets).map(([k, v]) => [k.split('#')[1], v]),
    );
    writeFileToFolder(
      { ...opts, filename: mdastName },
      JSON.stringify(normalizedSnippets, null, 2),
    );
  }

  if (opts.writeBibtex ?? true) {
    session.log.debug('Writing bib file...');
    // Write out the references
    await writeBibtex(session, article.references, opts?.bibtex ?? 'main.bib', {
      path: path.join(opts.path || '.', path.dirname(opts.filename)),
      alwaysWriteFile: false,
    });
  }

  return article;
}

export const oxaLinkToMarkdown = exportFromOxaLink(articleToMarkdown);
