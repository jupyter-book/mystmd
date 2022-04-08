import fs from 'fs';
import path from 'path';
import { ISession } from '~/session/types';

export interface Options {
  title: string;
  author: string;
  logo?: string;
}

function createYaml(opts: Options) {
  const { title, author, logo = 'logo.png' } = opts;
  const settings = `# Jupyter Book settings
# Learn more at https://docs.curvenote.com/config

site:
  name: ${title}
  author: ${author}
  logo: ${logo}
  logoText: ${title}
  sections:
    - title: Explorables
      folder: interactive
  folders:
    interactive:
      title: Curvenote
      index: test
`;
  return settings;
}

export function writeConfig(session: ISession, opts: Options) {
  const pathname = path.join('.', '_config.yml');
  if (fs.existsSync(pathname)) {
    session.log.debug(`The jupyter-book config already exists, ${pathname}, skipping write.`);
    return;
  }
  session.log.debug(`Writing jupyter-book config: ${pathname}`);
  const config = createYaml(opts);
  fs.writeFileSync(path.join('.', '_config.yml'), config);
}
