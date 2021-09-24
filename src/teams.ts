import { getDate } from './helpers';
import { ROLES } from './roles';
import { BaseLinks, JsonObject } from './types';

export interface TeamLinks extends BaseLinks {
  access?: string;
  photo?: string;
  banner?: string;
  projects: string;
}

export interface PartialTeam {
  username: string;
  display_name: string;
  description: string;
  location: string;
  website: string;
  affiliation: string;
  twitter: string;
  github: string;
}

export type TeamId = string;

export interface Team extends PartialTeam {
  id: TeamId;
  date_created: Date;
  links: TeamLinks;
}

export interface TeamMember {
  user: string;
  role: ROLES;
}

export function teamFromDTO(id: string, json: JsonObject): Team {
  return {
    id,
    username: json.username ?? '',
    display_name: json.display_name ?? '',
    description: json.description ?? '',
    location: json.location ?? '',
    website: json.website ?? '',
    affiliation: json.affiliation ?? '',
    twitter: json.twitter ?? '',
    github: json.github ?? '',
    date_created: getDate(json.date_created),
    links: { ...json.links },
  };
}
