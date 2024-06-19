import fs from 'node:fs/promises';

import { defined } from '../../utils/defined.js';
import yaml from 'js-yaml';
import type { Config } from 'myst-config';
import { upgradeConfig, validateJupyterBookConfig } from './config.js';
import { upgradeTOC, validateSphinxExternalTOC } from './toc.js';
import { upgradeGlossaries } from './syntax.js';
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
    throw new Error('_config.yml is a required Jupyter Book configuration file');
  }
  const content = await fs.readFile('_config.yml', { encoding: 'utf-8' });
  const data = validateJupyterBookConfig(yaml.load(content));
  if (defined(data)) {
    // Update MyST configuration
    ({ site: config.site, project: config.project } = upgradeConfig(data));
  }

  // Does TOC exist?
  if (await fsExists('_toc.yml')) {
    const content = await fs.readFile('_toc.yml', { encoding: 'utf-8' });
    const data = validateSphinxExternalTOC(yaml.load(content));
    if (defined(data)) {
      (config as any).project.toc = upgradeTOC(data);
    }
  }

  // Upgrade legacy syntax
  await upgradeGlossaries(session);

  // Write new myst.yml
  await fs.writeFile(configFile, yaml.dump(config));
  
  await fs.rename('_config.yml', '._config.yml.myst.bak');
  session.log.info(chalk.dim('Renamed _config.yml to ._config.yml.myst.bak'));

  await fs.rename('_toc.yml', '._toc.yml.myst.bak');
  session.log.info(chalk.dim('Renamed _toc.yml to ._toc.yml.myst.bak'));
}
