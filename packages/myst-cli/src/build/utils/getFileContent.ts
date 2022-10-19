import type { ISession } from '../../session/types';
import { loadFile, selectFile, postProcessMdast, transformMdast } from '../../process';

export async function getFileContent(
  session: ISession,
  file: string,
  imageWriteFolder: string,
  projectPath?: string,
  imageAltOutputFolder?: string,
) {
  await loadFile(session, file);
  // Collect bib files - mysttotex will need those, not 'references'
  await transformMdast(session, {
    file,
    imageWriteFolder: imageWriteFolder,
    imageAltOutputFolder: imageAltOutputFolder ?? undefined,
    projectPath,
  });
  await postProcessMdast(session, { file });
  return selectFile(session, file);
}
