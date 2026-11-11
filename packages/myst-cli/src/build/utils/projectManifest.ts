import type { SiteManifest } from 'myst-config';
import { castSession } from '../../session/cache.js';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import { fileTitle } from '../../utils/fileInfo.js';
import type { PageFrontmatter } from 'myst-frontmatter';

export type ManifestProject = Required<SiteManifest>['projects'][0];

type ManifestProjectItem = ManifestProject['pages'][0];
export async function manifestPagesFromProjectWithHidden(session: ISession, projectPath: string) {
  const state = session.store.getState();
  const proj = selectors.selectLocalProject(state, projectPath);
  const pages: ManifestProjectItem[] = [];
  const hiddenPages: ManifestProjectItem[] = [];
  if (!proj) return { pages, hiddenPages };
  const cache = castSession(session);

  for (const tocEntry of proj.pages) {
    if ('file' in tocEntry) {
      // fileInfo has metadata about the file taken from the toc and file frontmatter
      const fileInfo = selectors.selectFileInfo(state, tocEntry.file);
      // Choose title and short_title based on hierarchy of metadata
      const title = fileInfo.title ?? fileTitle(tocEntry.file);
      const short_title = tocEntry.title ?? fileInfo.short_title ?? undefined;
      // Everything else we pull from fileInfo
      const description = fileInfo.description ?? '';
      const thumbnail = fileInfo.thumbnail ?? '';
      const thumbnailOptimized = fileInfo.thumbnailOptimized ?? '';
      const banner = fileInfo.banner ?? '';
      const bannerOptimized = fileInfo.bannerOptimized ?? '';
      const date = fileInfo.date ?? '';
      const tags = fileInfo.tags ?? [];
      const { slug, level, file } = tocEntry;
      const { frontmatter } = cache.$getMdast(file)?.post ?? {};
      const projectPage: ManifestProject['pages'][0] = {
        slug,
        title,
        short_title,
        description,
        date,
        thumbnail,
        thumbnailOptimized,
        banner,
        bannerOptimized,
        tags,
        level,
        enumerator: frontmatter?.enumerator,
      };
      if (tocEntry.hidden) {
        hiddenPages.push(projectPage);
      } else {
        pages.push(projectPage);
      }
    } else if ('url' in tocEntry) {
      const { title, url, open_in_same_tab, level } = tocEntry;
      const externalURL: ManifestProject['pages'][0] = {
        title,
        url,
        open_in_same_tab,
        level,
      };
      pages.push(externalURL);
    } else {
      const { hidden, ...page } = { hidden: false, ...tocEntry };
      // Not a file or URL, probably a sub-entry; try and bubble down
      pages.push(page);
    }
  }
  return { pages, hiddenPages };
}

export async function manifestPagesFromProject(session: ISession, projectPath: string) {
  const { pages } = await manifestPagesFromProjectWithHidden(session, projectPath);
  return pages;
}

export function manifestTitleFromProject(session: ISession, projectPath: string) {
  const state = session.store.getState();
  const projConfig = selectors.selectLocalProjectConfig(state, projectPath);
  if (projConfig?.title) return projConfig.title;
  const proj = selectors.selectLocalProject(state, projectPath);
  if (!proj) return 'Untitled';
  const projectFileInfo = selectors.selectFileInfo(session.store.getState(), proj.file);
  return projectFileInfo.title || proj.index || 'Untitled';
}

export function indexFrontmatterFromProject(
  session: ISession,
  projectPath: string,
): PageFrontmatter {
  const state = session.store.getState();
  const cache = castSession(session);
  const proj = selectors.selectLocalProject(state, projectPath);
  if (!proj) return {};
  const { file } = proj;
  const { frontmatter } = cache.$getMdast(file)?.post ?? {};
  return frontmatter ?? {};
}
