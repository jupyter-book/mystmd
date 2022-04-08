import { Project } from '../models';

export function projectLogString(project: Project) {
  return `"${project.data.title}" (@${project.data.team}/${project.data.name})`;
}
