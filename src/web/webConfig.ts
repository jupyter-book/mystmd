import fs from 'fs';
import path from 'path';
import { WebConfig } from '../types';
import { ISession } from '../session/types';
import { JupyterBookChapter, readTOC } from '../export/jupyter-book/toc';
import { Options, Page, SiteConfig, SiteFolder } from './types';
import { publicPath } from './transforms';

export function getFileName(folder: string, file: string) {
  const filenameMd = path.join(folder, `${file}.md`);
  const filenameIpynb = path.join(folder, `${file}.ipynb`);
  const isMarkdown = fs.existsSync(filenameMd);
  const isNotebook = fs.existsSync(filenameIpynb);
  if (!isMarkdown && !isNotebook)
    throw new Error(`Could not find "${file}". See '${folder}/_toc.yml'`);
  const filename = isMarkdown ? filenameMd : filenameIpynb;
  return { filename, isMarkdown, isNotebook };
}

function copyActionResource(
  session: ISession,
  opts: Options,
  action: SiteConfig['site']['actions'][0],
): SiteConfig['site']['actions'][0] {
  let { url: filePath } = action;
  if (!action.static || !filePath) return action;
  if (!fs.existsSync(filePath)) {
    // Look in the local public path
    filePath = path.join('public', filePath);
  }
  if (!fs.existsSync(filePath))
    throw new Error(`Could not find static resource at "${action.url}". See 'config.web.actions'`);
  // Get rid of the first public path if present
  const parts = filePath.split(path.sep).filter((s, i) => i > 0 || s !== 'public');
  const webUrl = parts.join('/');
  session.log.debug(`Copying static resource from "${filePath}" to be available at "/${webUrl}"`);
  fs.copyFileSync(filePath, path.join(publicPath(opts), ...parts));
  return {
    title: action.title,
    url: `/${webUrl}`,
    static: true,
  };
}

function getRepeats<T>(things: T[]): Set<T> {
  const set = new Set<T>();
  const repeats = new Set<T>();
  things.forEach((thing) => {
    if (set.has(thing)) repeats.add(thing);
    set.add(thing);
  });
  return repeats;
}
