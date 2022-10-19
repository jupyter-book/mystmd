import type { ProjectConfig } from './project';
import type { SiteConfig } from './site';

export * from './project';
export * from './site';

export type Config = {
  version: 1;
  project?: ProjectConfig;
  site?: SiteConfig;
};
