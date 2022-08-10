import type { VersionId } from '@curvenote/blocks';
// import { MyST, State, unified } from 'mystjs';
// import mystToTex from 'myst-to-tex';
import type { ISession } from '../../session/types';
import { writeBibtex } from '../utils/writeBibtex';
import { assertEndsInExtension, makeBuildPaths } from '../utils';
import { gatherAndWriteArticleContent } from './gather';
import {
  ifTemplateFetchTaggedBlocks,
  ifTemplateLoadOptions,
  throwIfTemplateButNoJtex,
} from './template';
import type { TexExportOptions } from './types';
import { ifTemplateRunJtex } from './utils';
import { loadFile, selectFile, transformMdast } from '../../store/local/actions';
// import { writeFileToFolder } from '../../utils';

export async function singleArticleToTex(
  session: ISession,
  versionId: VersionId,
  opts: TexExportOptions,
) {
  throwIfTemplateButNoJtex(opts);
  const { tagged } = await ifTemplateFetchTaggedBlocks(session, opts);
  const templateOptions = ifTemplateLoadOptions(opts);

  const { buildPath } = makeBuildPaths(session.log, opts);

  session.log.debug('Starting articleToTex...');
  session.log.debug(`With Options: ${JSON.stringify(opts)}`);

  const { article, filename } = await gatherAndWriteArticleContent(
    session,
    versionId,
    opts,
    tagged,
    templateOptions,
    buildPath,
  );

  session.log.debug('Writing bib file...');
  await writeBibtex(session, article.references, 'main.bib', {
    path: buildPath,
    alwaysWriteFile: true,
  });

  await ifTemplateRunJtex(filename, session.log, opts);

  return article;
}

export async function localArticleToTex(session: ISession, file: string, opts: TexExportOptions) {
  const { filename, ...texOpts } = opts;
  assertEndsInExtension(filename, 'tex');
  await loadFile(session, file);
  await transformMdast(session, { file, localExport: true });
  const { frontmatter, mdast, references } = selectFile(session, file);
  console.log(mdast);
  // const pipe = unified().use(mystToTex);
  // const result = pipe.runSync(mdast as any);
  // const tex = pipe.stringify(result);
  // console.log(tex.result);
  // writeFileToFolder(filename, tex.result as string);
}
