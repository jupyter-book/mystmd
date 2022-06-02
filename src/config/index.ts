import fs from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { ISession } from '../session/types';
import { selectors } from '../store';
import { config } from '../store/local';
import { writeFileToFolder } from '../utils';
import {
  incrementOptions,
  Options,
  validateObjectKeys,
  validationError,
} from '../utils/validators';
import { Config, CURVENOTE_YML, ProjectConfig, SiteConfig, VERSION } from './types';
import { validateProjectConfig, validateSiteConfig } from './validators';

function emptyConfig(): Config {
  return {
    version: 1,
  };
}

type PartialSession = Pick<ISession, 'store' | 'log'>;

function readConfig(session: PartialSession, path: string) {
  const file = join(path, CURVENOTE_YML);
  if (!fs.existsSync(file)) throw Error(`Cannot find ${CURVENOTE_YML} in ${path}`);
  const conf = yaml.load(fs.readFileSync(file, 'utf-8'));
  const opts: Options = { logger: session.log, file, property: 'config', count: {} };
  const confObject = validateObjectKeys(
    conf,
    { required: ['version'], optional: ['site', 'project'] },
    opts,
  );
  if (confObject && confObject.version !== VERSION) {
    validationError(
      `"${confObject.version}" does not match ${VERSION}`,
      incrementOptions('version', opts),
    );
  }
  if (!confObject || opts.count.errors) throw Error(`Please address invalid config file ${file}`);
  return confObject;
}

/**
 * Load site/project config from local path to redux store
 *
 * Errors if config file does not exist or if config file exists but is invalid.
 */
export function loadConfigOrThrow(session: PartialSession, path: string) {
  const { project: rawProjectConfig, site: rawSiteConfig } = readConfig(session, path);
  const file = join(path, CURVENOTE_YML);
  if (path !== '.') {
    if (rawSiteConfig)
      session.log.debug(`Ignoring site config from non-current directory: ${path}`);
  } else if (rawSiteConfig) {
    const siteConfig = validateSiteConfig(rawSiteConfig, {
      logger: session.log,
      file,
      property: 'site',
      count: {},
    });
    if (!siteConfig) throw Error(`Please address invalid site config in ${file}`);
    session.store.dispatch(config.actions.receiveRawSite(rawSiteConfig));
    session.store.dispatch(config.actions.receiveSite(siteConfig));
    session.log.debug(`Loaded site config from ${file}`);
  } else {
    session.log.debug(`No site config in ${file}`);
  }
  if (rawProjectConfig) {
    const projectConfig = validateProjectConfig(rawProjectConfig, {
      logger: session.log,
      file,
      property: 'project',
      count: {},
    });
    if (!projectConfig) throw Error(`Please address invalid project config in ${file}`);
    session.store.dispatch(config.actions.receiveRawProject({ path, ...rawProjectConfig }));
    session.store.dispatch(config.actions.receiveProject({ path, ...projectConfig }));
    session.log.debug(`Loaded project config from ${file}`);
  } else {
    session.log.debug(`No project config defined in ${file}`);
  }
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
  // TODO: siteConfig -> rawSiteConfig before writing, don't lose extra keys in raw.
  //       also shouldn't need to re-readConfig...
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
