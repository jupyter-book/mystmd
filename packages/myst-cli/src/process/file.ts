import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { tic } from 'myst-cli-utils';
import type { ISession } from '../session/types';
import { castSession } from '../session';
import { warnings, watch } from '../store/reducers';
import { loadCitations } from './citations';
import { parseMyst } from './myst';
import { processNotebook } from './notebook';
import { KINDS } from '../transforms/types';

export async function loadFile(
  session: ISession,
  file: string,
  extension?: '.md' | '.ipynb' | '.bib',
) {
  const toc = tic();
  session.store.dispatch(warnings.actions.clearWarnings({ file }));
  const cache = castSession(session);
  let success = true;
  let sha256: string | undefined;
  try {
    const ext = extension || path.extname(file).toLowerCase();
    switch (ext) {
      case '.md': {
        const content = fs.readFileSync(file).toString();
        sha256 = createHash('sha256').update(content).digest('hex');
        const mdast = parseMyst(content);
        cache.$mdast[file] = { pre: { kind: KINDS.Article, file, mdast } };
        break;
      }
      case '.ipynb': {
        const content = fs.readFileSync(file).toString();
        sha256 = createHash('sha256').update(content).digest('hex');
        const mdast = await processNotebook(cache, file, content);
        cache.$mdast[file] = { pre: { kind: KINDS.Notebook, file, mdast } };
        break;
      }
      case '.bib': {
        const renderer = await loadCitations(session, file);
        cache.$citationRenderers[file] = renderer;
        break;
      }
      default:
        session.log.error(`Unrecognized extension ${file}`);
        session.log.info(
          `"${file}": Please rerun the build with "-c" to ensure the built files are cleared.`,
        );
        success = false;
    }
  } catch (error) {
    session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
    session.log.error(`Error reading file ${file}: ${error}`);
    success = false;
  }
  session.store.dispatch(watch.actions.markFileChanged({ path: file, sha256 }));
  if (success) session.log.debug(toc(`loadFile: loaded ${file} in %s.`));
}

export async function bibFilesInDir(session: ISession, dir: string, load = true) {
  const bibFiles = await Promise.all(
    fs.readdirSync(dir).map(async (f) => {
      if (path.extname(f).toLowerCase() === '.bib') {
        const bibFile = path.join(dir, f);
        if (load) await loadFile(session, bibFile);
        return bibFile;
      }
    }),
  );
  return bibFiles.filter((f): f is string => Boolean(f));
}

export function selectFile(session: ISession, file: string) {
  const cache = castSession(session);
  if (!cache.$mdast[file]) throw new Error(`Expected mdast to be processed for ${file}`);
  const mdastPost = cache.$mdast[file].post;
  if (!mdastPost) throw new Error(`Expected mdast to be processed and transformed for ${file}`);
  return mdastPost;
}
