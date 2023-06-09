import type { ProjectConfig } from './project/index.js';
import type { SiteConfig } from './site/index.js';

export * from './project/index.js';
export * from './site/index.js';

export type Config = {
  version: 1;
  project?: ProjectConfig;
  site?: SiteConfig;
};
