import { Author, oxaLinkToId, projectFromDTO, VersionId } from '@curvenote/blocks';
import fs from 'fs';
import path from 'path';
import { ExportConfig } from 'export/types';
import { parse } from 'date-fns';
import { Block, Project } from '../../models';
import { ISession } from '../../session/types';
import { writeBibtex } from '../utils/writeBibtex';
import { ArticleState, ArticleStateReference, exportFromOxaLink, makeBuildPaths } from '../utils';
import { TexExportOptions } from './types';
import {
  fetchTemplateTaggedBlocks,
  loadTemplateOptions,
  throwIfTemplateButNoJtex,
} from './template';
import { runTemplating } from './utils';
import { gatherArticleContent } from './gather';
import { buildFrontMatter, stringifyFrontMatter } from './frontMatter';
import { DocumentModel, toAuthorFields, toDateFields } from '../model';

export async function singleArticleToTex(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
) {
  throwIfTemplateButNoJtex(opts);
  const { tagged } = await fetchTemplateTaggedBlocks(session, opts);
  const templateOptions = loadTemplateOptions(opts);

  const { buildPath } = makeBuildPaths(session.log, opts);

  session.log.debug('Starting articleToTex...');
  session.log.debug(`With Options: ${JSON.stringify(opts)}`);

  const filename = path.join(buildPath, 'content.tex');
  const { article } = await gatherArticleContent(
    session,
    versionId,
    { ...opts, filename },
    tagged,
    templateOptions,
  );

  session.log.debug('Writing bib file...');
  await writeBibtex(session, article.references, path.join(buildPath, 'main.bib'));

  await runTemplating(filename, session.log, opts);

  return article;
}

/**
 * Create a tex output based on an export configuration
 *
 * @param session - ISession
 * @param job - ExportConfig
 * @param configPath - path to the folder containing curvenote.yml
 * @returns final DocumentState after all walking and localization
 */
export async function multiArticleToTex(
  session: ISession,
  project: Project,
  job: ExportConfig,
  opts: TexExportOptions,
) {
  throwIfTemplateButNoJtex(opts);
  const { tagged } = await fetchTemplateTaggedBlocks(session, opts);
  const templateOptions = loadTemplateOptions(opts);

  session.log.debug('Starting multiArticleToTex...');
  session.log.debug(`With job: ${JSON.stringify(job)}`);

  const { buildPath } = makeBuildPaths(session.log, opts);

  const articles: {
    article: ArticleState;
    model: DocumentModel;
    ref: string;
    taggedFilenames: Record<string, string>;
  }[] = [];
  session.log.debug('Processing contents...');
  // eslint-disable-next-line no-restricted-syntax
  for (const item of job.contents) {
    if (!item.name && !item.link)
      throw Error(`Contents items must have name or link field ${item}`);
    const id = oxaLinkToId(item.link ? item.link : `${job.project}/${item.name}`);
    if (!id) throw new Error('The article ID provided could not be parsed.');
    session.log.debug(`Using id: ${JSON.stringify(id)}`);

    // resolve name and version
    let { name } = item;
    let version = item.version ?? (id.block as VersionId).version;
    const block = await new Block(session, id.block).get();
    version = version ?? block.data.latest_version;
    name = block.data.name ?? undefined;
    session.log.debug(`Processing ${name} at version ${version}`);

    // walk chapters
    const ref = path.join('chapters', `${String(articles.length).padStart(3, '0')}-${name}.tex`);
    const { article, taggedFilenames, model } = await gatherArticleContent(
      session,
      { ...id.block, version },
      {
        ...opts,
        filename: path.join(buildPath, ref),
        images: path.join('..', 'images'),
      },
      tagged, // tagged from template,
      templateOptions,
    );

    articles.push({ article, model, ref, taggedFilenames });
  }

  // Accumulate references, taggedFilenames
  const references = articles.reduce(
    (acc, { article }) => ({ ...acc, ...article.references }),
    {} as Record<string, ArticleStateReference>,
  );
  const taggedFilenames = articles.reduce(
    (acc, item) => ({ ...acc, ...item.taggedFilenames }),
    {} as Record<string, string>,
  );

  //
  // build main content file
  //
  session.log.debug('Building front matter for main content...');

  const authors = await Promise.all(
    job.data.authors.map((a) =>
      toAuthorFields(session, { plain: a.name ?? null, user: a.id ?? null } as Author),
    ),
  );

  const frontMatter = stringifyFrontMatter(
    buildFrontMatter(
      {
        title: job.data.title ?? project.data.title,
        description: job.data.description ?? project.data.description,
        short_title: job.data.short_title ?? project.data.title.slice(0, 50),
        authors,
        date: job.data.date
          ? toDateFields(parse(job.data.date, 'yyyy/MM/dd', new Date()))
          : toDateFields(new Date()),
        tags: [],
        oxalink: job.project,
      },
      taggedFilenames,
      [], // templateOptions,
      {
        path: opts.texIsIntermediate ?? false ? '.' : '..', // jtex path is always relative to the content file
        filename: opts.filename,
        copy_images: true,
        single_file: false,
      },
      opts.template ?? null,
      Object.keys(references).length > 0 ? 'main.bib' : null,
    ),
  );

  // write the main file
  // write front matter
  let mainContent = `${frontMatter}\n`;
  // eslint-disable-next-line no-restricted-syntax
  for (const article of articles) {
    mainContent += `\\chapter*{${article.model.title}}\n\\input{${article.ref}}\n\n`;
  }

  session.log.debug(`Writing main content to ${opts.filename}`);
  fs.writeFileSync(opts.filename, mainContent);

  session.log.debug('Writing bib file...');
  await writeBibtex(session, references, path.join(buildPath, 'main.bib'));

  await runTemplating(opts.filename, session.log, opts);

  return articles;
}

export const oxaLinkToArticleTex = exportFromOxaLink(singleArticleToTex);
