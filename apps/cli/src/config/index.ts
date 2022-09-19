import fs from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import type { ValidationOptions } from 'simple-validators';
import { incrementOptions, validateKeys, validateObject, validationError } from 'simple-validators';
import { validateSiteConfig } from '@curvenote/blocks';
import { prepareToWrite } from '../frontmatter';
import type { ISession } from '../session/types';
import { selectors } from '../store';
import { config } from '../store/local';
import { writeFileToFolder } from '../utils';
import type { Config } from './types';
import { CURVENOTE_YML, VERSION } from './types';
import { validateProjectConfig } from './validators';

function emptyConfig(): Config {
  return {
    version: 1,
  };
}

type PartialSession = Pick<ISession, 'store' | 'log'>;

function configFile(path: string) {
  return join(path, CURVENOTE_YML);
}

function configFileExists(path: string) {
  return fs.existsSync(configFile(path));
}

function readConfig(session: PartialSession, path: string) {
  if (!configFileExists(path)) throw Error(`Cannot find ${CURVENOTE_YML} in ${path}`);
  const file = configFile(path);
  const opts: ValidationOptions = {
    file,
    property: 'config',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: "${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: "${message}`);
    },
  };
  const conf = validateObject(yaml.load(fs.readFileSync(file, 'utf-8')), opts);
  if (conf) {
    const filteredConf = validateKeys(
      conf,
      { required: ['version'], optional: ['site', 'project'] },
      opts,
    );
    if (filteredConf && filteredConf.version !== VERSION) {
      validationError(
        `"${filteredConf.version}" does not match ${VERSION}`,
        incrementOptions('version', opts),
      );
    }
  }
  if (!conf || opts.messages.errors) throw Error(`Please address invalid config file ${file}`);
  // Keep original config object with extra keys, etc.
  if (conf.site?.frontmatter) {
    session.log.warn(
      `Frontmatter fields should be defined directly on site, not nested under "${file}#site.frontmatter"`,
    );
    const { frontmatter, ...rest } = conf.site;
    conf.site = { ...frontmatter, ...rest };
  }
  if (conf.project?.frontmatter) {
    session.log.warn(
      `Frontmatter fields should be defined directly on project, not nested under "${file}#project.frontmatter"`,
    );
    const { frontmatter, ...rest } = conf.project;
    conf.project = { ...frontmatter, ...rest };
  }
  return conf;
}

function validateSiteConfigAndSave(
  session: PartialSession,
  rawSiteConfig: Record<string, any>,
  file?: string,
) {
  const siteConfig = validateSiteConfig(rawSiteConfig, {
    file,
    property: 'site',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: "${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: "${message}`);
    },
  });
  if (!siteConfig) {
    const errorSuffix = file ? ` in ${file}` : '';
    throw Error(`Please address invalid site config${errorSuffix}`);
  }
  session.store.dispatch(config.actions.receiveSite(siteConfig));
}

function validateProjectConfigAndSave(
  session: PartialSession,
  path: string,
  rawProjectConfig: Record<string, any>,
  file?: string,
) {
  const projectConfig = validateProjectConfig(rawProjectConfig, {
    file,
    property: 'project',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: "${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: "${message}`);
    },
  });
  if (!projectConfig) {
    const errorSuffix = file ? ` in ${file}` : '';
    throw Error(`Please address invalid project config${errorSuffix}`);
  }
  session.store.dispatch(config.actions.receiveProject({ path, ...projectConfig }));
}

/**
 * Load site/project config from local path to redux store
 *
 * Errors if config file does not exist or if config file exists but is invalid.
 */
export function loadConfigOrThrow(session: PartialSession, path: string) {
  const conf = readConfig(session, path);
  session.store.dispatch(config.actions.receiveRawConfig({ path, ...conf }));
  const file = join(path, CURVENOTE_YML);
  const { site, project } = conf;
  if (path !== '.') {
    if (site) session.log.debug(`Ignoring site config from non-current directory: ${path}`);
  } else if (site) {
    validateSiteConfigAndSave(session, site, file);
    session.log.debug(`Loaded site config from ${file}`);
  } else {
    session.log.debug(`No site config in ${file}`);
  }
  if (project) {
    validateProjectConfigAndSave(session, path, project, file);
    session.log.debug(`Loaded project config from ${file}`);
  } else {
    session.log.debug(`No project config defined in ${file}`);
  }
}

/**
 * Write config to path
 *
 * If path is '.' write site config and project config, if available. For all other
 * paths, only write project config.
 *
 * If newConfigs are provided, the redux store will be updated with these
 * configs before writing.
 *
 * If a config file exists on the path, this will override the
 * site portion of the config and leave the rest.
 */
export function writeConfigs(
  session: PartialSession,
  path: string,
  newConfigs?: {
    siteConfig?: Record<string, any>;
    projectConfig?: Record<string, any>;
  },
) {
  // TODO: siteConfig -> rawSiteConfig before writing, don't lose extra keys in raw.
  //       also shouldn't need to re-readConfig...
  let { siteConfig, projectConfig } = newConfigs || {};
  if (path !== '.' && siteConfig) throw Error('path must be "." when writing a new site config');
  const file = configFile(path);
  // Get site config to save
  if (path === '.') {
    if (siteConfig) validateSiteConfigAndSave(session, siteConfig);
    siteConfig = selectors.selectLocalSiteConfig(session.store.getState());
  }
  // Get project config to save
  if (projectConfig) validateProjectConfigAndSave(session, path, projectConfig);
  projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), path);
  if (projectConfig) {
    projectConfig = prepareToWrite(projectConfig);
  }
  // Return early if nothing new to save
  if (!siteConfig && !projectConfig) {
    session.log.debug(`No new config to write to ${file}`);
    return;
  }
  // Get raw config to override
  let rawConfig = selectors.selectLocalRawConfig(session.store.getState(), path);
  if (!rawConfig && configFileExists(path)) {
    rawConfig = readConfig(session, path);
  } else if (!rawConfig) {
    rawConfig = emptyConfig();
  }
  let logContent: string;
  if (siteConfig && projectConfig) {
    logContent = 'site and project configs';
  } else if (siteConfig) {
    logContent = 'site config';
  } else {
    logContent = 'project config';
  }
  session.log.debug(`Writing ${logContent} to ${file}`);
  // Combine site/project configs with
  const newConfig = { ...rawConfig };
  if (siteConfig) newConfig.site = { ...rawConfig.site, ...siteConfig };
  if (projectConfig) newConfig.project = { ...rawConfig.project, ...projectConfig };
  writeFileToFolder(configFile(path), yaml.dump(newConfig), 'utf-8');
}
