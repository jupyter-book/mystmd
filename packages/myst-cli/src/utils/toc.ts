import fs from 'node:fs';
import { join, parse } from 'node:path';
import yaml from 'js-yaml';
import type { Logger } from 'myst-cli-utils';
import { silentLogger } from 'myst-cli-utils';
import type { ISession } from '../session/types.js';

export const TOC_FORMAT = 'jb-book';

export type TocOptions = {
  path?: string;
  filename?: string;
  ci?: boolean;
};

export type JupyterBookPart = {
  caption?: string;
  chapters?: JupyterBookChapter[];
};

export type JupyterBookChapter = {
  file?: string;
  url?: string;
  title?: string;
  glob?: string;
  sections?: JupyterBookChapter[];
};

export type TOC = {
  format: string;
  root: string;
  chapters?: JupyterBookChapter[];
  parts?: JupyterBookPart[];
};

export const tocFile = (filename: string): string => join(filename, '_toc.yml');

// See https://executablebooks.org/en/latest/updates/2021-06-18-update-toc.html
function upgradeOldJupyterBookToc(oldToc: any[]) {
  // TODO: numbering is ignored
  const [root, ...parts] = oldToc;
  const toc: TOC = {
    root: root.file,
    format: TOC_FORMAT,
    parts: parts.map(({ part, chapters }) => ({
      caption: part,
      chapters,
    })),
  };
  return toc;
}

export function readTOC(log: Logger, opts?: TocOptions): TOC {
  const filename = join(opts?.path || '.', opts?.filename || '_toc.yml');
  const toc = yaml.load(fs.readFileSync(filename).toString()) as any;
  if (Array.isArray(toc)) {
    try {
      const old = upgradeOldJupyterBookToc(toc);
      log.warn(
        `${filename} is out of date: see https://executablebooks.org/en/latest/updates/2021-06-18-update-toc.html`,
      );
      return old;
    } catch (error) {
      throw new Error(
        `Could not upgrade toc, please see: https://executablebooks.org/en/latest/updates/2021-06-18-update-toc.html`,
      );
    }
  }
  const { format, root, chapters, parts } = toc;
  if (format !== TOC_FORMAT) throw new Error(`The toc.format must be ${TOC_FORMAT}`);
  if (!root) throw new Error(`The toc.root must exist`);
  if (!chapters && !parts) throw new Error(`The toc must have either chapters or parts`);
  log.debug('Basic validation of TOC passed');
  return toc;
}

export function validateTOC(session: ISession, path: string): boolean {
  const filename = tocFile(path);
  const { dir, base } = parse(filename);
  if (!fs.existsSync(filename)) return false;
  try {
    readTOC(silentLogger(), { filename: base, path: dir });
    return true;
  } catch (error) {
    const { message } = error as unknown as Error;
    session.log.error(
      `The Table of Contents (ToC) file "${filename}" did not pass validation:\n - ${message}\n - An implicit ToC will be used instead\n`,
    );
    return false;
  }
}
