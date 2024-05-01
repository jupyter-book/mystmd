import fs from 'node:fs';
import { extname, join, parse } from 'node:path';
import yaml from 'js-yaml';
import type { Logger } from 'myst-cli-utils';
import { silentLogger } from 'myst-cli-utils';
import { RuleId } from 'myst-common';
import type { ISession } from '../session/types.js';
import { addWarningForFile } from './addWarningForFile.js';

export const TOC_FORMAT = 'jb-book';
export const TOC_FORMAT_ARTICLE = 'jb-article';

export type TOCOptions = {
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
  sections?: JupyterBookChapter[];
  chapters?: JupyterBookChapter[];
  parts?: JupyterBookPart[];
};

export const tocFile = (filename: string): string => {
  if (extname(filename) === '.yml') return filename;
  return join(filename, '_toc.yml');
};

// See https://executablebooks.org/en/latest/blog/2021-06-18-update-toc/
function upgradeOldSphinxTOC(oldTOC: any[]) {
  // TODO: numbering is ignored
  const [root, ...parts] = oldTOC;
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

export function readSphinxTOC(log: Logger, opts?: TOCOptions): TOC {
  const filename = join(opts?.path || '.', opts?.filename || '_toc.yml');
  const toc = yaml.load(fs.readFileSync(filename).toString()) as any;
  if (Array.isArray(toc)) {
    try {
      const old = upgradeOldSphinxTOC(toc);
      log.warn(
        `${filename} is out of date: see https://executablebooks.org/en/latest/blog/2021-06-18-update-toc`,
      );
      return old;
    } catch (error) {
      throw new Error(
        `Could not upgrade toc, please see: https://executablebooks.org/en/latest/blog/2021-06-18-update-toc`,
      );
    }
  }
  const { format, root, sections, chapters, parts } = toc;
  if (![TOC_FORMAT, TOC_FORMAT_ARTICLE].includes(format))
    throw new Error(`The toc.format must be ${TOC_FORMAT} or ${TOC_FORMAT_ARTICLE}`);
  if (!root) throw new Error(`The toc.root must exist`);
  if (+!!sections + +!!chapters + +!!parts !== 1) {
    throw new Error(`The toc must have one and only one sections, chapters, or parts`);
  }
  log.debug('Basic validation of TOC passed');
  return toc;
}

export function validateSphinxTOC(session: ISession, path: string): boolean {
  const filename = tocFile(path);
  const { dir, base } = parse(filename);
  if (!fs.existsSync(filename)) return false;
  try {
    readSphinxTOC(silentLogger(), { filename: base, path: dir });
    return true;
  } catch (error) {
    const { message } = error as unknown as Error;
    addWarningForFile(
      session,
      filename,
      `Table of Contents (ToC) file did not pass validation:\n - ${message}\n - An implicit ToC will be used instead\n`,
      'error',
      { ruleId: RuleId.validTOCStructure },
    );
    return false;
  }
}
