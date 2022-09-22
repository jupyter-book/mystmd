import path from 'path';
import type { ISession } from '../../session/types';
import { selectPageSlug } from '../../store/selectors';
import { createSlug } from '../../toc/utils';

/**
 * Get default folder for saving export. Folder will be created on export.
 *
 * The default folder is:
 * <root>/_build/exports/
 *
 * If the file is part of a project, the root is the project folder;
 * if not, the root is the file folder.
 */
export function getDefaultExportFolder(session: ISession, file: string, projectPath?: string) {
  const { dir } = path.parse(file);
  const buildSubpath = path.join('_build', 'exports');
  return path.join(projectPath || dir, buildSubpath);
}

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
