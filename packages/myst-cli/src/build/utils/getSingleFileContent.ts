import type { LinkTransformer } from 'myst-transforms';
import type { ISession } from '../../session/types';
import { loadFile, selectFile, postProcessMdast, transformMdast } from '../../process';

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
  await loadFile(session, file);
  // Collect bib files - mysttotex will need those, not 'references'
  await transformMdast(session, {
    file,
    imageWriteFolder: imageWriteFolder,
    imageAltOutputFolder: imageAltOutputFolder ?? undefined,
    imageExtensions,
    projectPath,
  });
  await postProcessMdast(session, { file, extraLinkTransformers });
  return selectFile(session, file);
}
