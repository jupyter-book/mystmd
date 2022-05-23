import { Blocks, KINDS, VersionId } from '@curvenote/blocks';
import yaml from 'js-yaml';
import { Block, Version } from '../../models';
import { assertEndsInExtension, exportFromOxaLink } from '../utils';
import { ISession } from '../../session/types';
import { getChildren } from '../../actions/getChildren';
import { writeFileToFolder } from '../../utils';
import { createFrontmatter } from '../markdown';

type Options = {
  path?: string;
  filename: string;
  createFrontmatter?: boolean;
};

async function createFrontmatterCell(
  session: ISession,
  block: Block,
  version: Version<Blocks.Notebook>,
) {
  const frontmatter = await createFrontmatter(session, block, version);
  return {
    cell_type: 'markdown',
    metadata: {
      frontmatter: true,
    },
    source: `---\n${yaml.dump(frontmatter).trim()}\n---`,
  };
}

export async function notebookToIpynb(session: ISession, versionId: VersionId, opts: Options) {
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
  if (opts.createFrontmatter) {
    // Put a frontmatter cell in the front!
    const frontmatterCell = await createFrontmatterCell(session, block, version);
    resp.json.cells = [frontmatterCell, ...resp.json.cells];
  }
  writeFileToFolder(opts, JSON.stringify(resp.json));
}

export const oxaLinkToNotebook = exportFromOxaLink(notebookToIpynb);
