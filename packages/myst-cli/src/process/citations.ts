import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { CitationRenderer } from 'citation-js-utils';
import {
  DEFAULT_CITATION_STYLE,
  getBuiltinCitationStyle,
  getCitationRenderers,
  getParentStyleUrl,
  parseBibTeX,
} from 'citation-js-utils';
import { tic, isUrl } from 'myst-cli-utils';
import { RuleId, plural } from 'myst-common';
import type { ISession, ISessionWithCache } from '../session/types.js';
import { castSession } from '../session/cache.js';
import { selectors } from '../store/index.js';
import { addWarningForFile } from '../utils/addWarningForFile.js';
import { resolveToAbsolute } from '../utils/resolveToAbsolute.js';

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

const CSL_STYLES_URL = 'https://raw.githubusercontent.com/citation-style-language/styles/master';
const CSL_STYLE_ID = /^https?:\/\/www\.zotero\.org\/styles\/([\w-]+)$/;

const loadedStyles = new WeakMap<ISession, Map<string, Promise<string | undefined>>>();

async function readStyle(session: ISession, basePath: string, pathOrUrl: string) {
  const file = await resolveToAbsolute(session, basePath, pathOrUrl, { allowRemote: true });
  if (!fs.existsSync(file)) return undefined;
  const xml = fs.readFileSync(file).toString();
  return xml.includes('<style') ? xml : undefined;
}

async function resolveStyle(session: ISession, style: string, basePath: string) {
  const builtin = getBuiltinCitationStyle(style);
  if (builtin) return builtin;
  let xml: string | undefined;
  if (isUrl(style) || style.endsWith('.csl')) {
    xml = await readStyle(session, basePath, style);
  } else {
    // A style name from the CSL style repository, for example `ieee`
    xml =
      (await readStyle(session, basePath, `${CSL_STYLES_URL}/${style}.csl`)) ??
      (await readStyle(session, basePath, `${CSL_STYLES_URL}/dependent/${style}.csl`));
  }
  const parent = xml ? getParentStyleUrl(xml) : undefined;
  if (parent) {
    const parentName = parent.match(CSL_STYLE_ID)?.[1];
    xml = await readStyle(
      session,
      basePath,
      parentName ? `${CSL_STYLES_URL}/${parentName}.csl` : parent,
    );
  }
  return xml;
}

/**
 * Load the XML of a CSL style
 *
 * `style` is a style that citation-js includes (`apa`, `vancouver`, `harvard1`),
 * a style name from the CSL style repository, a local `.csl` file, or a URL.
 * Remote styles are cached in the build folder.
 * If the style does not load, this function returns the default style.
 */
export async function loadCitationStyle(
  session: ISession,
  file: string,
  style: string | undefined,
): Promise<string> {
  const fallback = getBuiltinCitationStyle(DEFAULT_CITATION_STYLE) as string;
  if (!style) return fallback;
  const basePath = dirname(file);
  if (!loadedStyles.has(session)) loadedStyles.set(session, new Map());
  const styles = loadedStyles.get(session) as Map<string, Promise<string | undefined>>;
  const key = isUrl(style) || !style.endsWith('.csl') ? style : resolve(basePath, style);
  if (!styles.has(key)) styles.set(key, resolveStyle(session, style, basePath));
  const xml = await styles.get(key);
  if (xml) return xml;
  addWarningForFile(
    session,
    file,
    `Citation style "${style}" not found; using "${DEFAULT_CITATION_STYLE}"`,
    'warn',
    { ruleId: RuleId.citationRenders },
  );
  return fallback;
}
