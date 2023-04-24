import { resolve } from 'path';
import { tic } from 'myst-cli-utils';
import type { LinkTransformer } from 'myst-transforms';
import type { ISession } from '../../session/types';
import type { TransformFn } from '../../process';
import {
  selectPageReferenceStates,
  loadFile,
  selectFile,
  postProcessMdast,
  transformMdast,
  loadProject,
  loadIntersphinx,
  combineProjectCitationRenderers,
} from '../../process';
import { reduceOutputs, transformWebp } from '../../transforms';
import { ImageExtensions } from '../../utils';

export async function getFileContent(
  session: ISession,
  files: string[],
  imageWriteFolder: string,
  {
    projectPath,
    imageAltOutputFolder,
    imageExtensions,
    extraLinkTransformers,
  }: {
    imageExtensions: ImageExtensions[];
    projectPath?: string;
    imageAltOutputFolder?: string;
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
    ...project.bibliography.map((path) => loadFile(session, path, '.bib')),
    // Load all content (.md and .ipynb)
    ...allFiles.map((file) => loadFile(session, file, undefined, { minifyMaxCharacters: 0 })),
    // Load up all the intersphinx references
    loadIntersphinx(session, { projectPath }) as Promise<any>,
  ]);
  // Consolidate all citations onto single project citation renderer
  combineProjectCitationRenderers(session, projectPath);

  const extraTransforms: TransformFn[] = [];
  if (imageExtensions.includes(ImageExtensions.webp)) {
    extraTransforms.push(transformWebp);
  }
  // if (opts?.extraTransforms) {
  //   extraTransforms.push(...opts.extraTransforms);
  // }
  await Promise.all(
    allFiles.map(async (file) => {
      await transformMdast(session, {
        file,
        imageWriteFolder,
        imageAltOutputFolder,
        imageExtensions,
        projectPath,
        minifyMaxCharacters: 0,
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
      await postProcessMdast(session, { file, extraLinkTransformers, pageReferenceStates });
      const selectedFile = selectFile(session, file);
      if (!selectedFile) throw new Error(`Could not load file information for ${file}`);
      // Transform output nodes to images / text
      reduceOutputs(selectedFile.mdast, imageWriteFolder);
      return selectedFile;
    }),
  );
  session.log.info(
    toc(
      `📚 Built ${allFiles.length} pages for export (including ${
        allFiles.length - files.length
      } dependencies) from ${projectPath} in %s.`,
    ),
  );
  return selectedFiles;
}
