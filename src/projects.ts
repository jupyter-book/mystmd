import { JsonObject, BaseLinks } from './types';
import { getDate } from './helpers';
import { CitationStyles } from './blocks/types';
import { ReferenceKind } from './blocks/types';

export interface ProjectLinks extends BaseLinks {
  thumbnail?: string;
  access: string;
  blocks: string;
  team: string;
  manifest?: string;
}

export type CustomizableReferenceKind = Exclude<
  ReferenceKind,
  ReferenceKind.cite | ReferenceKind.link
>;
export type ReferenceLabelMap = Record<CustomizableReferenceKind, string>;
export interface PartialProject {
  team: string;
  name: string;
  title: string;
  description: string;
  visibility: ProjectVisibility;
  settings: {
    citation_style: CitationStyles;
    reference_labels: ReferenceLabelMap
  };
}
export const DEFAULT_REFERENCE_LABEL_MAP: ReferenceLabelMap = {
  [ReferenceKind.fig]: 'Figure %s',
  [ReferenceKind.eq]: 'Equation %s',
  [ReferenceKind.sec]: 'Section %s',
  [ReferenceKind.table]: 'Table %s',
  [ReferenceKind.code]: 'Program %s',
};

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
function projectSettingsFromDTO(settings?: Partial<Project['settings']>): Project['settings'] {
  return {
    citation_style: settings?.citation_style ?? DEFAULT_CITATION_STYLE,
    reference_labels: settings?.reference_labels ?? DEFAULT_REFERENCE_LABEL_MAP,
  };
}

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
    settings: projectSettingsFromDTO(json.settings),
    links: { ...json.links },
  };
}
