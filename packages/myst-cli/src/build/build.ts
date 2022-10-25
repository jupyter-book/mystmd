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
  writeConfig?: boolean;
};

export function noBuildTargets(opts: BuildOpts) {
  const { docx, pdf, tex } = opts;
  return !docx && !pdf && !tex;
}

export function build(session: ISession, opts: BuildOpts) {
  const buildAll = noBuildTargets(opts);
  const { file, output, docx, pdf, tex, clean, writeConfig, writeToc } = opts;
  let configPath = selectors.selectCurrentProjectPath(session.store.getState());
  if (configPath && writeConfig) {
    const configFile = selectors.selectCurrentProjectFile(session.store.getState());
    session.log.warn(`🚫 Ignoring --writeConfig, found existing project config: ${configFile}`);
  }
  if (!configPath) {
    configPath = '.';
    if (writeConfig) {
      // TODO: Write default project config to path '.'
      // loadConfigAndValidateOrThrow(session, '.')
    }
  }
  let pages: string[];
  let noDefaultExport = false;
  if (file) {
    pages = [file];
  } else {
    noDefaultExport = true;
    const project = loadProjectFromDisk(session, configPath, { writeToc });
    pages = filterPages(project).map((page) => page.file);
  }
  resolveAndLogErrors(session, [
    ...pages.map(async (page) => {
      if (buildAll || docx) {
        await localArticleToWord(session, page, { filename: output || '', clean, noDefaultExport });
      }
    }),
    ...pages.map(async (page) => {
      if (buildAll || pdf) {
        await localArticleToPdf(session, page, { filename: output || '', clean, noDefaultExport });
      }
    }),
    ...pages.map(async (page) => {
      if (buildAll || tex) {
        await localArticleToTex(session, page, { filename: output || '', clean, noDefaultExport });
      }
    }),
  ]);
  return;
}
