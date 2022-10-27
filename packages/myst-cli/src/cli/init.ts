import fs from 'fs';
import path from 'path';
import { Command, Option } from 'commander';
import { loadConfigAndValidateOrThrow } from '../config';
import { loadProjectFromDisk } from '../project';
import { selectors } from '../store';
import type { ISession } from '../session';
import { Session } from '../session';
import { clirun } from './clirun';

const PROJECT_CONFIG = `version: 1
project:
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
  bibliography: []
  exclude: []
`;

export type InitOptions = {
  writeToc: boolean;
};

export function init(session: ISession, opts: InitOptions) {
  const { writeToc } = opts;
  loadConfigAndValidateOrThrow(session, '.');
  const projectConfig = selectors.selectLocalProjectConfig(session.store.getState(), '.');
  if (projectConfig) {
    const projectConfigFile = selectors.selectLocalConfigFile(session.store.getState(), '.');
    session.log.info(`✋ Project already initialized with config file: ${projectConfigFile}`);
  } else {
    const [configFile] = session.configFiles;
    session.log.info(`💾 Writing project config file: ${path.resolve(configFile)}`);
    fs.writeFileSync(configFile, PROJECT_CONFIG);
  }
  if (writeToc) {
    loadProjectFromDisk(session, '.', { writeToc });
  }
}

export function makeWriteTocOption() {
  return new Option(
    '--write-toc',
    'Generate editable _toc.yml file for project if it does not exist',
  ).default(false);
}

export function makeInitCLI(program: Command) {
  const command = new Command('init')
    .description('Initialize a myst project in the current directory')
    .addOption(makeWriteTocOption())
    .action(clirun(Session, init, program));
  return command;
}
