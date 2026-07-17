import fs from 'node:fs';
import type { CitationRenderer } from 'citation-js-utils';
import { getCitationRenderers, parseBibTeX } from 'citation-js-utils';
import { tic, isUrl } from 'myst-cli-utils';
import { RuleId, plural } from 'myst-common';
import type { ISession, ISessionWithCache } from '../session/types.js';
import { castSession } from '../session/cache.js';
import { selectors } from '../store/index.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';

export async function loadBibTeXCitationRenderers(
  session: ISession,
  path: string,
): Promise<CitationRenderer> {
  const toc = tic();
  let data: string;
  if (isUrl(path)) {
    session.log.debug(`Fetching citations at "${path}"`);
    // No caching - citations from URL will likely change simultaneously with authoring
    const res = await session.fetch(path);
    if (!res.ok) {
      throw new Error(`Error fetching citations from "${path}": ${res.status} ${res.statusText}`);
    }
    data = await res.text();
    session.log.debug(`Fetched citations from "${path}" successfully.`);
  } else {
    session.log.debug(`Loading citations at "${path}"`);
    data = fs.readFileSync(path).toString();
  }
  const csl = parseBibTeX(data);
  const renderer = getCitationRenderers(csl);
  session.log.debug(toc(`Read ${plural('%s citation(s)', renderer)} from ${path} in %s.`));
  return renderer;
}

export function combineCitationRenderers(cache: ISessionWithCache, ...files: string[]) {
  const combined: CitationRenderer = {};
  files.forEach((file) => {
    const renderer = cache.$citationRenderers[file] ?? {};
    Object.keys(renderer).forEach((key) => {
      if (combined[key]) {
        addWarningForFile(cache, file, `Duplicate citation with id: ${key}`, 'warn', {
          ruleId: RuleId.citationIsUnique,
        });
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
