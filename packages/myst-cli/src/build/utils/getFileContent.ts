import { resolve } from 'node:path';
import type { TransformSpec } from 'myst-common';
import { plural } from 'myst-common';
import { tic } from 'myst-cli-utils';
import type { LinkTransformer } from 'myst-transforms';
import { combineProjectCitationRenderers } from '../../process/citations.js';
import { loadFile, selectFile } from '../../process/file.js';
import { loadReferences } from '../../process/loadReferences.js';
import type { TransformFn } from '../../process/mdast.js';
import { postProcessMdast, transformMdast } from '../../process/mdast.js';
import { loadProject, selectPageReferenceStates } from '../../process/site.js';
import type { ISession } from '../../session/types.js';
import { selectors } from '../../store/index.js';
import type { ImageExtensions } from '../../utils/resolveExtension.js';

export async function getFileContent(
  session: ISession,
  files: string[],
  {
    projectPath,
    imageExtensions,
    extraLinkTransformers,
    transforms,
    extraTransforms,
    titleDepths,
    preFrontmatters,
    execute,
  }: {
    projectPath?: string;
    imageExtensions: ImageExtensions[];
    extraLinkTransformers?: LinkTransformer[];
    transforms?: TransformSpec[];
    /** @deprecated use transforms instead */
    extraTransforms?: TransformFn[];
    titleDepths?: number | (number | undefined)[];
    preFrontmatters?: Record<string, any> | (Record<string, any> | undefined)[];
    execute?: boolean;
  },
) {
  const toc = tic();
  files = files.map((file) => resolve(file));
  projectPath = projectPath ?? resolve('.');
  const { project, pages } = await loadProject(session, projectPath);
  const projectFiles = pages.map((page) => page.file).filter((file) => !files.includes(file));
  await Promise.all([
    // Load all citations (.bib)
    ...project.bibliography.map((path) => loadFile(session, path, projectPath, '.bib')),
    // Load all content (.md, .tex, .myst.json, or .ipynb)
    ...[...files, ...projectFiles].map((file, ind) => {
      const preFrontmatter = Array.isArray(preFrontmatters)
        ? preFrontmatters?.[ind]
        : preFrontmatters;
      return loadFile(session, file, projectPath, undefined, {
        preFrontmatter,
      });
    }),
    // Load up all the intersphinx references
    loadReferences(session, { projectPath }),
  ]);
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, projectPath);

  const projectParts = selectors.selectProjectParts(session.store.getState(), projectPath);
  // Keep 'files' indices consistent in 'allFiles' as index is used for other fields.
  const allFiles = [...files, ...projectFiles, ...projectParts];

  await Promise.all(
    allFiles.map(async (file, ind) => {
      const pageSlug = pages.find((page) => page.file === file)?.slug;
      const titleDepth = typeof titleDepths === 'number' ? titleDepths : titleDepths?.[ind];
      await transformMdast(session, {
        file,
        imageExtensions,
        projectPath,
        pageSlug,
        minifyMaxCharacters: 0,
        index: project.index,
        titleDepth,
        transforms,
        extraTransforms,
        execute,
      });
    }),
  );
  const pageReferenceStates = selectPageReferenceStates(
    session,
    allFiles.map((file) => {
      return { file };
    }),
  );
  await Promise.all(
    [...files, ...projectParts].map(async (file) => {
      await postProcessMdast(session, {
        file,
        extraLinkTransformers,
        pageReferenceStates,
      });
    }),
  );
  const selectedFiles = await Promise.all(
    files.map(async (file) => {
      const selectedFile = selectFile(session, file);
      if (!selectedFile) throw new Error(`Could not load file information for ${file}`);
      return selectedFile;
    }),
  );
  session.log.info(
    toc(
      `📚 Built ${plural('%s page(s)', allFiles)} for export (including ${plural(
        '%s dependenc(y|ies)',
        allFiles.length - files.length,
      )}) from ${projectPath} in %s.`,
    ),
  );
  return selectedFiles;
}
