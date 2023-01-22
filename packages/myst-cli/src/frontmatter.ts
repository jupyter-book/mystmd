import type { Root } from 'mdast';
import { getFrontmatter } from 'myst-transforms';
import type { Export, ExportFormats, Licenses, PageFrontmatter } from 'myst-frontmatter';
import {
  validateExportsList,
  fillPageFrontmatter,
  licensesToString,
  unnestKernelSpec,
  validatePageFrontmatter,
} from 'myst-frontmatter';
import { castSession } from './session';
import { loadFile } from './process';
import type { ISession } from './session/types';
import { selectors } from './store';
import type { ValidationOptions } from 'simple-validators';
import { copyNode } from 'myst-common';

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
  tree: Root,
  file: string,
  path?: string,
  removeNode = true,
): PageFrontmatter {
  const { frontmatter: rawPageFrontmatter } = getFrontmatter(tree, {
    removeYaml: removeNode,
    removeHeading: removeNode,
  });
  unnestKernelSpec(rawPageFrontmatter);
  const pageFrontmatter = validatePageFrontmatter(rawPageFrontmatter, {
    property: 'frontmatter',
    file,
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
    },
  });

  const state = session.store.getState();
  const siteFrontmatter = selectors.selectCurrentSiteConfig(state) ?? {};
  const projectFrontmatter = path ? selectors.selectLocalProjectConfig(state, path) ?? {} : {};

  const frontmatter = fillPageFrontmatter(pageFrontmatter, projectFrontmatter);

  if (siteFrontmatter?.design?.hide_authors) {
    delete frontmatter.authors;
  }
  return frontmatter;
}

export function prepareToWrite(frontmatter: { license?: Licenses }) {
  if (!frontmatter.license) return { ...frontmatter };
  return { ...frontmatter, license: licensesToString(frontmatter.license) };
}

export async function getRawFrontmatterFromFile(session: ISession, file: string) {
  const cache = castSession(session);
  await loadFile(session, file);
  const result = cache.$mdast[file];
  if (!result || !result.pre) return undefined;
  // Copy the mdast, this is not a processing step!
  const frontmatter = getFrontmatter(copyNode(result.pre.mdast));
  return frontmatter.frontmatter;
}

export function getExportListFromRawFrontmatter(
  session: ISession,
  formats: ExportFormats[],
  rawFrontmatter?: Record<string, any>,
): Export[] {
  const exportErrorMessages: ValidationOptions = {
    property: 'exports',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
    },
  };
  const exports = validateExportsList(
    rawFrontmatter?.exports ?? rawFrontmatter?.export,
    exportErrorMessages,
  );
  if (!exports) return [];
  const exportOptions: Export[] = exports.filter(
    (exp: Export | undefined): exp is Export => !!exp && formats.includes(exp.format),
  );
  return exportOptions;
}
