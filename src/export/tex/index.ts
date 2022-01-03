import fs from 'fs';
import util from 'util';
import child_process from 'child_process';
import { VersionId, KINDS, oxaLink, oxaLinkToId } from '@curvenote/blocks';
import { toTex } from '@curvenote/schema';
import { Version } from '../../models';
import { Session } from '../../session';
import { getChildren } from '../../actions/getChildren';
import { exportFromOxaLink, walkArticle, writeImagesToFiles } from '../utils';

const exec = util.promisify(child_process.exec);

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

  const content = article.children.map((child) => {
    if (!child.version || !child.state) return '';
    const sep = oxaLink(session.SITE_URL, child.version.id);
    const tex = toTex(child.state.doc, {
      localizeImageSrc: (src) => imageFilenames[src],
      localizeId: (id) => id.split('#')[1], // TODO: this is a hack
      // TODO: needs to be expanded to look up
      localizeCitation: (key) => article.references[key].label,
      localizeLink: (href) => {
        const oxa = oxaLinkToId(href);
        if (!oxa) return href;
        return oxaLink(session.SITE_URL, oxa.block, oxa) as string;
      },
    });
    return `%% ${sep}\n\n${tex}`;
  });
  const file = content.join('\n\n');
  fs.writeFileSync(opts.filename, file);

  // Write out the references
  const bibliography = Object.entries(article.references).map(([, { bibtex }]) => bibtex);
  const bibWithNewLine = `${bibliography.join('\n\n')}\n`;
  // TODO: Provide option override
  fs.writeFileSync('main.bib', bibWithNewLine);
}

export const oxaLinkToTex = exportFromOxaLink(articleToTex);
