import type { SiteManifest } from 'myst-config';
import { castSession } from '../../session/cache.js';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import { fileTitle } from '../../utils/fileInfo.js';
import type { PageFrontmatter } from 'myst-frontmatter';

export type ManifestProject = Required<SiteManifest>['projects'][0];

export async function manifestPagesFromProject(session: ISession, projectPath: string) {
  const state = session.store.getState();
  const proj = selectors.selectLocalProject(state, projectPath);
  if (!proj) return [];
  const cache = castSession(session);
  const pages = await Promise.all(
    proj.pages.map(async (page) => {
      if (('hidden' in page) && (page.hidden))
        return null; // skip hidden pages
      if ('file' in page) {
        const fileInfo = selectors.selectFileInfo(state, page.file);
        const title = fileInfo.title || fileTitle(page.file);
        const short_title = fileInfo.short_title ?? undefined;
        const description = fileInfo.description ?? '';
        const thumbnail = fileInfo.thumbnail ?? '';
        const thumbnailOptimized = fileInfo.thumbnailOptimized ?? '';
        const banner = fileInfo.banner ?? '';
        const bannerOptimized = fileInfo.bannerOptimized ?? '';
        const date = fileInfo.date ?? '';
        const tags = fileInfo.tags ?? [];
        const { slug, level, file } = page;
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
        return projectPage;
      }
      return { ...page };
    }),
  );
  return pages?.filter(p => p !== null);
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
