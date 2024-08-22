import fs from 'node:fs/promises';

import { defined } from '../../utils/defined.js';
import yaml from 'js-yaml';
import type { Config } from 'myst-config';
import { upgradeConfig, validateJupyterBookConfig } from './config.js';
import { upgradeTOC, validateSphinxExternalTOC } from './toc.js';
import { upgradeProjectSyntax } from './syntax.js';
import { fsExists } from '../../utils/fsExists.js';
import chalk from 'chalk';
import type { ISession } from '../../session/types.js';

export async function upgradeJupyterBook(session: ISession, configFile: string) {
  const config: Config = {
    version: 1,
    project: {},
  };

  // Does config file exist?
  if (!(await fsExists('_config.yml'))) {
    throw new Error(`${chalk.blue('_config.yml')} is a required Jupyter Book configuration file`);
  }
  const configContent = await fs.readFile('_config.yml', { encoding: 'utf-8' });
  const configData = validateJupyterBookConfig(yaml.load(configContent));
  if (defined(configData)) {
    session.log.info(`Migrating Jupyter Book configuration to ${chalk.blue('myst.yml')}`);

    // Update MyST configuration
    ({ site: config.site, project: config.project } = upgradeConfig(configData));
  }

  // Does TOC exist?
  if (await fsExists('_toc.yml')) {
    const tocContent = await fs.readFile('_toc.yml', { encoding: 'utf-8' });
    const tocData = validateSphinxExternalTOC(yaml.load(tocContent));
    if (defined(tocData)) {
      session.log.info(`Migrating TOC to ${chalk.blue('myst.yml')}`);

      (config as any).project.toc = upgradeTOC(session, tocData);
    }
  }

  // Upgrade legacy syntax
  await upgradeProjectSyntax(session);

  // Write new myst.yml
  await fs.writeFile(configFile, yaml.dump(config));

  await fs.rename('_config.yml', '._config.yml.bak');
  session.log.debug(
    chalk.dim(`Renamed ${chalk.blue('_config.yml')} to ${chalk.blue('._config.yml.bak')}`),
  );

  await fs.rename('_toc.yml', '._toc.yml.bak');
  session.log.debug(
    chalk.dim(`Renamed ${chalk.blue('_toc.yml')} to ${chalk.blue('._toc.yml.bak')}`),
  );
}
