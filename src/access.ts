import { JsonObject, BaseLinks } from './types';
import { getDate } from './helpers';
import { ROLES } from './roles';

export enum ACLType {
  'Project' = 'Project',
  'Team' = 'Team',
}

export interface ProjectAccessLinks extends BaseLinks {
  project: string;
  user?: string;
}

export interface TeamAccessLinks extends BaseLinks {
  user: string;
}

export enum AccessKinds {
  'user' = 'user',
  'manifest' = 'manifest',
}

export type TeamAccessId = {
  team: string;
  user: string;
};

export type ProjectAccessId = {
  project: string;
  user: string;
};

export type ManifestId = {
  project: string;
  user: null;
};

export type AccessId = ProjectAccessId | TeamAccessId | ManifestId;

export interface PartialAccess {
  id: AccessId;
  role: ROLES;
  team_member?: boolean;
  direct: { [id: string]: AccessGrantDirect };
  nested: { [id: string]: AccessGrantNested };
}

export interface Access extends PartialAccess {
  kind: AccessKinds;
  date_created: Date;
  date_modified: Date;
  links: ProjectAccessLinks | TeamAccessLinks;
}

interface BaseAccessGrant {
  granted_by: string;
  granted_on: Date;
}

export interface AccessGrantDirect extends BaseAccessGrant {
  grant: string;
}

export interface AccessGrantNested extends BaseAccessGrant {
  grant: string;
  children: string[];
}

/*
  Grants access to the container and listed children or the direct block
  Grant id examples:

    {project}.{block}.{version}
*/

export interface Manifest extends Access {
  id: ManifestId;
  kind: AccessKinds.manifest;
  role: ROLES.manifest;
}

function directManifestFromDTO(json?: JsonObject): { [id: string]: AccessGrantDirect } {
  return Object.fromEntries(
    Object.keys(json ?? {}).map((grant: string) => [
      grant,
      {
        granted_by: json?.[grant].granted_by,
        granted_on: getDate(json?.[grant].granted_on),
        grant,
      },
    ]),
  );
}

function nestedManifestFromDTO(json?: JsonObject): { [id: string]: AccessGrantNested } {
  return Object.fromEntries(
    Object.keys(json ?? {}).map((grant: string) => [
      grant,
      {
        granted_by: json?.[grant].granted_by,
        granted_on: getDate(json?.[grant].granted_on),
        grant,
        children: [...json?.[grant].children],
      },
    ]),
  );
}

export function accessFromDTO(id: ProjectAccessId | TeamAccessId, json: JsonObject): Access {
  const newId =
    'team' in id
      ? ({ team: id.team, user: id.user } as TeamAccessId)
      : ({ project: id.project, user: id.user } as ProjectAccessId);
  return {
    id: newId,
    kind: json.kind ?? AccessKinds.user,
    role: json.role ?? '',
    team_member: json.team_member ?? false,
    direct: directManifestFromDTO(json.direct ?? {}),
    nested: nestedManifestFromDTO(json.nested ?? {}),
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    links: { ...json.links },
  };
}
