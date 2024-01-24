import { getFrontmatter } from 'myst-transforms';
import type { Export, ExportFormats, Licenses, PageFrontmatter } from 'myst-frontmatter';
import {
  validateExportsList,
  fillPageFrontmatter,
  licensesToString,
  unnestKernelSpec,
  validatePageFrontmatter,
} from 'myst-frontmatter';
import type { GenericParent } from 'myst-common';
import { copyNode, fileError, fileWarn, RuleId } from 'myst-common';
import type { ValidationOptions } from 'simple-validators';
import { VFile } from 'vfile';
import type { ISession } from './session/types.js';
import { selectors, watch } from './store/index.js';
import { logMessagesFromVFile } from './utils/logMessagesFromVFile.js';
import { castSession } from './session/cache.js';
import { loadFile } from './process/file.js';

/**
 * Get page frontmatter from mdast tree and fill in missing info from project frontmatter
 *
 * @param session
 * @param path - project path for loading project config/frontmatter
 * @param tree - mdast tree already loaded from 'file'
 * @param file - file source for mdast 'tree' - this is only used for logging; tree is not reloaded
 * @param removeNode - if true, mdast tree will be mutated to remove frontmatter once read
 */
export function getPageFrontmatter(
  session: ISession,
  tree: GenericParent,
  vfile: VFile,
): { frontmatter: PageFrontmatter; identifiers: string[] } {
  const { frontmatter: rawPageFrontmatter, identifiers } = getFrontmatter(vfile, tree, {
    propagateTargets: true,
  });
  unnestKernelSpec(rawPageFrontmatter);
  const validationOpts = {
    property: 'frontmatter',
    vfile,
    messages: {},
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId: RuleId.validPageFrontmatter });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId: RuleId.validPageFrontmatter });
    },
  };
  const pageFrontmatter = validatePageFrontmatter(rawPageFrontmatter, validationOpts);
  logMessagesFromVFile(session, vfile);
  return { frontmatter: pageFrontmatter, identifiers };
}

export function processPageFrontmatter(
  session: ISession,
  pageFrontmatter: PageFrontmatter,
  validationOpts: ValidationOptions,
  path?: string,
) {
  const state = session.store.getState();
  const siteFrontmatter = selectors.selectCurrentSiteConfig(state) ?? {};
  const projectFrontmatter = path ? selectors.selectLocalProjectConfig(state, path) ?? {} : {};

  const frontmatter = fillPageFrontmatter(pageFrontmatter, projectFrontmatter, validationOpts);

  if (siteFrontmatter?.options?.hide_authors || siteFrontmatter?.options?.design?.hide_authors) {
    delete frontmatter.authors;
  }
  return frontmatter;
}

export function prepareToWrite(frontmatter: { license?: Licenses }) {
  if (!frontmatter.license) return { ...frontmatter };
  return { ...frontmatter, license: licensesToString(frontmatter.license) };
}

export async function getRawFrontmatterFromFile(
  session: ISession,
  file: string,
  projectPath?: string,
) {
  const cache = castSession(session);
  if (!cache.$getMdast(file)) await loadFile(session, file, projectPath);
  const result = cache.$getMdast(file);
  if (!result || !result.pre) return undefined;
  const vfile = new VFile();
  vfile.path = file;
  // Copy the mdast, this is not a processing step!
  const frontmatter = getFrontmatter(vfile, copyNode(result.pre.mdast));
  logMessagesFromVFile(session, vfile);
  return frontmatter.frontmatter;
}

export function getExportListFromRawFrontmatter(
  session: ISession,
  formats: ExportFormats[],
  rawFrontmatter: Record<string, any> | undefined,
  file: string,
): Export[] {
  const vfile = new VFile();
  vfile.path = file;
  const exportErrorMessages: ValidationOptions = {
    property: 'exports',
    messages: {},
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId: RuleId.validFrontmatterExportList });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId: RuleId.validFrontmatterExportList });
    },
  };
  const exports = validateExportsList(
    rawFrontmatter?.exports ?? rawFrontmatter?.export,
    exportErrorMessages,
  );
  logMessagesFromVFile(session, vfile);
  if (!exports) return [];
  const exportOptions: Export[] = exports.filter(
    (exp: Export | undefined): exp is Export => !!exp && formats.includes(exp.format),
  );
  return exportOptions;
}

export function updateFileInfoFromFrontmatter(
  session: ISession,
  file: string,
  frontmatter: PageFrontmatter,
  url?: string,
  dataUrl?: string,
) {
  session.store.dispatch(
    watch.actions.updateFileInfo({
      path: file,
      title: frontmatter.title,
      short_title: frontmatter.short_title,
      description: frontmatter.description,
      date: frontmatter.date,
      thumbnail: frontmatter.thumbnail,
      thumbnailOptimized: frontmatter.thumbnailOptimized,
      banner: frontmatter.banner,
      bannerOptimized: frontmatter.bannerOptimized,
      tags: frontmatter.tags,
      url,
      dataUrl,
    }),
  );
}
