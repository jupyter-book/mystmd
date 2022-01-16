import { Blocks, KINDS } from '@curvenote/blocks';
import { articleToMarkdown, Version } from '../..';
import { getLatestVersion } from '../../actions/getLatest';
import { ISession } from '../../session/types';
import { ArticleState } from '../utils';
import { writeBibtex } from '../utils/writeBibtex';

interface Options {
  bibtex?: string;
}

export async function exportAll(
  session: ISession,
  nav: Version<Blocks.Navigation>,
  opts?: Options,
) {
  const { bibtex = 'references.bib' } = opts ?? {};
  const blocks = await Promise.all(
    nav.data.items.map((item) => getLatestVersion(session, item.blockId)),
  );
  const articles = await Promise.all(
    blocks.map(async ({ block, version }) => {
      if (block.data.kind !== KINDS.Article) return null;
      const filename = `${block.data.name ?? block.id.block}.md`;
      return articleToMarkdown(session, version.id, { filename });
    }),
  );
  const references: ArticleState['references'] = articles.reduce(
    (obj, a) => ({ ...obj, ...a?.references }),
    {} as ArticleState['references'],
  );
  await writeBibtex(references, bibtex);
}
