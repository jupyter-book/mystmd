import { Blocks, KINDS, NavListItemKindEnum } from '@curvenote/blocks';
import { Version } from '../../models';
import { ISession } from '../../session/types';
import { articleToMarkdown } from '../markdown';
import { notebookToIpynb } from '../notebook';
import { getLatestVersion } from '../utils/getLatest';
import { ArticleState } from '../utils/walkArticle';
import { writeBibtex } from '../utils/writeBibtex';

interface Options {
  path?: string;
  images?: string;
  bibtex?: string;
  createFrontmatter?: boolean;
  titleOnlyInFrontmatter?: boolean;
}

export async function exportAll(
  session: ISession,
  nav: Version<Blocks.Navigation>,
  opts?: Options,
) {
  const { bibtex = 'references.bib' } = opts ?? {};
  const blocks = await Promise.all(
    nav.data.items.map((item) => {
      if (item.kind === NavListItemKindEnum.Item)
        return getLatestVersion(session, item.blockId).catch(() => null);
      return null;
    }),
  );
  const articles = await Promise.all(
    blocks.map(async (blockData) => {
      if (!blockData) return null;
      const { block, version } = blockData;
      switch (block.data.kind) {
        case KINDS.Article: {
          const filename = `${block.data.name ?? block.id.block}.md`;
          try {
            const article = await articleToMarkdown(session, version.id, {
              ...opts,
              filename,
              writeBibtex: false,
            });
            return article;
          } catch (error) {
            session.log.error(`Problem downloading article: ${block.data.name}`);
            return null;
          }
        }
        case KINDS.Notebook: {
          const filename = `${block.data.name ?? block.id.block}.ipynb`;
          try {
            const article = await notebookToIpynb(session, version.id, { ...opts, filename });
            return article;
          } catch (error) {
            session.log.error(`Problem downloading notebook: ${block.data.name}`);
            return null;
          }
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
  await writeBibtex(session, references, bibtex, { path: opts?.path, alwaysWriteFile: false });
}
