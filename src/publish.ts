import { LaunchpadStatus, PubsubMessageAttributes } from './launchpad';
import { BaseLinks } from './types';

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
