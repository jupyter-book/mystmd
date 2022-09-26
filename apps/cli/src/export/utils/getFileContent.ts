import type { ISession } from '../../session/types';
import {
  postProcessMdast,
  loadFile,
  loadProject,
  selectFile,
  selectPageReferenceStates,
  transformMdast,
} from '../../store/local/actions';

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
  const { pages } = projectPath ? loadProject(session, projectPath) : { pages: [{ file }] };
  const pageReferenceStates = selectPageReferenceStates(session, pages);
  await postProcessMdast(session, { file, pageReferenceStates });
  return selectFile(session, file);
}
