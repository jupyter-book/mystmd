import fs from 'node:fs';
import path from 'node:path';
import { hashAndCopyStaticFile } from 'myst-cli-utils';
import { RuleId, TemplateOptionType } from 'myst-common';
import type { SiteAction, SiteExport, SiteManifest } from 'myst-config';
import {
  EXT_TO_FORMAT,
  ExportFormats,
  PROJECT_FRONTMATTER_KEYS,
  SITE_FRONTMATTER_KEYS,
} from 'myst-frontmatter';
import type MystTemplate from 'myst-templates';
import { filterKeys } from 'simple-validators';
import { resolveToAbsolute } from '../../config.js';
import type { ISession } from '../../session/types.js';
import type { RootState } from '../../store/index.js';
import { selectors } from '../../store/index.js';
import { transformBanner, transformThumbnail } from '../../transforms/images.js';
import { addWarningForFile } from '../../utils/addWarningForFile.js';
import version from '../../version.js';
import { getMystTemplate } from './template.js';
import { collectExportOptions } from '../utils/collectExportOptions.js';
import { filterPages } from '../../project/load.js';
import { getRawFrontmatterFromFile } from '../../frontmatter.js';

type ManifestProject = Required<SiteManifest>['projects'][0];

export async function resolvePageExports(session: ISession, file: string): Promise<SiteExport[]> {
  const exports = (
    await collectExportOptions(
      session,
      [file],
      [
        ExportFormats.docx,
        ExportFormats.pdf,
        ExportFormats.tex,
        ExportFormats.typst,
        ExportFormats.xml,
        ExportFormats.meca,
      ],
      {},
    )
  )
    .filter((exp) => {
      return ['.docx', '.pdf', '.zip', '.xml'].includes(path.extname(exp.output));
    })
    .filter((exp) => {
      return fs.existsSync(exp.output);
    });
  const exportsAsDownloads = exports.map((exp) => {
    const { format, output } = exp;
    const fileHash = hashAndCopyStaticFile(session, output, session.publicPath(), (m: string) => {
      addWarningForFile(session, file, m, 'error', {
        ruleId: RuleId.exportFileCopied,
      });
    });
    return { format, filename: path.basename(output), url: `/${fileHash}` };
  });
  return exportsAsDownloads;
}

export async function resolvePageDownloads(
  session: ISession,
  file: string,
  projectPath?: string,
): Promise<SiteAction[]> {
  const state = session.store.getState();
  if (!projectPath) {
    projectPath = selectors.selectCurrentProjectPath(state);
  }
  const project = projectPath
    ? selectors.selectLocalProject(session.store.getState(), projectPath)
    : undefined;
  const files = project ? filterPages(project).map((page) => page.file) : [file];
  const allExports = await collectExportOptions(session, files, [...Object.values(ExportFormats)], {
    projectPath,
  });
  const expLookup: Record<string, { format: ExportFormats; output: string }> = {};
  allExports.forEach((exp) => {
    if (exp.id) expLookup[exp.id] = exp;
  });
  const pageFrontmatter = await getRawFrontmatterFromFile(session, file, projectPath);
  const resolvedDownloads = pageFrontmatter?.downloads
    ?.map((download): SiteAction | undefined => {
      let format: ExportFormats | undefined;
      let downloadFile: string;
      const exp = expLookup[download.file];
      const resolvedFile = path.resolve(path.dirname(file), download.file);
      if (exp) {
        format = exp.format;
        downloadFile = exp.output;
      } else if (fs.existsSync(resolvedFile)) {
        format = EXT_TO_FORMAT[path.extname(resolvedFile)];
        downloadFile = resolvedFile;
      } else {
        addWarningForFile(session, file, `Unable to resolve download "${download.file}"`, 'error', {
          ruleId: RuleId.exportFileCopied,
        });
        return undefined;
      }
      const fileHash = hashAndCopyStaticFile(
        session,
        downloadFile,
        session.publicPath(),
        (m: string) => {
          addWarningForFile(session, file, m, 'error', {
            ruleId: RuleId.exportFileCopied,
          });
        },
      );
      return { format, filename: path.basename(downloadFile), url: `/${fileHash}` };
    })
    .filter((download): download is SiteAction => !!download);
  return resolvedDownloads ?? [];
}

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
        };
        return projectPage;
      }
      return { ...page };
    }),
  );

  const projFrontmatter = projConfig ? filterKeys(projConfig, PROJECT_FRONTMATTER_KEYS) : {};
  const projConfigFile = selectors.selectLocalConfigFile(state, projectPath);
  const exports = projConfigFile ? await resolvePageExports(session, projConfigFile) : [];
  const downloads = projConfigFile
    ? await resolvePageDownloads(session, projConfigFile, projectPath)
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
    downloads,
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
  options: Record<string, any>,
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

function isUrl(value: string) {
  // Allow simple relative path in project
  if (value.match('^(/[a-zA-Z0-9._-]+)+$')) return true;
  try {
    new URL(value);
  } catch {
    return false;
  }
  return true;
}

/**
 * Resolves Site Action, including hashing and copying static files
 *
 * Infers `static: true` if url is an existing local file
 */
function resolveSiteManifestAction(
  session: ISession,
  action: SiteAction,
  file?: string,
): SiteAction | undefined {
  if (!action.url) return { ...action };
  if (action.static === false) {
    if (!isUrl(action.url)) {
      addWarningForFile(
        session,
        file,
        `Non-static site action "${action.url}" should be a valid URL`,
      );
    }
    return { ...action };
  }
  // Cases where url does not exist as a local file
  if (!fs.existsSync(action.url)) {
    if (action.static) {
      addWarningForFile(
        session,
        file,
        `Could not find static resource at "${action.url}" in site config 'actions'`,
        'error',
        { ruleId: RuleId.staticActionFileCopied },
      );
      return undefined;
    }
    if (!isUrl(action.url)) {
      addWarningForFile(
        session,
        file,
        `Site action "${action.url}" should be a URL or path to static file`,
      );
    }
    return { ...action };
  }
  if (!action.static && isUrl(action.url)) {
    // Unlikely case where url is both an existing local file and a valid URL
    addWarningForFile(
      session,
      file,
      `Linking site action "${action.url}" to static file; to mark this as a URL instead, use 'static: false'`,
    );
  }
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
  const siteConfigFile = selectors.selectCurrentSiteFile(state);
  if (!siteConfig) throw Error('no site config defined');
  const siteProjects: ManifestProject[] = (
    await Promise.all(
      siteConfig.projects?.map(async (p) => localToManifestProject(session, p.path, p.slug)) ?? [],
    )
  ).filter((p): p is ManifestProject => !!p);
  const { nav } = siteConfig;
  const actions = siteConfig.actions
    ?.map((action) => resolveSiteManifestAction(session, action, siteConfigFile))
    .filter((action): action is SiteAction => !!action);
  const siteFrontmatter = filterKeys(siteConfig as Record<string, any>, SITE_FRONTMATTER_KEYS);
  const mystTemplate = await getMystTemplate(session, opts);
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
