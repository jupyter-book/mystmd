import fs from 'fs';
import { dirname, join, resolve } from 'path';
import yaml from 'js-yaml';
import { writeFileToFolder } from 'myst-cli-utils';
import type { Config, SiteProject } from 'myst-config';
import { validateProjectConfig, validateSiteConfig } from 'myst-config';
import type { ValidationOptions } from 'simple-validators';
import { incrementOptions, validateKeys, validateObject, validationError } from 'simple-validators';
import { prepareToWrite } from './frontmatter';
import type { ISession } from './session/types';
import { selectors } from './store';
import { config } from './store/reducers';

const VERSION = 1;

function emptyConfig(): Config {
  return {
    version: VERSION,
  };
}

function defaultConfigFile(session: ISession, path: string) {
  return join(path, session.configFiles[0]);
}

export function configFromPath(session: ISession, path: string) {
  const configs = session.configFiles
    .map((file) => {
      return join(path, file);
    })
    .filter((file) => {
      return fs.existsSync(file);
    });
  if (configs.length > 1) throw Error(`Multiple config files in ${path}`);
  if (configs.length === 0) return undefined;
  return configs[0];
}

export function readConfig(session: ISession, file: string) {
  if (!fs.existsSync(file)) throw Error(`Cannot find config file: ${file}`);
  const opts: ValidationOptions = {
    file,
    property: 'config',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
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
  if (conf.site?.logoText) {
    session.log.warn(`logoText is deprecated, please use logo_text in "${file}#site"`);
    const { logoText, ...rest } = conf.site;
    conf.site = { logo_text: logoText, ...rest };
  }
  return conf;
}

function validateSiteConfigAndSave(
  session: ISession,
  path: string,
  file: string,
  rawSiteConfig: Record<string, any>,
) {
  const siteConfig = validateSiteConfig(rawSiteConfig, {
    file,
    property: 'site',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
    },
  });
  if (!siteConfig) {
    const errorSuffix = file ? ` in ${file}` : '';
    throw Error(`Please address invalid site config${errorSuffix}`);
  }
  // TODO: Use real path as argument to this function...
  session.store.dispatch(config.actions.receiveSiteConfig({ path, ...siteConfig }));
}

function validateProjectConfigAndSave(
  session: ISession,
  path: string,
  file: string,
  rawProjectConfig: Record<string, any>,
) {
  const projectConfig = validateProjectConfig(rawProjectConfig, {
    file,
    property: 'project',
    messages: {},
    errorLogFn: (message: string) => {
      session.log.error(`Validation error: ${message}`);
    },
    warningLogFn: (message: string) => {
      session.log.warn(`Validation: ${message}`);
    },
  });
  if (!projectConfig) {
    const errorSuffix = file ? ` in ${file}` : '';
    throw Error(`Please address invalid project config${errorSuffix}`);
  }
  session.store.dispatch(config.actions.receiveProjectConfig({ path, ...projectConfig }));
}

/**
 * Load site/project config from local path to redux store
 *
 * Errors if config file does not exist or if config file exists but is invalid.
 */
export function loadConfigAndValidateOrThrow(session: ISession, path: string) {
  const file = configFromPath(session, path);
  if (!file) {
    session.log.debug(`No config loaded from path: ${path}`);
    return;
  }
  const conf = readConfig(session, file);
  session.store.dispatch(config.actions.receiveRawConfig({ path, file, ...conf }));
  const { site, project } = conf;
  if (site) {
    validateSiteConfigAndSave(session, path, file, site);
    session.log.debug(`Loaded site config from ${file}`);
  } else {
    session.log.debug(`No site config in ${file}`);
  }
  if (project) {
    validateProjectConfigAndSave(session, path, file, project);
    session.log.debug(`Loaded project config from ${file}`);
  } else {
    session.log.debug(`No project config defined in ${file}`);
  }
}

/**
 * Write site config and config to path, if available
 *
 * If newConfigs are provided, the redux store will be updated with these
 * configs before writing.
 *
 * If a config file exists on the path, this will override the
 * site portion of the config and leave the rest.
 */
export function writeConfigs(
  session: ISession,
  path: string,
  newConfigs?: {
    siteConfig?: Record<string, any>;
    projectConfig?: Record<string, any>;
  },
) {
  // TODO: siteConfig -> rawSiteConfig before writing, don't lose extra keys in raw.
  //       also shouldn't need to re-readConfig...
  let { siteConfig, projectConfig } = newConfigs || {};
  const file = configFromPath(session, path) || defaultConfigFile(session, path);
  // Get site config to save
  if (siteConfig) validateSiteConfigAndSave(session, path, file, siteConfig);
  siteConfig = selectors.selectLocalSiteConfig(session.store.getState(), path);
  // Get project config to save
  if (projectConfig) validateProjectConfigAndSave(session, path, file, projectConfig);
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
  if (!rawConfig && configFromPath(session, path)) {
    rawConfig = readConfig(session, file);
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
  writeFileToFolder(file, yaml.dump(newConfig), 'utf-8');
}

export async function findCurrentProjectAndLoad(
  session: ISession,
  path: string,
): Promise<string | undefined> {
  path = resolve(path);
  if (configFromPath(session, path)) {
    loadConfigAndValidateOrThrow(session, path);
    const project = selectors.selectLocalProjectConfig(session.store.getState(), path);
    if (project) {
      session.store.dispatch(config.actions.receiveCurrentProjectPath({ path: path }));
      return path;
    }
  }
  if (dirname(path) === path) {
    return undefined;
  }
  return findCurrentProjectAndLoad(session, dirname(path));
}

export async function findCurrentSiteAndLoad(
  session: ISession,
  path: string,
): Promise<string | undefined> {
  path = resolve(path);
  if (configFromPath(session, path)) {
    loadConfigAndValidateOrThrow(session, path);
    const site = selectors.selectLocalSiteConfig(session.store.getState(), path);
    if (site) {
      session.store.dispatch(config.actions.receiveCurrentSitePath({ path: path }));
      return path;
    }
  }
  if (dirname(path) === path) {
    return undefined;
  }
  return findCurrentSiteAndLoad(session, dirname(path));
}

export function loadAllConfigsForCurrentSite(session: ISession) {
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig?.projects) return;
  siteConfig.projects
    .filter((project): project is SiteProject & { path: string } => {
      return Boolean(project.path);
    })
    .forEach((project) => {
      const resolvedPath = resolve(
        selectors.selectCurrentSitePath(session.store.getState()) ?? '.',
        project.path,
      );
      try {
        loadConfigAndValidateOrThrow(session, resolvedPath);
      } catch (error) {
        // TODO: what error?
        session.log.debug(`Failed to find or load project config from "${resolvedPath}"`);
      }
    });
}
