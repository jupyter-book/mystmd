import path from 'node:path';
import type { ISession } from '../../session/types.js';
import { selectPageSlug } from '../../store/selectors.js';
import { createSlug } from '../../utils/fileInfo.js';

/**
 * Get default filename for saving export.
 *
 * This uses the project slug if available, or creates a new slug from the filename otherwise.
 */
export function getDefaultExportFilename(session: ISession, file: string, projectPath?: string) {
  const { name } = path.parse(file);
  const slugFromProject = projectPath
    ? selectPageSlug(session.store.getState(), projectPath, file)
    : undefined;
  const slug = slugFromProject || createSlug(name);
  return slug;
}

/**
 * Get default folder for saving export. Folder will be created on export.
 *
 * The default folder is:
 * <root>/_build/exports/
 *
 * If the file is part of a project, the root is the project folder;
 * if not, the root is the file folder.
 */
export function getDefaultExportFolder(
  session: ISession,
  file: string,
  projectPath?: string,
  ext?: 'tex',
) {
  const subpaths = [projectPath || path.parse(file).dir, '_build', 'exports'];
  // Extra folder for tex export content
  if (ext === 'tex') subpaths.push(`${getDefaultExportFilename(session, file, projectPath)}_tex`);
  return path.join(...subpaths);
}
