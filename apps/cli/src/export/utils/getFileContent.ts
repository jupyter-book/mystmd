import path from 'path';
import type { ISession } from '../../session/types';
import { loadFile, selectFile, transformMdast } from '../../store/local/actions';

export async function getFileContent(
  session: ISession,
  file: string,
  output: string,
  projectPath?: string,
  useAltOutputFolder = true,
) {
  await loadFile(session, file);
  // Collect bib files - mysttotex will need those, not 'references'
  await transformMdast(session, {
    file,
    imageWriteFolder: path.join(path.dirname(output), 'images'),
    imageAltOutputFolder: useAltOutputFolder ? 'images' : undefined,
    projectPath,
  });
  return selectFile(session, file);
}
