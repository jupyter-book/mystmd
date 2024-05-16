import fs from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import yaml from 'js-yaml';
import { writeFileToFolder } from 'myst-cli-utils';
import { fileError, fileWarn, RuleId } from 'myst-common';
import type { Config, ProjectConfig, SiteConfig, SiteProject } from 'myst-config';
import { validateProjectConfig, validateSiteConfig } from 'myst-config';
import type { ValidationOptions } from 'simple-validators';
import {
  incrementOptions,
  validateObjectKeys,
  validationError,
  validateList,
  validateString,
} from 'simple-validators';
import { VFile } from 'vfile';
import { prepareToWrite } from './frontmatter.js';
import type { ISession } from './session/types.js';
import { selectors } from './store/index.js';
import { config } from './store/reducers.js';
import { logMessagesFromVFile } from './utils/logging.js';
import { addWarningForFile } from './utils/addWarningForFile.js';

const VERSION = 1;

function emptyConfig(): Config {
  return {
    version: VERSION,
  };
}

export function defaultConfigFile(session: ISession, path: string) {
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

/**
 * Load config yaml file and throw error if it fails
 */
function loadConfigYaml(file: string) {
  if (!fs.existsSync(file)) throw Error(`Cannot find config file: ${file}`);
  let rawConf: Record<string, any>;
  try {
    rawConf = yaml.load(fs.readFileSync(file, 'utf-8')) as Record<string, any>;
  } catch (err) {
    const suffix = (err as Error).message ? `\n\n${(err as Error).message}` : '';
    throw Error(`Unable to read config file ${file} as YAML${suffix}`);
  }
  return rawConf;
}

/**
 * Helper function to generate basic validation options
 */
function configValidationOpts(vfile: VFile, property: string, ruleId: RuleId): ValidationOptions {
  return {
    file: vfile.path,
    property,
    messages: {},
    errorLogFn: (message: string) => {
      fileError(vfile, message, { ruleId });
    },
    warningLogFn: (message: string) => {
      fileWarn(vfile, message, { ruleId });
    },
  };
}

/**
 * Load and validate a file as yaml config file
 *
 * Returns validated site and project configs.
 *
 * Throws errors config file is malformed or invalid.
 */
function getValidatedConfigsFromFile(session: ISession, file: string) {
  const vfile = new VFile();
  vfile.path = file;
  const opts = configValidationOpts(vfile, 'config', RuleId.validConfigStructure);
  const conf = validateObjectKeys(
    loadConfigYaml(file),
    {
      required: ['version'],
      optional: ['site', 'project', 'extend'],
      alias: { extends: 'extend' },
    },
    opts,
  );
  if (conf && conf.version !== VERSION) {
    validationError(
      `"${conf.version}" does not match ${VERSION}`,
      incrementOptions('version', opts),
    );
  }
  logMessagesFromVFile(session, vfile);
  if (!conf || opts.messages.errors) {
    throw Error(`Please address invalid config file ${file}`);
  }
  // Keep original config object with extra keys, etc.
  if (conf.site?.frontmatter) {
    fileWarn(
      vfile,
      `Frontmatter fields should be defined directly on site, not nested under "${file}#site.frontmatter"`,
      { ruleId: RuleId.configHasNoDeprecatedFields },
    );
    const { frontmatter, ...rest } = conf.site;
    conf.site = { ...frontmatter, ...rest };
  }
  if (conf.project?.frontmatter) {
    fileWarn(
      vfile,
      `Frontmatter fields should be defined directly on project, not nested under "${file}#project.frontmatter"`,
      { ruleId: RuleId.configHasNoDeprecatedFields },
    );
    const { frontmatter, ...rest } = conf.project;
    conf.project = { ...frontmatter, ...rest };
  }
  if (conf.site?.logoText) {
    fileWarn(vfile, `logoText is deprecated, please use logo_text in "${file}#site"`, {
      ruleId: RuleId.configHasNoDeprecatedFields,
    });
    const { logoText, ...rest } = conf.site;
    conf.site = { logo_text: logoText, ...rest };
  }
  const extend = validateList(
    conf.extend,
    { coerce: true, ...incrementOptions('extend', opts) },
    (item, index) => {
      const relativeFile = validateString(item, incrementOptions(`extend.${index}`, opts));
      if (!relativeFile) return relativeFile;
      return resolveToAbsolute(session, dirname(file), relativeFile);
    },
  );
  const { site: rawSite, project: rawProject } = conf ?? {};
  const path = dirname(file);
  let site: SiteConfig | undefined;
  let project: ProjectConfig | undefined;
  if (rawSite) {
    site = validateSiteConfigAndThrow(session, path, vfile, rawSite);
    session.log.debug(`Loaded site config from ${file}`);
  } else {
    session.log.debug(`No site config in ${file}`);
  }
  if (rawProject) {
    project = validateProjectConfigAndThrow(session, path, vfile, rawProject);
    session.log.debug(`Loaded project config from ${file}`);
  } else {
    session.log.debug(`No project config defined in ${file}`);
  }
  logMessagesFromVFile(session, vfile);
  return { site, project };
}

/**
 * Load site/project config from local path to redux store
 *
 * Errors if config file does not exist or if config file exists but is invalid.
 */
export function loadConfig(session: ISession, path: string) {
  const file = configFromPath(session, path);
  if (!file) {
    session.log.debug(`No config loaded from path: ${path}`);
    return;
  }
  const rawConf = loadConfigYaml(file);
  const existingConf = selectors.selectLocalRawConfig(session.store.getState(), path);
  if (existingConf && JSON.stringify(rawConf) === JSON.stringify(existingConf.raw)) {
    return existingConf.validated;
  }
  const { site, project } = getValidatedConfigsFromFile(session, file);
  session.store.dispatch(
    config.actions.receiveRawConfig({ path, file, raw: rawConf, validated: { site, project } }),
  );
  if (site) saveSiteConfig(session, path, site);
  if (project) saveProjectConfig(session, path, project);
  return { site, project };
}

export function resolveToAbsolute(
  session: ISession,
  basePath: string,
  relativePath: string,
  checkExists = true,
) {
  let message: string;
  try {
    const absPath = resolve(join(basePath, relativePath));
    if (!checkExists || fs.existsSync(absPath)) {
      return absPath;
    }
    message = `Does not exist as local path: ${absPath}`;
  } catch {
    message = `Unable to resolve as local path: ${relativePath}`;
  }
  session.log.debug(message);
  return relativePath;
}

function resolveToRelative(
  session: ISession,
  basePath: string,
  absPath: string,
  checkExists = true,
) {
  let message: string;
  try {
    if (!checkExists || fs.existsSync(absPath)) {
      // If it is the same path, use a '.'
      return relative(basePath, absPath) || '.';
    }
    message = `Does not exist as local path: ${absPath}`;
  } catch {
    message = `Unable to resolve as relative path: ${absPath}`;
  }
  session.log.debug(message);
  return absPath;
}

function resolveSiteConfigPaths(
  session: ISession,
  path: string,
  siteConfig: SiteConfig,
  resolutionFn: (
    session: ISession,
    basePath: string,
    path: string,
    checkExists?: boolean,
  ) => string,
) {
  const resolvedFields: SiteConfig = {};
  if (siteConfig.projects) {
    resolvedFields.projects = siteConfig.projects.map((proj) => {
      if (proj.path) {
        return { ...proj, path: resolutionFn(session, path, proj.path) };
      }
      return proj;
    });
  }
  if (siteConfig.favicon) {
    resolvedFields.favicon = resolutionFn(session, path, siteConfig.favicon);
  }
  return { ...siteConfig, ...resolvedFields };
}

function resolveProjectConfigPaths(
  session: ISession,
  path: string,
  projectConfig: ProjectConfig,
  resolutionFn: (
    session: ISession,
    basePath: string,
    path: string,
    checkExists?: boolean,
  ) => string,
) {
  const resolvedFields: ProjectConfig = {};
  if (projectConfig.bibliography) {
    resolvedFields.bibliography = projectConfig.bibliography.map((file) => {
      return resolutionFn(session, path, file);
    });
  }
  if (projectConfig.index) {
    resolvedFields.index = resolutionFn(session, path, projectConfig.index);
  }
  if (projectConfig.exclude) {
    resolvedFields.exclude = projectConfig.exclude.map((file) => {
      return resolutionFn(session, path, file, false);
    });
  }
  if (projectConfig.plugins) {
    resolvedFields.plugins = projectConfig.plugins.map((file) => {
      const resolved = resolutionFn(session, path, file);
      if (fs.existsSync(resolved)) return resolved;
      return file;
    });
  }
  return { ...projectConfig, ...resolvedFields };
}

function validateSiteConfigAndThrow(
  session: ISession,
  path: string,
  vfile: VFile,
  rawSite: Record<string, any>,
) {
  const site = validateSiteConfig(
    rawSite,
    configValidationOpts(vfile, 'config.site', RuleId.validSiteConfig),
  );
  logMessagesFromVFile(session, vfile);
  if (!site) {
    const errorSuffix = vfile.path ? ` in ${vfile.path}` : '';
    throw Error(`Please address invalid site config${errorSuffix}`);
  }
  return resolveSiteConfigPaths(session, path, site, resolveToAbsolute);
}

function saveSiteConfig(session: ISession, path: string, site: SiteConfig) {
  session.store.dispatch(config.actions.receiveSiteConfig({ path, ...site }));
}

function validateProjectConfigAndThrow(
  session: ISession,
  path: string,
  vfile: VFile,
  rawProject: Record<string, any>,
) {
  const project = validateProjectConfig(
    rawProject,
    configValidationOpts(vfile, 'config.project', RuleId.validProjectConfig),
  );
  logMessagesFromVFile(session, vfile);
  if (!project) {
    const errorSuffix = vfile.path ? ` in ${vfile.path}` : '';
    throw Error(`Please address invalid project config${errorSuffix}`);
  }
  return resolveProjectConfigPaths(session, path, project, resolveToAbsolute);
}

function saveProjectConfig(session: ISession, path: string, project: ProjectConfig) {
  session.store.dispatch(config.actions.receiveProjectConfig({ path, ...project }));
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
  const vfile = new VFile();
  vfile.path = file;
  if (siteConfig) {
    saveSiteConfig(session, path, validateSiteConfigAndThrow(session, path, vfile, siteConfig));
  }
  siteConfig = selectors.selectLocalSiteConfig(session.store.getState(), path);
  if (siteConfig) {
    siteConfig = resolveSiteConfigPaths(session, path, siteConfig, resolveToRelative);
  }
  // Get project config to save
  if (projectConfig) {
    saveProjectConfig(
      session,
      path,
      validateProjectConfigAndThrow(session, path, vfile, projectConfig),
    );
  }
  projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), path);
  if (projectConfig) {
    projectConfig = prepareToWrite(projectConfig);
    projectConfig = resolveProjectConfigPaths(session, path, projectConfig, resolveToRelative);
  }
  // Return early if nothing new to save
  if (!siteConfig && !projectConfig) {
    session.log.debug(`No new config to write to ${file}`);
    return;
  }
  // Get raw config to override
  const rawConfig = loadConfig(session, path);
  const validatedRawConfig = rawConfig?.validated ?? emptyConfig();
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
  const newConfig = { ...validatedRawConfig };
  if (siteConfig) newConfig.site = { ...validatedRawConfig.site, ...siteConfig };
  if (projectConfig) newConfig.project = { ...validatedRawConfig.project, ...projectConfig };
  writeFileToFolder(file, yaml.dump(newConfig), 'utf-8');
}

export function findCurrentProjectAndLoad(session: ISession, path: string): string | undefined {
  path = resolve(path);
  if (configFromPath(session, path)) {
    loadConfig(session, path);
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

export function findCurrentSiteAndLoad(session: ISession, path: string): string | undefined {
  path = resolve(path);
  if (configFromPath(session, path)) {
    loadConfig(session, path);
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

export function reloadAllConfigsForCurrentSite(session: ISession) {
  const state = session.store.getState();
  const sitePath = selectors.selectCurrentSitePath(state);
  const file =
    selectors.selectCurrentProjectFile(state) ?? defaultConfigFile(session, resolve('.'));
  if (!sitePath) {
    const message =
      'Cannot (re)load site config. No configuration file found with "site" property.';
    addWarningForFile(session, file, message, 'error', { ruleId: RuleId.siteConfigExists });
    throw Error(message);
  }
  loadConfig(session, sitePath);
  const siteConfig = selectors.selectCurrentSiteConfig(session.store.getState());
  if (!siteConfig?.projects) return;
  siteConfig.projects
    .filter((project): project is SiteProject & { path: string } => {
      return Boolean(project.path);
    })
    .forEach((project) => {
      try {
        loadConfig(session, project.path);
      } catch (error) {
        // TODO: what error?
        session.log.debug(`Failed to find or load project config from "${project.path}"`);
      }
    });
}
