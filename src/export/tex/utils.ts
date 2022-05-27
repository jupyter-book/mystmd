import fs from 'fs';
import os from 'os';
import path from 'path';
import { oxaLink } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import { Logger } from '../../logging';
import { ISession } from '../../session/types';
import { makeExecutable } from '../utils/exec';
import { localizationOptions } from '../utils/localizationOptions';
import { ArticleState, ArticleStateChild } from '../utils/walkArticle';
import { TexExportOptions } from './types';

export function createTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'curvenote'));
}

export function convertAndLocalizeChild(
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

export function writeBlocksToFile(
  children: ArticleStateChild[],
  mapperFn: (child: ArticleStateChild) => string,
  filename: string,
  header?: string,
) {
  const content = children.map(mapperFn);
  const file = header ? `${header}\n${content.join('\n\n')}` : content.join('\n\n');
  fs.writeFileSync(filename, `${file}\n`);
}

export function filterFilenamesByExtension(filenames: Record<string, string>, ext: string) {
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
export async function processImages(
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
      const converted = await convertFn(orig, session.log, buildPath);
      return { key, orig, converted };
    }),
  );
  processed.forEach(({ key, orig, converted }) => {
    if (converted === null) {
      session.log.error(
        `Could not extract image from ${orig}, references to ${key} will be invalid`,
      );
      return;
    }
    imageFilenames[key] = converted;
  }, []);
}

/**
 * Invoke jtex with the appropriate options
 *
 * @param contentTexFile - path to the tex file containing the main body of content
 * @param log - Logger
 * @param opts - TenExportOptions
 */
export async function ifTemplateRunJtex(
  contentTexFile: string,
  log: Logger,
  opts: TexExportOptions,
) {
  // run templating
  if (opts.template || opts.templatePath) {
    const STUB = `jtex render ${contentTexFile}`;
    const CMD = opts.templatePath ? `${STUB} --template-path ${opts.templatePath}` : STUB;

    try {
      log.debug('Running JTEX');
      const jtex = makeExecutable(CMD, log);
      await jtex();
    } catch (err) {
      log.error(`Error while invoking jtex: ${err}`);
    }
    log.debug('jtex finished');
  } else {
    log.debug('No template specified, JTEX not invoked!');
  }
}

/**
 * Take tagged content, already separated during the article walk and write them to separate files
 *
 * @param session
 * @param document
 * @param imageFilenames
 * @param buildPath
 * @returns
 */
export async function writeTaggedContent(
  session: ISession,
  document: ArticleState,
  imageFilenames: Record<string, string>,
  buildPath: string,
): Promise<Record<string, string>> {
  session.log.debug('Finding tagged content and write to files...');
  return Object.entries(document.tagged)
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
        (child) => convertAndLocalizeChild(session, child, imageFilenames, document.references),
        pathname,
      );
      return { tag, filename };
    })
    .reduce((obj, { tag, filename }) => ({ ...obj, [tag]: filename }), {});
}
