import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { defaultConfigFile, loadConfigAndValidateOrThrow, writeConfigs } from '../config';
import { loadProjectFromDisk } from '../project';
import { selectors } from '../store';
import type { ISession } from '../session';

const VERSION_CONFIG = 'version: 1\n';
const PROJECT_CONFIG = `project:
  # title:
  # description:
  # venue:
  # github:
  # arxiv:
  # open_access:
  # license:
  # doi:
  # date:
  # index:
  # subject:
  keywords: []
  authors: []
  # bibliography: []
  exclude: []
`;
const SITE_CONFIG = `site:
  # title:
  projects:
    - slug: my-myst-site
      path: .
  nav: []
  actions:
    - title: Learn More
      url: https://myst.tools/docs/mystjs
  domains: []
`;

export type InitOptions = {
  project?: boolean;
  site?: boolean;
  writeToc?: boolean;
};

export async function init(session: ISession, opts: InitOptions) {
  const { project, site, writeToc } = opts;
  loadConfigAndValidateOrThrow(session, '.');
  const state = session.store.getState();
  const existingRawConfig = selectors.selectLocalRawConfig(state, '.');
  const existingProjectConfig = selectors.selectLocalProjectConfig(state, '.');
  const existingSiteConfig = selectors.selectLocalSiteConfig(state, '.');
  const existingConfigFile = selectors.selectLocalConfigFile(state, '.');
  if (existingRawConfig) {
    // If config file is already present, update it.
    let projectConfig: Record<string, any> | undefined;
    let siteConfig: Record<string, any> | undefined;
    if (project || (!site && !project)) {
      if (existingProjectConfig) {
        session.log.info(`✋ Project already initialized with config file: ${existingConfigFile}`);
      } else {
        projectConfig = (yaml.load(PROJECT_CONFIG) as Record<string, any>).project;
      }
    }
    if (site || (!site && !project)) {
      if (existingSiteConfig) {
        session.log.info(`✋ Site already initialized with config file: ${existingConfigFile}`);
      } else {
        siteConfig = (yaml.load(SITE_CONFIG) as Record<string, any>).site;
      }
    }
    if (siteConfig || projectConfig) {
      session.log.info(`💾 Updating config file: ${existingConfigFile}`);
      writeConfigs(session, '.', { siteConfig, projectConfig });
    }
  } else {
    // If no config is present, write it explicitly to include comments.
    const configFile = defaultConfigFile(session, '.');
    let configData: string;
    let configDoc: string;
    if (site && !project) {
      configData = `${VERSION_CONFIG}${SITE_CONFIG}`;
      configDoc = 'site';
    } else if (project && !site) {
      configData = `${VERSION_CONFIG}${PROJECT_CONFIG}`;
      configDoc = 'project';
    } else {
      configData = `${VERSION_CONFIG}${PROJECT_CONFIG}${SITE_CONFIG}`;
      configDoc = 'project and site';
    }
    session.log.info(`💾 Writing new ${configDoc} config file: ${path.resolve(configFile)}`);
    fs.writeFileSync(configFile, configData);
  }
  if (writeToc) {
    loadConfigAndValidateOrThrow(session, '.');
    await loadProjectFromDisk(session, '.', { writeToc });
  }
}
