import fs from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

import type { Store } from 'redux';
import { RootState, selectors } from './store';
import { config } from './store/local';
import type { Config, ProjectConfig, SiteConfig } from './types';

export const CURVENOTE_YML = 'curvenote.yml';

function emptyConfig(): Config {
  return {
    version: 1,
  };
}

function validateConfig(conf: unknown) {
  return conf as Config;
}

function readConfig(path: string) {
  const confFile = join(path, CURVENOTE_YML);
  if (!fs.existsSync(confFile)) throw Error(`cannot find ${CURVENOTE_YML} in ${path}`);
  const conf = yaml.load(fs.readFileSync(confFile, 'utf-8'));
  return validateConfig(conf);
}

/**
 * Load project config from local path to redux store
 *
 * Returns loaded project config.
 *
 * Errors if config file does not exist or if config file exists but
 * does not contain project config.
 */
export function loadProjectConfig(store: Store<RootState>, path: string) {
  const { project } = readConfig(path);
  if (!project) throw Error(`No project config in ${join(path, CURVENOTE_YML)}`);
  store.dispatch(config.actions.receiveProject({ path, ...project }));
  return selectors.selectLocalProjectConfig(store.getState(), path);
}

/**
Load site config from current directory to redux store
 *
 * Returns loaded site config.
 *
 * Errors if config file does not exist or if config file exists but
 * does not contain site config.
 */
export function loadSiteConfig(store: Store<RootState>) {
  const { site } = readConfig('.');
  if (!site) throw Error(`no site config in ${join('.', CURVENOTE_YML)}`);
  store.dispatch(config.actions.receiveSite(site));
  return selectors.selectLocalSiteConfig(store.getState());
}

/**
Save project config to redux store
 *
 * Returns saved project config.
 *
 * Errors if `initialize` is true and the project config already exists for the given path
 */
export function saveProjectConfig(
  store: Store<RootState>,
  path: string,
  projectConfig: ProjectConfig,
  initialize?: boolean,
) {
  if (initialize && selectors.selectLocalProjectConfig(store.getState(), path)) {
    throw Error(`Project config already exists on path ${path}`);
  }
  store.dispatch(config.actions.receiveProject({ path, ...projectConfig }));
  return selectors.selectLocalProjectConfig(store.getState(), path);
}

/**
Save site config to redux store
 *
 * Returns saved site config.
 *
 * Errors if `initialize` is true and site config already exists
 */
export function saveSiteConfig(
  store: Store<RootState>,
  siteConfig: SiteConfig,
  initialize?: boolean,
) {
  if (initialize && selectors.selectLocalSiteConfig(store.getState())) {
    throw Error('Site config already exists');
  }
  store.dispatch(config.actions.receiveSite(siteConfig));
  return selectors.selectLocalSiteConfig(store.getState());
}

/**
Write site config to path
 *
 * If a config file exists on the path, this will override the
 * site portion of the config and leave the rest.
 *
 * Errors if site config is not present in redux store
 */
export function writeSiteConfig(state: RootState, path: string) {
  const siteConfig = selectors.selectLocalSiteConfig(state);
  if (!siteConfig) throw Error('no site config loaded');
  let conf;
  try {
    conf = readConfig(path);
  } catch {
    conf = emptyConfig();
  }
  conf.site = siteConfig;
  fs.writeFileSync(join(path, CURVENOTE_YML), yaml.dump(conf), 'utf-8');
}

/**
 * Write project config to path
 *
 * If a config file exists on the path, this will override the
 * project portion of the config and leave the rest.
 *
 * Errors if project config is not present in redux store for the given path
 */
export function writeProjectConfig(state: RootState, path: string) {
  const projectConfig = selectors.selectLocalProjectConfig(state, path);
  if (!projectConfig) throw Error(`no site config loaded for path ${projectConfig}`);
  let conf;
  try {
    conf = readConfig(path);
  } catch {
    conf = emptyConfig();
  }
  conf.project = projectConfig;
  fs.writeFileSync(join(path, CURVENOTE_YML), yaml.dump(conf), 'utf-8');
}
