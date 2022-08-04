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
  sites: string;
  my: string;
};

export enum PendingStatus {
  pending = 'pending',
  failed = 'failed',
}
