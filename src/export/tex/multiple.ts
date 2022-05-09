import { createAuthor, oxaLinkToId, VersionId } from '@curvenote/blocks';
import fs from 'fs';
import path from 'path';
import { parse } from 'date-fns';
import { ExportConfig } from '../../config';
import { Block, Project } from '../../models';
import { ISession } from '../../session/types';
import { writeBibtex } from '../utils/writeBibtex';
import { ArticleState, ArticleStateReference, makeBuildPaths } from '../utils';
import { TexExportOptions } from './types';
import {
  ifTemplateFetchTaggedBlocks,
  ifTemplateLoadOptions,
  throwIfTemplateButNoJtex,
} from './template';
import { ifTemplateRunJtex } from './utils';
import { gatherAndWriteArticleContent } from './gather';
import { buildFrontMatter, stringifyFrontMatter } from './frontMatter';
import { DocumentModel, toAuthorFields, toDateFields } from '../model';

/**
 * Create a tex output based on an export configuration
 *
 * @param session - ISession
 * @param job - ExportConfig
 * @param configPath - path to the folder containing curvenote.yml
 * @returns final DocumentState after all walking and localization
 */
export async function multipleArticleToTex(
  session: ISession,
  project: Project,
  job: ExportConfig,
  configPath: string,
  opts: Partial<TexExportOptions> = {},
) {
  const options: TexExportOptions = {
    ...opts,
    filename: path.join(configPath, job.folder, job.filename ?? 'main.tex'),
    multiple: true,
    template: job.template,
    templatePath: job.templatePath ? path.join(configPath, job.templatePath) : undefined,
  };

  throwIfTemplateButNoJtex(options);
  const { tagged } = await ifTemplateFetchTaggedBlocks(session, options);
  const templateOptions = ifTemplateLoadOptions(options);

  session.log.debug('Starting multiArticleToTex...');
  session.log.debug(`With job: ${JSON.stringify(job)}`);

  const { buildPath } = makeBuildPaths(session.log, options);

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
    const chapter = `c-${String(articles.length).padStart(3, '0')}-${name}.tex`;
    const ref = path.join('chapters', chapter);
    fs.mkdirSync(path.join(buildPath, 'chapters'), { recursive: true });
    const { article, taggedFilenames, model } = await gatherAndWriteArticleContent(
      session,
      { ...id.block, version },
      {
        ...options,
        filename: chapter,
      },
      tagged, // tagged from template,
      templateOptions,
      buildPath,
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
  const authorsData = job.data.authors ?? project.data.authors;
  const authors = !authorsData
    ? undefined
    : await Promise.all(
        authorsData.map((a) =>
          toAuthorFields(session, project, createAuthor({ id: '', userId: a.id ?? null })),
        ),
      );

  const frontMatter = stringifyFrontMatter(
    buildFrontMatter(
      {
        ...job.data,
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
      templateOptions,
      {
        path: options.texIsIntermediate ?? false ? '.' : '..', // jtex path is always relative to the content file
        filename: path.basename(options.filename),
        copy_images: true,
        single_file: false,
      },
      options.template ?? options.templatePath ?? null,
      Object.keys(references).length > 0 ? 'main.bib' : null,
    ),
  );

  // write the main file
  // write front matter
  let mainContent = `${frontMatter}\n`;
  mainContent += '\\graphicspath{{/}{chapters/}}\n';
  // eslint-disable-next-line no-restricted-syntax
  for (const article of articles) {
    mainContent += `\\chapter{${article.model.title}}\n\\input{${article.ref}}\n\n`;
  }

  const mainContentFilename =
    options.template || options.templatePath ? path.join(buildPath, 'main.tex') : options.filename;
  session.log.debug(`Writing main content to ${mainContentFilename}`);
  fs.writeFileSync(mainContentFilename, mainContent);

  session.log.debug('Writing bib file...');
  await writeBibtex(session, references, path.join(buildPath, 'main.bib'));

  await ifTemplateRunJtex(mainContentFilename, session.log, options);

  return articles;
}
