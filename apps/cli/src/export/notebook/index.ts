import yaml from 'js-yaml';
import type { Blocks, VersionId } from '@curvenote/blocks';
import { KINDS } from '@curvenote/blocks';
import { prepareToWrite } from 'myst-cli';
import { fillPageFrontmatter } from 'myst-frontmatter';
import {
  pageFrontmatterFromDTOAndThumbnail,
  projectFrontmatterFromDTO,
  saveAffiliations,
} from '../../frontmatter/api';
import { Block, Project, Version } from '../../models';
import type { ISession } from '../../session/types';
import { resolvePath, writeFileToFolder } from '../../utils';
import { assertEndsInExtension } from '../utils/assertions';
import { remoteExportWrapper } from '../utils/remoteExportWrapper';
import { getChildren } from '../utils/getChildren';

export type NotebookExportOptions = {
  path?: string;
  filename: string;
  createNotebookFrontmatter?: boolean;
  ignoreProjectFrontmatter?: boolean;
};

async function createFrontmatterCell(
  session: ISession,
  filename: string,
  block: Block,
  opts: NotebookExportOptions,
) {
  const project = await new Project(session, block.id.project).get();
  saveAffiliations(session, project.data);
  let frontmatter = await pageFrontmatterFromDTOAndThumbnail(session, filename, block.data);
  if (!opts.ignoreProjectFrontmatter) {
    const projectFrontmatter = projectFrontmatterFromDTO(session, project.data);
    frontmatter = fillPageFrontmatter(frontmatter, projectFrontmatter);
  }
  return {
    cell_type: 'markdown',
    metadata: {
      frontmatter: true,
    },
    source: `---\n${yaml.dump(prepareToWrite(frontmatter)).trim()}\n---`,
  };
}

export async function notebookToIpynb(
  session: ISession,
  versionId: VersionId,
  opts: NotebookExportOptions,
) {
  assertEndsInExtension(opts.filename, 'ipynb');
  const [block, version] = await Promise.all([
    new Block(session, versionId).get(),
    new Version<Blocks.Notebook>(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  if (block.data.kind !== KINDS.Notebook) {
    throw new Error(`Cannot export block of kind "${block.data.kind}" as a Notebook.`);
  }
  // NOTE: this should be handled better in the client.
  const resp = await session.get(`${version.$createUrl()}/download`);
  if (!resp.ok) throw new Error(`Could not download notebook.`);
  if (opts.createNotebookFrontmatter) {
    // Put a frontmatter cell in the front!
    const frontmatterCell = await createFrontmatterCell(
      session,
      resolvePath(opts.path, opts.filename),
      block,
      opts,
    );
    resp.json.cells = [frontmatterCell, ...resp.json.cells];
  }
  writeFileToFolder(opts, JSON.stringify(resp.json));
}

export const oxaLinkToNotebook = remoteExportWrapper(notebookToIpynb);
