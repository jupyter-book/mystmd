import { Blocks, KINDS } from '@curvenote/blocks';
import { Version } from '../../models';
import { articleToMarkdown } from '../markdown';
import { getLatestVersion } from '../../actions/getLatest';
import { ISession } from '../../session/types';
import { ArticleState } from '../utils';
import { writeBibtex } from '../utils/writeBibtex';
import { notebookToIpynb } from '../notebook';

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
      switch (block.data.kind) {
        case KINDS.Article: {
          const filename = `${block.data.name ?? block.id.block}.md`;
          return articleToMarkdown(session, version.id, { filename });
        }
        case KINDS.Notebook: {
          const filename = `${block.data.name ?? block.id.block}.ipynb`;
          return notebookToIpynb(session, version.id, { filename });
        }
        default:
          session.log.warn(`Skipping block: "${block.data.name}" of kind "${block.data.kind}"`);
          return null;
      }
    }),
  );
  const references: ArticleState['references'] = articles.reduce(
    (obj, a) => ({ ...obj, ...a?.references }),
    {} as ArticleState['references'],
  );
  await writeBibtex(session, references, bibtex, { alwaysWriteFile: false });
}
