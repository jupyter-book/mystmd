import fs from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { ISession } from '../session/types';
import { selectors } from '../store';
import { config } from '../store/local';
import { writeFileToFolder } from '../utils';
import { Config, ProjectConfig, SiteConfig } from './types';

export const CURVENOTE_YML = 'curvenote.yml';
export const VERSION = 1;

function emptyConfig(): Config {
  return {
    version: 1,
  };
}

type PartialSession = Pick<ISession, 'store' | 'log'>;

function validateConfig(session: PartialSession, incoming: unknown): Config {
  const start = incoming as Config;
  let site: Config['site'];
  let project: Config['project'];
  if (start.version !== VERSION) {
    throw new Error(
      `The versions in the ${CURVENOTE_YML} "${start.version}" does not match ${VERSION}`,
    );
  }
  if (start.site) {
    site = {
      ...start.site,
      projects: start.site.projects ?? [],
      nav: start.site.nav ?? [],
      actions: start.site.actions ?? [],
      domains: start.site.domains ?? [],
    };
  }
  if (start.project) {
    project = {
      ...start.project,
    };
  }
  return {
    version: VERSION,
    site,
    project,
  };
}

function readConfig(session: PartialSession, path: string) {
  const confFile = join(path, CURVENOTE_YML);
  if (!fs.existsSync(confFile)) throw Error(`Cannot find ${CURVENOTE_YML} in ${path}`);
  const conf = yaml.load(fs.readFileSync(confFile, 'utf-8'));
  return validateConfig(session, conf);
}

/**
 * Load project config from local path to redux store
 *
 * Returns loaded project config.
 *
 * Errors if config file does not exist or if config file exists but
 * does not contain project config.
 */
export function loadProjectConfigOrThrow(session: PartialSession, path: string): ProjectConfig {
  const { project } = readConfig(session, path);
  if (!project) throw Error(`No project config defined in ${join(path, CURVENOTE_YML)}`);
  session.store.dispatch(config.actions.receiveProject({ path, ...project }));
  return selectors.selectLocalProjectConfig(session.store.getState(), path) as ProjectConfig;
}

/**
 * Load site config from current directory to redux store
 *
 * Returns loaded site config.
 *
 * Errors if config file does not exist or if config file exists but
 * does not contain site config.
 */
export function loadSiteConfigOrThrow(session: PartialSession): SiteConfig {
  const { site } = readConfig(session, '.');
  if (!site) throw Error(`No site config in ${join('.', CURVENOTE_YML)}`);
  session.store.dispatch(config.actions.receiveSite(site));
  return selectors.selectLocalSiteConfig(session.store.getState()) as SiteConfig;
}

/**
 * Write site config to path
 *
 * If newConfig is provided, the redux store will be updated with this site
 * config before writing.
 *
 * If a config file exists on the path, this will override the
 * site portion of the config and leave the rest.
 *
 * Errors if site config is not present in redux store
 */
export function writeSiteConfig(session: PartialSession, path: string, newConfig?: SiteConfig) {
  if (newConfig) session.store.dispatch(config.actions.receiveSite(newConfig));
  const siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  if (!siteConfig) throw Error('no site config loaded into redux state');
  let conf;
  try {
    conf = readConfig(session, path);
  } catch {
    conf = emptyConfig();
  }
  conf.site = siteConfig;
  writeFileToFolder(join(path, CURVENOTE_YML), yaml.dump(conf), 'utf-8');
}

/**
 * Write project config to path
 *
 * If newConfig is provided, the redux store will be updated with this project
 * config before writing.
 *
 * If a config file exists on the path, this will override the
 * project portion of the config and leave the rest.
 *
 * Errors if project config is not present in redux store for the given path
 */
export function writeProjectConfig(
  session: PartialSession,
  path: string,
  newConfig?: ProjectConfig,
) {
  if (newConfig) session.store.dispatch(config.actions.receiveProject({ path, ...newConfig }));
  const projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), path);
  if (!projectConfig) throw Error(`no site config loaded for path ${projectConfig}`);
  let conf;
  try {
    conf = readConfig(session, path);
  } catch {
    conf = emptyConfig();
  }
  conf.project = projectConfig;
  writeFileToFolder(join(path, CURVENOTE_YML), yaml.dump(conf), 'utf-8');
}
