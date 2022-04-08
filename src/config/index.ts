import fs from 'fs';
import YAML from 'yaml';
import { Logger } from '../logging';
import { CurvenoteConfig } from './types';

export * from './types';

function validate(config: CurvenoteConfig): CurvenoteConfig {
  // TODO check against a schema & throw if bad
  return config;
}

export function loadCurvenoteConfig(log: Logger, pathToYml: string): CurvenoteConfig | null {
  if (!fs.existsSync(pathToYml)) {
    log.debug(`Could not find ${pathToYml} config on path.`);
    return null;
  }
  log.debug(`Using configuration file: ${pathToYml}`);
  let config;
  try {
    config = YAML.parse(fs.readFileSync(pathToYml, 'utf-8'));
    return validate(config);
  } catch (err) {
    log.error(`Could not parse '${pathToYml}' config file.`, (err as Error).message);
    return null;
  }
}
