import fs from 'fs';
import { VersionId, KINDS, oxaLink } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import { Version } from '../../models';
import { Session } from '../../session';
import { getChildren } from '../../actions/getChildren';
import { exportFromOxaLink, walkArticle, writeImagesToFiles } from '../utils';

type Options = {
  images?: string;
};

export async function articleToTex(
  session: Session,
  versionId: VersionId,
  filename: string,
  opts?: Options,
) {
  const [version] = await Promise.all([
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  const { data } = version;
  if (data.kind !== KINDS.Article) throw new Error('Not an article');
  const article = await walkArticle(session, data);

  const imageFilenames = await writeImagesToFiles(article.images, opts?.images ?? 'images');

  const content = article.children.map((child) => {
    if (!child.version || !child.state) return '';
    const blockData = { oxa: oxaLink('', child.version.id), pinned: false };
    const tex = toTex(child.state.doc, { localizeImageSrc: (src) => imageFilenames[src] });
    return `%% ${JSON.stringify(blockData)}\n\n${tex}`;
  });
  const file = content.join('\n\n');
  fs.writeFileSync(filename, file);
}

export const oxaLinkToTex = exportFromOxaLink(articleToTex);
