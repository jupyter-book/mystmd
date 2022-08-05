import fs from 'fs';
import { extname, join, sep } from 'path';
import type { SiteProject, SiteAction, SiteAnalytics } from '../config/types';
import { CURVENOTE_YML } from '../config/types';
import { PROJECT_FRONTMATTER_KEYS, SITE_FRONTMATTER_KEYS } from '../frontmatter/validators';
import type { ISession } from '../session/types';
import type { RootState } from '../store';
import { selectors } from '../store';
import { addWarningForFile, publicPath, warnOnUnrecognizedKeys } from '../utils';
import { filterKeys } from '../utils/validators';
import type {
  SiteManifest,
  ManifestProject,
  ManifestProjectPage,
  ManifestProjectFolder,
} from './types';

/**
 * Convert local project representation to site manifest project
 *
 * This does a couple things:
 * - Adds projectSlug (which locally comes from site config)
 * - Removes any local file references
 * - Adds validated frontmatter
 */
export function localToManifestProject(
  state: RootState,
  siteProj: SiteProject,
): ManifestProject | null {
  const projConfig = selectors.selectLocalProjectConfig(state, siteProj.path);
  const proj = selectors.selectLocalProject(state, siteProj.path);
  if (!proj || !projConfig) return null;
  // Update all of the page title to the frontmatter title
  const { index } = proj;
  const projectTitle =
    projConfig?.title || selectors.selectFileInfo(state, proj.file).title || proj.index;
  const pages: ManifestProject['pages'] = proj.pages.map(
    (page): ManifestProjectFolder | ManifestProjectPage => {
      if ('file' in page) {
        const fileInfo = selectors.selectFileInfo(state, page.file);
        const title = fileInfo.title || page.slug;
        const description = fileInfo.description ?? '';
        const thumbnail = fileInfo.thumbnail ?? '';
        const thumbnailOptimized = fileInfo.thumbnailOptimized ?? '';
        const date = fileInfo.date ?? '';
        const tags = fileInfo.tags ?? [];
        const { slug, level } = page;
        const projectPage: ManifestProjectPage = {
          slug,
          title,
          description,
          date,
          thumbnail,
          thumbnailOptimized,
          tags,
          level,
        };
        return projectPage;
      }
      return { ...page } as ManifestProjectFolder;
    },
  );
  const projFrontmatter = filterKeys(projConfig, PROJECT_FRONTMATTER_KEYS);
  return {
    ...projFrontmatter,
    title: projectTitle || 'Untitled',
    slug: siteProj.slug,
    index,
    pages,
  };
}

export function getLogoPaths(
  session: ISession,
  logoName?: string | null,
  opts = { silent: false },
): { path: string; public: string; url: string } | null {
  if (!logoName) {
    session.log.debug('No logo specified, Curvenote renderer will use default logo');
    return null;
  }
  const origLogoName = logoName;
  if (!fs.existsSync(logoName)) {
    // Look in the local public path
    logoName = join('public', logoName);
  }
  if (!fs.existsSync(logoName)) {
    const message = `Could not find logo at "${origLogoName}". See 'config.site.logo'`;
    if (opts.silent) {
      session.log.debug(message);
    } else {
      addWarningForFile(session, CURVENOTE_YML, message);
    }
    return null;
  }
  const logo = `logo${extname(logoName)}`;
  return { path: logoName, public: join(publicPath(session), logo), url: `/${logo}` };
}

function getManifestActionPaths(session: ISession, filePath: string) {
  if (!fs.existsSync(filePath)) {
    // Look in the local public path
    filePath = join('public', filePath);
  }
  if (!fs.existsSync(filePath))
    throw new Error(`Could not find static resource at "${filePath}". See 'config.site.actions'`);
  // Get rid of the first public path if present
  const parts = filePath.split(sep).filter((s, i) => i > 0 || s !== 'public');
  const webUrl = parts.join('/'); // this is not sep! (web url!)
  return { path: filePath, public: join(publicPath(session), ...parts), url: `/${webUrl}` };
}

function getSiteManifestAction(session: ISession, action: SiteAction): SiteAction {
  if (!action.static || !action.url) return { ...action };
  const { url } = getManifestActionPaths(session, action.url);
  return {
    title: action.title,
    url,
    static: true,
  };
}

function getSiteManifestAnalytics(
  session: ISession,
  analytics?: SiteAnalytics,
): SiteAnalytics | undefined {
  if (!analytics) return undefined;
  const { google, plausible, ...rest } = analytics;
  warnOnUnrecognizedKeys(session.log, rest, `${CURVENOTE_YML}#site.analytics:`);
  return {
    google: google || undefined,
    plausible: plausible || undefined,
  };
}

export function copyActionResource(session: ISession, action: SiteAction) {
  if (!action.static || !action.url) return;
  const resource = getManifestActionPaths(session, action.url);
  session.log.debug(
    `Copying static resource from "${resource.path}" to be available at "${resource.url}"`,
  );
  fs.copyFileSync(resource.path, resource.public);
}

export function copyLogo(session: ISession, logoName?: string | null): string | undefined {
  const logo = getLogoPaths(session, logoName);
  if (!logo) return;
  session.log.debug(`Copying logo from ${logo.path} to ${logo.public}`);
  fs.copyFileSync(logo.path, logo.public);
}

/**
 * Build site manifest from local curvenote state
 *
 * Site manifest acts as the configuration to build the website.
 * It combines local site config and project configs into a single structure.
 */
export function getSiteManifest(session: ISession): SiteManifest {
  const siteProjects: ManifestProject[] = [];
  const state = session.store.getState();
  const siteConfig = selectors.selectLocalSiteConfig(state);
  if (!siteConfig) throw Error('no site config defined');
  siteConfig.projects.forEach((siteProj) => {
    const proj = localToManifestProject(state, siteProj);
    if (!proj) return;
    siteProjects.push(proj);
  });
  const { title, twitter, logo, logoText, nav } = siteConfig;
  const actions = siteConfig.actions.map((action) => getSiteManifestAction(session, action));
  const siteFrontmatter = filterKeys(siteConfig as Record<string, any>, SITE_FRONTMATTER_KEYS);
  const manifest: SiteManifest = {
    ...siteFrontmatter,
    title: title || '',
    twitter,
    logo: getLogoPaths(session, logo, { silent: true })?.url,
    logoText,
    nav,
    actions,
    projects: siteProjects,
    analytics: getSiteManifestAnalytics(session, siteConfig.analytics),
  };
  return manifest;
}
