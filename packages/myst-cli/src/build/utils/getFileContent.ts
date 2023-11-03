import { resolve } from 'node:path';
import { plural, tic } from 'myst-cli-utils';
import type { LinkTransformer } from 'myst-transforms';
import type { ISession } from '../../session/types.js';
import {
  selectPageReferenceStates,
  loadFile,
  selectFile,
  postProcessMdast,
  transformMdast,
  loadProject,
  loadIntersphinx,
  combineProjectCitationRenderers,
} from '../../process/index.js';
import type { ImageExtensions } from '../../utils/index.js';

export async function getFileContent(
  session: ISession,
  files: string[],
  {
    projectPath,
    imageExtensions,
    extraLinkTransformers,
  }: {
    projectPath?: string;
    imageExtensions: ImageExtensions[];
    extraLinkTransformers?: LinkTransformer[];
  },
) {
  const toc = tic();
  files = files.map((file) => resolve(file));
  projectPath = projectPath ?? resolve('.');
  const { project, pages } = await loadProject(session, projectPath);
  const projectFiles = pages.map((page) => page.file);
  const allFiles = [...new Set([...files, ...projectFiles])];
  await Promise.all([
    // Load all citations (.bib)
    ...project.bibliography.map((path) => loadFile(session, path, projectPath, '.bib')),
    // Load all content (.md and .ipynb)
    ...allFiles.map((file) =>
      loadFile(session, file, projectPath, undefined, { minifyMaxCharacters: 0 }),
    ),
    // Load up all the intersphinx references
    loadIntersphinx(session, { projectPath }) as Promise<any>,
  ]);
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, projectPath);

  await Promise.all(
    allFiles.map(async (file) => {
      const pageSlug = pages.find((page) => page.file === file)?.slug;
      await transformMdast(session, {
        file,
        imageExtensions,
        projectPath,
        pageSlug,
        minifyMaxCharacters: 0,
        index: project.index,
      });
    }),
  );
  const pageReferenceStates = selectPageReferenceStates(
    session,
    allFiles.map((file) => {
      return { file };
    }),
  );
  const selectedFiles = await Promise.all(
    files.map(async (file) => {
      await postProcessMdast(session, {
        file,
        extraLinkTransformers,
        pageReferenceStates,
      });
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
