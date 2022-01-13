import fs from 'fs';

import { Blocks, VersionId, KINDS, oxaLink, convertToBlockId } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import os from 'os';
import path from 'path';
import { Block, Version } from '../../models';
import { Session } from '../../session';
import { getChildren } from '../../actions/getChildren';
import { localizationOptions } from '../utils/localizationOptions';
import { writeBibtex } from '../utils/writeBibtex';
import { buildFrontMatter, stringifyFrontMatter } from './frontMatter';
import {
  ArticleStateChild,
  ArticleStateReference,
  exportFromOxaLink,
  walkArticle,
  writeImagesToFiles,
  exec,
} from '../utils';
import { TexExportOptions } from './types';
import {
  fetchTemplateTaggedBlocks,
  loadTemplateOptions,
  throwIfTemplateButNoJtex,
} from './template';

export function createTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'curvenote'));
}

function convertAndLocalizeChild(
  session: Session,
  child: ArticleStateChild,
  imageFilenames: Record<string, string>,
  references: Record<string, ArticleStateReference>,
) {
  if (!child.version || !child.state) return '';
  const sep = oxaLink(session.SITE_URL, child.version.id);

  const localization = localizationOptions(session, imageFilenames, references);
  const tex = toTex(child.state.doc, localization);
  return `%% ${sep}\n\n${tex}`;
}

function writeBlocksToFile(
  children: ArticleStateChild[],
  mapperFn: (child: ArticleStateChild) => string,
  filename: string,
  header?: string,
) {
  const content = children.map(mapperFn);
  const file = header ? `${header}\n${content.join('\n\n')}` : content.join('\n\n');
  fs.writeFileSync(filename, `${file}\n`);
}

export async function articleToTex(session: Session, versionId: VersionId, opts: TexExportOptions) {
  throwIfTemplateButNoJtex(opts);
  const { tagged } = await fetchTemplateTaggedBlocks(session, opts);
  const templateOptions = loadTemplateOptions(opts);

  // Only use a build path if no template && no pdf target requested
  const buildPath = opts.useBuildFolder ?? !!opts.template ? '_build' : '.'; // TODO make not relative to CWD
  if (!fs.existsSync(buildPath)) fs.mkdirSync(path.dirname(buildPath), { recursive: true });

  const [block, version] = await Promise.all([
    new Block(session, convertToBlockId(versionId)).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');

  const article = await walkArticle(session, data, tagged);

  const imageFilenames = await writeImagesToFiles(
    article.images,
    opts?.images ?? 'images',
    buildPath,
  );

  const taggedFilenames: Record<string, string> = Object.entries(article.tagged)
    .filter(([tag, children]) => {
      if (children.length === 0) {
        session.$logger.debug(`No tagged content found for "${tag}".`);
        return false;
      }
      return true;
    })
    .map(([tag, children]) => {
      const filename = `${tag}.tex`; // keep filenames relative to buildPath
      session.$logger.debug(`Writing ${children.length} tagged block(s) to ${filename}`);
      writeBlocksToFile(
        children,
        (child) => convertAndLocalizeChild(session, child, imageFilenames, article.references),
        path.join(buildPath, filename),
      );
      return { tag, filename };
    })
    .reduce((obj, { tag, filename }) => ({ ...obj, [tag]: filename }), {});

  const frontMatter = stringifyFrontMatter(
    await buildFrontMatter(
      session,
      block,
      version as Version<Blocks.Article>,
      taggedFilenames,
      templateOptions,
      {
        path: opts.texIsIntermediate ?? false ? '.' : '..', // TODO make not relative to CWD
        filename: opts.filename,
        copy_images: true,
        single_file: false,
      },
      opts.template ?? null,
      'main.bib',
    ),
  );

  session.$logger.debug('Writing main body of content to content.tex');
  const content_tex = path.join(buildPath, 'content.tex');
  writeBlocksToFile(
    article.children,
    (child) => convertAndLocalizeChild(session, child, imageFilenames, article.references),
    content_tex,
    frontMatter,
  );

  session.$logger.debug('Writing bib file');
  // Write out the references
  await writeBibtex(article.references, path.join(buildPath, 'main.bib'));

  // run templating
  if (opts.template) {
    session.$logger.debug('Running jtex');
    const CMD = `jtex render ${content_tex}`;
    try {
      await exec(CMD);
    } catch (err) {
      session.$logger.error(`Error while invoking jtex: ${err}`);
    }
    session.$logger.debug('jtex finished');
  }

  return article;
}

export const oxaLinkToTex = exportFromOxaLink(articleToTex);
