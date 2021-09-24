export interface JsonObject {
  [index: string]: any;
}

export type SpecificNetworkError = {
  path?: string;
  message?: string;
  errorCode?: string;
};

export type NetworkError = {
  status: number;
  message: string;
  errors?: SpecificNetworkError[];
};

export interface BaseLinks {
  self: string;
  html?: string;
}

export type BaseUrls = {
  app: string;
  users: string;
  teams: string;
  projects: string;
  profile: string;
  drafts: string;
  blocks: string;
  my: string;
};

export enum PendingStatus {
  pending = 'pending',
  failed = 'failed',
}

export enum TemplateStatus {
  Open = 'Open',
  Pro = 'Pro',
  Reqeust = 'Request',
}

export interface Template {
  id: string;
  commit: string;
  description: string;
  author: {
    name: string;
    github: string;
    twitter: string;
    affiliation: string;
  };
  contributor: {
    name: string;
    github: string;
    twitter: string;
    affiliation: string;
  };
  title: string;
  tags: string[];
  source: string;
  license: string;
  links: {
    self: string;
    source?: string;
    github?: string;
    thumbnail?: string;
  };
  status?: TemplateStatus;
}
