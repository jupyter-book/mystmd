import { filterPages, loadProjectFromDisk } from '../project';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { localArticleToWord } from './docx';
import { localArticleToPdf } from './pdf';
import { localArticleToTex } from './tex';
import { resolveAndLogErrors } from './utils';

export type BuildOpts = {
  docx?: boolean;
  pdf?: boolean;
  tex?: boolean;
  file?: string;
  output?: string;
  checkLinks?: boolean;
  clean?: boolean;
  writeToc?: boolean;
};

export function noBuildTargets(opts: BuildOpts) {
  const { docx, pdf, tex } = opts;
  return !docx && !pdf && !tex;
}

export function build(session: ISession, opts: BuildOpts) {
  const buildAll = noBuildTargets(opts);
  const { file, output, docx, pdf, tex, clean, writeToc } = opts;
  const configPath = selectors.selectCurrentProjectPath(session.store.getState());
  let pages: string[];
  let projectPath: string | undefined;
  let noDefaultExport = false;
  if (file) {
    pages = [file];
  } else {
    noDefaultExport = true;
    const project = loadProjectFromDisk(session, configPath ?? '.', { writeToc });
    pages = filterPages(project).map((page) => page.file);
    projectPath = configPath;
  }
  resolveAndLogErrors(session, [
    ...pages.map(async (page) => {
      if (buildAll || docx) {
        await localArticleToWord(session, page, {
          filename: output || '',
          clean,
          noDefaultExport,
          projectPath,
        });
      }
    }),
    ...pages.map(async (page) => {
      if (buildAll || pdf) {
        await localArticleToPdf(session, page, {
          filename: output || '',
          clean,
          noDefaultExport,
          projectPath,
        });
      }
    }),
    ...pages.map(async (page) => {
      if (buildAll || tex) {
        await localArticleToTex(session, page, {
          filename: output || '',
          clean,
          noDefaultExport,
          projectPath,
        });
      }
    }),
  ]);
}
