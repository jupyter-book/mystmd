import fs from 'fs';
import util from 'util';
import child_process from 'child_process';
import { VersionId, KINDS, oxaLink } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import os from 'os';
import path from 'path';
import { Version } from '../../models';
import { Session } from '../../session';
import { getChildren } from '../../actions/getChildren';
import { exportFromOxaLink, walkArticle, writeImagesToFiles } from '../utils';
import { localizationOptions } from '../utils/localizationOptions';
import { writeBibtex } from '../utils/writeBibtex';

const exec = util.promisify(child_process.exec);

export function createTempFolder() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'curvenote'));
}

type Options = {
  filename: string;
  images?: string;
};

export async function articleToTex(session: Session, versionId: VersionId, opts: Options) {
  const [version] = await Promise.all([
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');
  const article = await walkArticle(session, data);

  const imageFilenames = await writeImagesToFiles(article.images, opts?.images ?? 'images');

  const localization = localizationOptions(session, imageFilenames, article);
  const content = article.children.map((child) => {
    if (!child.version || !child.state) return '';
    const sep = oxaLink(session.SITE_URL, child.version.id);
    const tex = toTex(child.state.doc, localization);
    return `%% ${sep}\n\n${tex}`;
  });
  const file = content.join('\n\n');
  fs.writeFileSync(opts.filename, file);

  // Write out the references
  await writeBibtex(article.references);

  return article;
}

export const oxaLinkToTex = exportFromOxaLink(articleToTex);
