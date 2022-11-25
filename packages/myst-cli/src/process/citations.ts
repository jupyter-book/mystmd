import fs from 'fs';
import fetch from 'node-fetch';
import type { CitationRenderer } from 'citation-js-utils';
import { getCitations } from 'citation-js-utils';
import { tic, isUrl } from 'myst-cli-utils';
import type { ISession, ISessionWithCache } from '../session/types';
import { castSession } from '../session';
import { selectors } from '../store';
import { addWarningForFile } from '../utils';

export async function loadCitations(session: ISession, path: string) {
  const toc = tic();
  let data: string;
  if (isUrl(path)) {
    session.log.debug(`Fetching citations at "${path}"`);
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Error fetching citations from "${path}": ${res.status} ${res.statusText}`);
    }
    data = await res.text();
    session.log.debug(`Fetched citations from "${path}" successfully.`);
  } else {
    session.log.debug(`Loading citations at "${path}"`);
    data = fs.readFileSync(path).toString();
  }
  const renderer = await getCitations(data);
  const numCitations = Object.keys(renderer).length;
  const plural = numCitations > 1 ? 's' : '';
  session.log.info(toc(`🏫 Read ${numCitations} citation${plural} from ${path} in %s.`));
  return renderer;
}

export function combineCitationRenderers(cache: ISessionWithCache, ...files: string[]) {
  const combined: CitationRenderer = {};
  files.forEach((file) => {
    const renderer = cache.$citationRenderers[file] ?? {};
    Object.keys(renderer).forEach((key) => {
      if (combined[key]) {
        addWarningForFile(cache, file, `Duplicate citation with id: ${key}`);
      }
      combined[key] = renderer[key];
    });
  });
  return combined;
}

export function combineProjectCitationRenderers(session: ISession, projectPath: string) {
  const project = selectors.selectLocalProject(session.store.getState(), projectPath);
  const cache = castSession(session);
  if (!project?.bibliography) return;
  cache.$citationRenderers[projectPath] = combineCitationRenderers(cache, ...project.bibliography);
}
