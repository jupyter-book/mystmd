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

export interface TemplateSpec {
  metadata: Template;
  config: TemplateConfig;
}

// TODO This could be more strictly typed
// https://github.com/curvenote/curvenote-template/blob/main/curvenote_template/schema/config.schema.yml
export interface TemplateConfig {
  build: Record<string, string | boolean>;
  schema: Record<string, string | boolean>;
  tagged: TaggedBlockDefinition[];
  options: UserOptionDefinition[];
}

export interface TaggedBlockDefinition {
  id: string;
  title: string;
  tag: string;
  required: boolean;
  description: string;
  condition?: {
    option: string;
    value: string;
  };
}

// NOTE: values here must match template schema option types exactly
export enum UserOptionType {
  'Boolean' = 'bool',
  'String' = 'str',
  'Choice' = 'choice',
  'CorrespondingAuthor' = 'corresponding_author',
  'Keywords' = 'keywords',
}

export interface UserOptionDefinition {
  id: string;
  type: UserOptionType;
  title: string;
  description: string;
  required: boolean;
  properties?: string[];
  options?: string[];
  default?: string;
  multiple?: boolean;
  condition?: {
    option: string;
    value: string;
  };
}
