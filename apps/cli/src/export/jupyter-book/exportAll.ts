import type { Blocks } from '@curvenote/blocks';
import { KINDS, NavListItemKindEnum } from '@curvenote/blocks';
import type { Version } from '../../models';
import type { ISession } from '../../session/types';
import type { MarkdownExportOptions } from '../markdown';
import { articleToMarkdown } from '../markdown';
import type { NotebookExportOptions } from '../notebook';
import { notebookToIpynb } from '../notebook';
import { getBlockAndLatestVersion } from '../utils/getLatest';
import type { ArticleState } from '../utils/walkArticle';
import { writeBibtex } from '../utils/writeBibtex';

export type ExportAllOptions = Omit<MarkdownExportOptions, 'filename' | 'writeBibtex'> &
  Omit<NotebookExportOptions, 'filename'>;

export async function exportAll(
  session: ISession,
  nav: Version<Blocks.Navigation>,
  opts?: ExportAllOptions,
) {
  const { bibtex = 'references.bib' } = opts ?? {};
  const blocks = await Promise.all(
    nav.data.items.map((item) => {
      if (item.kind === NavListItemKindEnum.Item)
        return getBlockAndLatestVersion(session, item.blockId).catch(() => null);
      return null;
    }),
  );
  const articles = await Promise.all(
    blocks.map(async (blockData) => {
      if (!blockData) return null;
      const { block, version } = blockData;
      if (!version) {
        session.log.error(
          `Unable to download "${block.data.name}" - do you need to save the draft?`,
        );
        return null;
      }
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
            session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
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
            session.log.debug(`\n\n${(error as Error)?.stack}\n\n`);
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
