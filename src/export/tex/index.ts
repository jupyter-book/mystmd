import fs from 'fs';

import { Blocks, VersionId, KINDS, oxaLink, convertToBlockId } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import os from 'os';
import path from 'path';
import { Logger } from 'logging';
import { Block, Version } from '../../models';
import { ISession } from '../../session/types';
import { getChildren } from '../../actions/getChildren';
import { localizationOptions } from '../utils/localizationOptions';
import { writeBibtex } from '../utils/writeBibtex';
import { buildFrontMatter, stringifyFrontMatter } from './frontMatter';
import {
  ArticleStateChild,
  exportFromOxaLink,
  walkArticle,
  writeImagesToFiles,
  makeBuildPaths,
  makeExecutable,
  ArticleState,
} from '../utils';
import { TexExportOptions } from './types';
import {
  fetchTemplateTaggedBlocks,
  loadTemplateOptions,
  throwIfTemplateButNoJtex,
} from './template';
import * as inkscape from '../utils/inkscape';
import * as imagemagick from '../utils/imagemagick';

export function createTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'curvenote'));
}

function convertAndLocalizeChild(
  session: ISession,
  child: ArticleStateChild,
  imageFilenames: Record<string, string>,
  references: ArticleState['references'],
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

function filterFilenamesByExtension(filenames: Record<string, string>, ext: string) {
  return Object.entries(filenames).filter(([, filename]) => {
    return path.extname(filename).toLowerCase() === ext;
  });
}

/**
 * Process images into supported formats
 *
 * @param session
 * @param imageFilenames - updated via side effect
 * @param originals
 * @param convertFn
 * @param buildPath
 */
async function processImages(
  session: ISession,
  imageFilenames: Record<string, string>,
  originals: [string, string][],
  convertFn: (orig: string, log: Logger, buildPath: string) => Promise<string | null>,
  buildPath: string,
) {
  session.log.debug(`Processing ${originals.length} items`);
  const processed = await Promise.all(
    originals.map(async ([key, orig]) => {
      session.log.debug(`processing ${orig}`);
      const png = await imagemagick.extractFirstFrameOfGif(orig, session.log, buildPath);
      return { key, orig, png };
    }),
  );
  processed.forEach(({ key, orig, png }) => {
    if (png === null) {
      session.log.error(
        `Could not extract image from ${orig}, references to ${key} will be invalid`,
      );
      return;
    }
    imageFilenames[key] = png;
  }, []);
}

export async function articleToTex(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
) {
  throwIfTemplateButNoJtex(opts);
  const { tagged } = await fetchTemplateTaggedBlocks(session, opts);
  const templateOptions = loadTemplateOptions(opts);

  session.log.debug('Starting articleToTex...');
  session.log.debug(`With Options: ${JSON.stringify(opts)}`);

  const { buildPath, outputFilename } = makeBuildPaths(session.log, opts);

  session.log.debug('Fetching data from API...');
  const [block, version] = await Promise.all([
    new Block(session, convertToBlockId(versionId)).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');

  session.log.debug('Start walkArticle...');
  const article = await walkArticle(session, data, tagged);

  session.log.debug('Start localizing images..');
  const imageFilenames = await writeImagesToFiles(
    session.log,
    article.images,
    opts?.images ?? 'images',
    buildPath,
  );

  // TODO Dry up gif and svg processing
  session.log.debug('Processing GIFS if present...');
  const gifs = filterFilenamesByExtension(imageFilenames, '.gif');
  if (gifs.length > 0) {
    if (!imagemagick.isImageMagickAvailable()) {
      session.log.warn(
        'GIF images are references, but Imagemagick.convert not available to convert them. This may result in invalid output and/or an invalid pdf file',
      );
    } else {
      session.log.debug(`Processing ${gifs.length} GIFs`);
      await processImages(
        session,
        imageFilenames,
        gifs,
        imagemagick.extractFirstFrameOfGif,
        buildPath,
      );
    }
  }

  session.log.debug('Processing SVGs if present');
  const svgs = filterFilenamesByExtension(imageFilenames, '.svg');
  if (svgs.length > 0) {
    if (opts.converter === 'imagemagick') {
      if (!imagemagick.isImageMagickAvailable()) {
        session.log.warn(
          'SVGs need to be converted to pdf images, but imagemagick is not available to convert them. This may result in invalid output and/or an invalid pdf file',
        );
      } else {
        session.log.debug(`Processing ${svgs.length} SVGs with IMAGEMAGICK to PNG`);
      }
      await processImages(session, imageFilenames, svgs, imagemagick.convertSVGToPNG, buildPath);
    } else {
      if (!inkscape.isInkscapeAvailable()) {
        session.log.warn(
          'SVGs need to be converted to pdf images, but inkscape is not available to convert them. This may result in invalid output and/or an invalid pdf file',
        );
      } else {
        session.log.debug(`Processing ${svgs.length} SVGs with INKSCAPE to PDF`);
      }
      await processImages(session, imageFilenames, svgs, inkscape.convertSVGToPDF, buildPath);
    }
  }

  session.log.debug('Finding tagged content and write to files...');
  const taggedFilenames: Record<string, string> = Object.entries(article.tagged)
    .filter(([tag, children]) => {
      if (children.length === 0) {
        session.log.debug(`No tagged content found for "${tag}".`);
        return false;
      }
      return true;
    })
    .map(([tag, children]) => {
      const filename = `${tag}.tex`; // keep filenames relative to buildPath
      const pathname = path.join(buildPath, filename);
      session.log.debug(`Writing ${children.length} tagged block(s) to ${pathname}`);
      writeBlocksToFile(
        children,
        (child) => convertAndLocalizeChild(session, child, imageFilenames, article.references),
        pathname,
      );
      return { tag, filename };
    })
    .reduce((obj, { tag, filename }) => ({ ...obj, [tag]: filename }), {});

  session.log.debug('Building front matter...');
  const frontMatter = stringifyFrontMatter(
    await buildFrontMatter(
      session,
      block,
      version as Version<Blocks.Article>,
      taggedFilenames,
      templateOptions,
      {
        path: opts.texIsIntermediate ?? false ? '.' : '..', // jtex path is always relative to the content file
        filename: outputFilename,
        copy_images: true,
        single_file: false,
      },
      opts.template ?? null,
      Object.keys(article.references).length > 0 ? 'main.bib' : null,
    ),
  );

  session.log.debug('Writing main body of content to content.tex...');
  const content_tex = path.join(buildPath, 'content.tex');
  writeBlocksToFile(
    article.children,
    (child) => convertAndLocalizeChild(session, child, imageFilenames, article.references),
    content_tex,
    frontMatter,
  );

  session.log.debug('Writing bib file...');
  // Write out the references
  await writeBibtex(session, article.references, path.join(buildPath, 'main.bib'));

  // run templating
  if (opts.template) {
    const CMD = `jtex render ${content_tex}`;
    try {
      session.log.debug('Running JTEX');
      const jtex = makeExecutable(CMD, session.log);
      await jtex();
    } catch (err) {
      session.log.error(`Error while invoking jtex: ${err}`);
    }
    session.log.debug('jtex finished');
  } else {
    session.log.debug('No template specified, JTEX not invoked!');
  }

  return article;
}

export const oxaLinkToTex = exportFromOxaLink(articleToTex);
