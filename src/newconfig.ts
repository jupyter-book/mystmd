import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

import type { Store } from 'redux';
import type { RootState } from './store';
import { config } from './store/local';
import type { Config } from './types';

export const CONFIG_FILE = 'curvenote.yml';

const DEFAULT_PROJECT_CONFIG = {
  folder: '.',
};

const DEFAULT_SITE_CONFIG = {
  domains: [],
  projects: [
    {
      path: '.',
      slug: 'my-proj',
    },
  ],
  nav: [],
  actions: [],
};

export function loadConfig(folder: string) {
  // Check file, validate config
  const configLoaded = yaml.load(fs.readFileSync(path.join(folder, CONFIG_FILE), 'utf-8'));
  return configLoaded as Config;
}

export function updateSiteConfig(store: Store<RootState>, folder?: string) {
  // Config should only be changed by users -
  // store should never receive changes outside of file changes
  folder = folder || '.';
  const { site } = loadConfig(folder);
  if (site) store.dispatch(config.actions.recieveSite(site));
}

export function initializeQuickstartConfig(folder: string) {
  // Write some comment lines to document different fields
  const file = path.join(folder, CONFIG_FILE);
  if (fs.existsSync(file)) return;
  const configDefault = {
    version: 1,
    project: DEFAULT_PROJECT_CONFIG,
    site: DEFAULT_SITE_CONFIG,
  };
  fs.writeFileSync(file, yaml.dump(configDefault));
}
