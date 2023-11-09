import fs from 'node:fs';
import path from 'node:path';
import { hashAndCopyStaticFile } from 'myst-cli-utils';
import { RuleId, TemplateOptionType } from 'myst-common';
import type { SiteAction, SiteManifest, SiteTemplateOptions } from 'myst-config';
import { PROJECT_FRONTMATTER_KEYS, SITE_FRONTMATTER_KEYS } from 'myst-frontmatter';
import type MystTemplate from 'myst-templates';
import { filterKeys } from 'simple-validators';
import { addWarningForFile, resolveToAbsolute, version } from '../../index.js';
import { resolvePageExports } from '../../process/site.js';
import type { ISession } from '../../session/types.js';
import type { RootState } from '../../store/index.js';
import { selectors } from '../../store/index.js';
import { getMystTemplate } from './template.js';
import { transformBanner, transformThumbnail } from '../../transforms/images.js';

type ManifestProject = Required<SiteManifest>['projects'][0];

/**
 * Convert local project representation to site manifest project
 *
 * This does a couple things:
 * - Adds projectSlug (which locally comes from site config)
 * - Removes any local file references
 * - Adds validated frontmatter
 * - Writes and transforms banner and thumbnail images
 */
export async function localToManifestProject(
  session: ISession,
  projectPath?: string,
  projectSlug?: string,
): Promise<ManifestProject | null> {
  if (!projectPath) return null;
  const state = session.store.getState();
  const projConfig = selectors.selectLocalProjectConfig(state, projectPath);
  const proj = selectors.selectLocalProject(state, projectPath);
  if (!proj) return null;
  // Update all of the page title to the frontmatter title
  const { index } = proj;
  const projectFileInfo = selectors.selectFileInfo(state, proj.file);
  const projectTitle = projConfig?.title || projectFileInfo.title || proj.index;
  const pages = await Promise.all(
    proj.pages.map(async (page) => {
      if ('file' in page) {
        const fileInfo = selectors.selectFileInfo(state, page.file);
        const title = fileInfo.title || page.slug;
        const short_title = fileInfo.short_title ?? undefined;
        const description = fileInfo.description ?? '';
        const thumbnail = fileInfo.thumbnail ?? '';
        const thumbnailOptimized = fileInfo.thumbnailOptimized ?? '';
        const banner = fileInfo.banner ?? '';
        const bannerOptimized = fileInfo.bannerOptimized ?? '';
        const date = fileInfo.date ?? '';
        const tags = fileInfo.tags ?? [];
        const { slug, level } = page;
        const projectPage: Required<SiteManifest>['projects'][0]['pages'][0] = {
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
        };
        return projectPage;
      }
      return { ...page };
    }),
  );

  const projFrontmatter = projConfig ? filterKeys(projConfig, PROJECT_FRONTMATTER_KEYS) : {};
  const projConfigFile = selectors.selectLocalConfigFile(state, projectPath);
  const exports = projConfigFile
    ? (await resolvePageExports(session, projConfigFile)).map(({ format, filename, url }) => {
        return { format, filename, url };
      })
    : [];
  const banner = await transformBanner(
    session,
    path.join(projectPath, 'myst.yml'),
    projFrontmatter,
    session.publicPath(),
    { altOutputFolder: '/' },
  );
  const thumbnail = await transformThumbnail(
    session,
    null,
    path.join(projectPath, 'myst.yml'),
    projFrontmatter,
    session.publicPath(),
    { altOutputFolder: '/' },
  );
  return {
    ...projFrontmatter,
    // TODO: a null in the project frontmatter should not fall back to index page
    thumbnail: thumbnail?.url || projectFileInfo.thumbnail,
    thumbnailOptimized: thumbnail?.urlOptimized || projectFileInfo.thumbnailOptimized || undefined,
    banner: banner?.url || projectFileInfo.banner,
    bannerOptimized: banner?.urlOptimized || projectFileInfo.bannerOptimized || undefined,
    exports,
    bibliography: projFrontmatter.bibliography || [],
    title: projectTitle || 'Untitled',
    slug: projectSlug,
    index,
    pages,
  };
}

async function resolveTemplateFileOptions(
  session: ISession,
  mystTemplate: MystTemplate,
  options: SiteTemplateOptions,
) {
  const resolvedOptions = { ...options };
  mystTemplate.getValidatedTemplateYml().options?.forEach((option) => {
    if (option.type === TemplateOptionType.file && options[option.id]) {
      const configPath = selectors.selectCurrentSitePath(session.store.getState());
      const absPath = configPath
        ? resolveToAbsolute(session, configPath, options[option.id])
        : options[option.id];
      const fileHash = hashAndCopyStaticFile(
        session,
        absPath,
        session.publicPath(),
        (m: string) => {
          addWarningForFile(session, options[option.id], m, 'error', {
            ruleId: RuleId.templateFileCopied,
          });
        },
      );
      resolvedOptions[option.id] = `/${fileHash}`;
    }
  });
  return resolvedOptions;
}

function resolveSiteManifestAction(session: ISession, action: SiteAction): SiteAction {
  if (!action.static || !action.url) return { ...action };
  if (!fs.existsSync(action.url))
    throw new Error(`Could not find static resource at "${action.url}". See 'config.site.actions'`);
  const fileHash = hashAndCopyStaticFile(session, action.url, session.publicPath(), (m: string) => {
    addWarningForFile(session, action.url, m, 'error', {
      ruleId: RuleId.staticActionFileCopied,
    });
  });
  return {
    title: action.title,
    filename: path.basename(action.url),
    url: `/${fileHash}`,
    static: true,
  };
}

/**
 * Build site manifest from local redux state
 *
 * Site manifest acts as the configuration to build the website.
 * It combines local site config and project configs into a single structure.
 */
export async function getSiteManifest(
  session: ISession,
  opts?: { defaultTemplate?: string },
): Promise<SiteManifest> {
  const state = session.store.getState() as RootState;
  const siteConfig = selectors.selectCurrentSiteConfig(state);
  if (!siteConfig) throw Error('no site config defined');
  const siteProjects: ManifestProject[] = (
    await Promise.all(
      siteConfig.projects?.map(async (p) => localToManifestProject(session, p.path, p.slug)) ?? [],
    )
  ).filter((p): p is ManifestProject => !!p);
  const { nav } = siteConfig;
  const actions = siteConfig.actions?.map((action) => resolveSiteManifestAction(session, action));
  const siteFrontmatter = filterKeys(siteConfig as Record<string, any>, SITE_FRONTMATTER_KEYS);
  const mystTemplate = await getMystTemplate(session, opts);
  const siteConfigFile = selectors.selectCurrentSiteFile(state);
  const validatedOptions = mystTemplate.validateOptions(
    siteFrontmatter.options ?? {},
    siteConfigFile,
  );
  const validatedFrontmatter = mystTemplate.validateDoc(
    siteFrontmatter,
    validatedOptions,
    undefined,
    siteConfigFile,
  );
  const resolvedOptions = await resolveTemplateFileOptions(session, mystTemplate, validatedOptions);
  validatedFrontmatter.options = resolvedOptions;
  const manifest: SiteManifest = {
    ...validatedFrontmatter,
    myst: version,
    nav: nav || [],
    actions: actions || [],
    projects: siteProjects,
  };
  return manifest;
}
