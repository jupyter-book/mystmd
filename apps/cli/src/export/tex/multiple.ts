import fs from 'fs';
import path from 'path';
import type { VersionId } from '@curvenote/blocks';
import { oxaLinkToId } from '@curvenote/blocks';
import { projectFrontmatterFromDTO } from '../../frontmatter/api';
import type { Project } from '../../models';
import { Block } from '../../models';
import type { ISession } from '../../session/types';
import type { ExportConfig } from '../types';
import { makeBuildPaths } from '../utils/makeBuildPaths';
import type { ArticleState, ArticleStateReference } from '../utils/walkArticle';
import { writeBibtex } from '../utils/writeBibtex';
import { validateExportConfigKeys, validateJtexFrontmatterKeys } from '../validators';
import type { TexExportOptionsExpanded } from './types';
import type { LatexFrontmatter } from './frontmatter';
import { stringifyFrontmatter, buildJtexSection, escapeLatex } from './frontmatter';
import { gatherAndWriteArticleContent } from './gather';
import {
  ifTemplateFetchTaggedBlocks,
  ifTemplateLoadOptions,
  throwIfTemplateButNoJtex,
} from './template';
import { ifTemplateRunJtex } from './utils';

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
  opts: Partial<TexExportOptionsExpanded> = {},
) {
  const options: TexExportOptionsExpanded = {
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
    model: LatexFrontmatter;
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
  const validatedJobConfig = validateExportConfigKeys(job, {
    property: 'job',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
    },
  });
  const projectFrontmatter = projectFrontmatterFromDTO(session, project.data, {
    escapeFn: escapeLatex,
  });
  const frontmatter: LatexFrontmatter = {
    ...projectFrontmatter,
    ...validatedJobConfig.data,
    short_title: job.data.short_title ?? projectFrontmatter.title?.slice(0, 50),
    // tags: [],
    oxa: job.project ?? projectFrontmatter.oxa,
    jtex: buildJtexSection(
      taggedFilenames,
      templateOptions,
      {
        path: options.texIsIntermediate ?? false ? '.' : '..', // jtex path is always relative to the content file
        filename: path.basename(options.filename ?? ''),
        copy_images: true,
        single_file: false,
      },
      options.template ?? options.templatePath ?? null,
      Object.keys(references).length > 0 ? 'main.bib' : null,
    ),
  };

  const validFrontmatter = validateJtexFrontmatterKeys(frontmatter, {
    property: 'jtex',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
    },
  });

  // write the main file
  // write front matter
  let mainContent = `${stringifyFrontmatter(validFrontmatter)}\n`;
  mainContent += '\\graphicspath{{/}{chapters/}}\n';
  // eslint-disable-next-line no-restricted-syntax
  for (const article of articles) {
    mainContent += `\\chapter{${article.model.title}}\n\\input{${article.ref}}\n\n`;
  }

  const mainContentFilename =
    options.template || options.templatePath
      ? path.join(buildPath, 'main.tex')
      : options.filename ?? '';
  session.log.debug(`Writing main content to ${mainContentFilename}`);
  fs.writeFileSync(mainContentFilename, mainContent);

  session.log.debug('Writing bib file...');
  await writeBibtex(session, references, 'main.bib', { path: buildPath, alwaysWriteFile: true });

  await ifTemplateRunJtex(mainContentFilename, session.log, options);

  return articles;
}
