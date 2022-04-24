import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import { docLinks } from '../docs';
import { Logger } from '../logging';
import { CurvenoteConfig } from './types';
import { DEFAULT_FRONTMATTER, getFrontmatterFromConfig } from '../web/frontmatter';

export * from './types';

function validate(log: Logger, config: CurvenoteConfig): CurvenoteConfig {
  // TODO check against a schema & throw if bad
  if (!config.sync) config.sync = [];
  if (!config.web.nav) config.web.nav = [];
  config.frontmatter = getFrontmatterFromConfig(
    log,
    '<root>',
    config.frontmatter ?? { ...DEFAULT_FRONTMATTER },
    {},
  );
  return config;
}

export const CURVENOTE_YML = 'curvenote.yml';

export function loadCurvenoteConfig(log: Logger, pathToYml: string): CurvenoteConfig | null {
  if (!fs.existsSync(pathToYml)) {
    log.debug(`Could not find ${pathToYml} config on path.`);
    return null;
  }
  log.debug(`Using configuration file: ${pathToYml}`);
  let config;
  try {
    config = YAML.parse(fs.readFileSync(pathToYml, 'utf-8'));
    return validate(log, config);
  } catch (err) {
    log.error(`Could not parse '${pathToYml}' config file.`, (err as Error).message);
    return null;
  }
}

export function blankCurvenoteConfig(): CurvenoteConfig {
  return {
    version: 1,
    sync: [],
    web: {
      name: 'My Curve Space',
      domains: [],
      logo: path.join('public', 'logo.svg'),
      logoText: 'My Curve Space',
      twitter: null,
      nav: [],
      sections: [],
      actions: [{ title: 'Learn More', url: docLinks.curvespace }],
    },
  };
}
