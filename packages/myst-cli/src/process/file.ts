import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { tic } from 'myst-cli-utils';
import { TexParser } from 'tex-to-myst';
import { VFile } from 'vfile';
import { toText } from 'myst-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import { SourceFileKind } from 'myst-spec-ext';
import type { ISession, ISessionWithCache } from '../session/types.js';
import { castSession } from '../session/index.js';
import { warnings, watch } from '../store/reducers.js';
import { loadCitations } from './citations.js';
import { parseMyst } from './myst.js';
import { processNotebook } from './notebook.js';
import type { RendererData } from '../transforms/types.js';
import { logMessagesFromVFile } from '../utils/index.js';

function checkCache(cache: ISessionWithCache, content: string, file: string) {
  const sha256 = createHash('sha256').update(content).digest('hex');
  cache.store.dispatch(watch.actions.markFileChanged({ path: file, sha256 }));
  const useCache = cache.$mdast[file]?.pre && cache.$mdast[file].sha256 === sha256;
  return { useCache, sha256 };
}

export async function loadFile(
  session: ISession,
  file: string,
  projectPath?: string,
  extension?: '.md' | '.ipynb' | '.bib',
  opts?: { minifyMaxCharacters?: number },
) {
  const toc = tic();
  session.store.dispatch(warnings.actions.clearWarnings({ file }));
  const cache = castSession(session);
  let success = true;

  let location = file;
  if (projectPath) {
    location = `/${path.relative(projectPath, file)}`;
  }
  // ensure forward slashes and not windows backslashes
  location = location.replaceAll('\\', '/');

  try {
    const ext = extension || path.extname(file).toLowerCase();
    switch (ext) {
      case '.md': {
        const content = fs.readFileSync(file).toString();
        const { sha256, useCache } = checkCache(cache, content, file);
        if (useCache) break;
        const mdast = parseMyst(session, content, file);
        cache.$mdast[file] = {
          sha256,
          pre: { kind: SourceFileKind.Article, file, location, mdast },
        };
        break;
      }
      case '.ipynb': {
        const content = fs.readFileSync(file).toString();
        const { sha256, useCache } = checkCache(cache, content, file);
        if (useCache) break;
        const mdast = await processNotebook(cache, file, content, opts);
        cache.$mdast[file] = {
          sha256,
          pre: { kind: SourceFileKind.Notebook, file, location, mdast },
        };
        break;
      }
      case '.bib': {
        const renderer = await loadCitations(session, file);
        cache.$citationRenderers[file] = renderer;
        break;
      }
      case '.tex': {
        const content = fs.readFileSync(file).toString();
        const { sha256, useCache } = checkCache(cache, content, file);
        if (useCache) break;
        const vfile = new VFile();
        vfile.path = file;
        const tex = new TexParser(content, vfile);
        logMessagesFromVFile(session, vfile);
        const frontmatter: PageFrontmatter = {
          title: toText(tex.data.frontmatter.title as any),
          short_title: toText(tex.data.frontmatter.short_title as any),
          authors: tex.data.frontmatter.authors,
          // TODO: affiliations: tex.data.frontmatter.affiliations,
          keywords: tex.data.frontmatter.keywords,
          math: tex.data.macros,
          bibliography: tex.data.bibliography,
        };
        cache.$mdast[file] = {
          sha256,
          pre: {
            kind: SourceFileKind.Article,
            file,
            mdast: tex.ast as any,
            location,
            frontmatter,
          },
        };
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

export function selectFile(session: ISession, file: string): RendererData | undefined {
  const cache = castSession(session);
  file = path.resolve(file);
  if (!cache.$mdast[file]) {
    session.log.error(`Expected mdast to be processed for ${file}`);
    return undefined;
  }
  const mdastPost = cache.$mdast[file].post;
  if (!mdastPost) {
    session.log.error(`Expected mdast to be processed and transformed for ${file}`);
    return undefined;
  }
  return mdastPost;
}
