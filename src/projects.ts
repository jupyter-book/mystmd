import { JsonObject, BaseLinks } from './types';
import { getDate } from './helpers';
import { CitationStyles } from './blocks/types';

export interface ProjectLinks extends BaseLinks {
  thumbnail?: string;
  access: string;
  blocks: string;
  team: string;
  manifest?: string;
}

export interface PartialProject {
  team: string;
  name: string;
  title: string;
  description: string;
  visibility: ProjectVisibility;
  settings: {
    citation_style: CitationStyles;
  };
}

export type ProjectId = string;

export enum ProjectVisibility {
  'public' = 'public',
  'manifest' = 'manifest',
  'private' = 'private',
}

export interface Project extends PartialProject {
  id: ProjectId;
  created_by: string;
  date_created: Date;
  date_modified: Date;
  links: ProjectLinks;
}

export const DEFAULT_CITATION_STYLE = CitationStyles.apa;

export function projectFromDTO(projectId: ProjectId, json: JsonObject): Project {
  return {
    id: projectId,
    team: json.team ?? '',
    name: json.name ?? '',
    created_by: json.created_by ?? '',
    title: json.title ?? '',
    description: json.description ?? '',
    visibility: json.visibility ?? ProjectVisibility.private,
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    links: { ...json.links },
    settings: json.settings ?? {
      citation_style: DEFAULT_CITATION_STYLE,
    },
  };
}

export function cleanProjectForPosting(project: Project): Record<keyof PartialProject, any> {
  return {
    team: project.team,
    name: project.name,
    title: project.title,
    description: project.description,
    visibility: project.visibility,
    settings: project.settings,
  };
}
