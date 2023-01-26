import { resolve } from 'path';
import type { LinkTransformer } from 'myst-transforms';
import type { ISession } from '../../session/types';
import {
  loadFile,
  selectFile,
  postProcessMdast,
  transformMdast,
  processProject,
} from '../../process';
import { reduceOutputs } from '../../transforms';

export async function getSingleFileContent(
  session: ISession,
  file: string,
  imageWriteFolder: string,
  {
    projectPath,
    imageAltOutputFolder,
    imageExtensions,
    extraLinkTransformers,
  }: {
    projectPath?: string;
    imageAltOutputFolder?: string;
    imageExtensions?: string[];
    extraLinkTransformers?: LinkTransformer[];
  },
) {
  file = resolve(file);
  await processProject(
    session,
    { path: projectPath ?? resolve('.') },
    {
      writeFiles: false,
      imageWriteFolder,
      imageAltOutputFolder,
      imageExtensions,
      extraLinkTransformers,
    },
  );
  let selectedFile = selectFile(session, file);
  if (!selectedFile) {
    await loadFile(session, file);
    // Collect bib files - myst-to-tex will need those, not 'references'
    await transformMdast(session, {
      file,
      imageWriteFolder: imageWriteFolder,
      imageAltOutputFolder: imageAltOutputFolder ?? undefined,
      imageExtensions,
      projectPath,
    });
    await postProcessMdast(session, { file, extraLinkTransformers });
  }
  selectedFile = selectFile(session, file);
  if (!selectedFile) throw new Error(`Could not load file information for ${file}`);
  // Transform output nodes to images / text
  reduceOutputs(selectedFile.mdast);
  return selectedFile;
}
