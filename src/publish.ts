import { getDate } from './helpers';
import { LaunchpadStatus, PubsubMessageAttributes } from './launchpad';
import { BaseLinks, JsonObject } from './types';

export interface SitePublishLinks extends BaseLinks {
  site: string;
  project: string;
}

export type SitePublishId = {
  site: string;
  publish: string;
};

export interface SitePublish {
  id: SitePublishId;
  status: LaunchpadStatus;
  cdn?: string;
  created_by: string;
  date_created: Date;
  date_modified: Date;
  links: SitePublishLinks;
}

export type SitePublishMessageAttributes = PubsubMessageAttributes & {
  action: 'publish';
  site: string;
};

export function sitePublishFromDTO(json: JsonObject): SitePublish {
  return {
    id: json.id,
    created_by: json.created_by ?? '',
    cdn: json.cdn ?? '',
    status: json.status ?? '',
    date_created: getDate(json.date_created),
    date_modified: getDate(json.date_modified),
    links: { ...json.links },
  };
}
