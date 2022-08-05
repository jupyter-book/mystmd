import type { JsonObject, BaseLinks } from './types';
import { getDate } from './helpers';
import type { Affiliation } from './blocks/types';
import { CitationStyles, CustomizableReferenceKind } from './blocks/types';
import type { ProjectFrontMatterProps } from './blocks/types/frontMatter';
import { extractProjectFrontMatter } from './blocks/utils';

export interface ProjectLinks extends BaseLinks {
  thumbnail?: string;
  access: string;
  blocks: string;
  team: string;
  manifest?: string;
  site: string;
}

export type ReferenceLabelMap = Record<CustomizableReferenceKind, string>;
export interface PartialProject extends ProjectFrontMatterProps {
  team: string;
  name: string;
  title: string;
  description: string;
  visibility: ProjectVisibility;
  affiliations: Affiliation[];
  settings: {
    citation_style: CitationStyles;
    reference_labels: ReferenceLabelMap;
  };
}

export const DEFAULT_REFERENCE_LABEL_MAP: ReferenceLabelMap = {
  [CustomizableReferenceKind.fig]: 'Figure %s',
  [CustomizableReferenceKind.eq]: 'Equation %s',
  [CustomizableReferenceKind.sec]: 'Section %s',
  [CustomizableReferenceKind.table]: 'Table %s',
  [CustomizableReferenceKind.code]: 'Program %s',
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
function projectSettingsFromDTO(settings?: JsonObject): Project['settings'] {
  const reference_labels = Object.fromEntries(
    Object.entries(DEFAULT_REFERENCE_LABEL_MAP).map(([k, v]) => [
      k,
      settings?.reference_labels?.[k] ?? v,
    ]),
  ) as ReferenceLabelMap;
  return {
    citation_style: settings?.citation_style ?? DEFAULT_CITATION_STYLE,
    reference_labels,
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
    affiliations: json.affiliations ? [...json.affiliations] : [],
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    settings: projectSettingsFromDTO(json.settings),
    links: { ...json.links },
    ...extractProjectFrontMatter(json),
  };
}
