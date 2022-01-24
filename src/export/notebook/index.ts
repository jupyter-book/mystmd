import fs from 'fs';
import { KINDS, VersionId } from '@curvenote/blocks';
import { Block, Version } from '../../models';
import { assertEndsInExtension, exportFromOxaLink } from '../utils';
import { ISession } from '../../session/types';
import { getChildren } from '../../actions/getChildren';

type Options = {
  filename: string;
};

export async function notebookToIpynb(session: ISession, versionId: VersionId, opts: Options) {
  assertEndsInExtension(opts.filename, 'ipynb');
  const [block, version] = await Promise.all([
    new Block(session, versionId).get(),
    new Version(session, versionId).get(),
    getChildren(session, versionId),
  ]);
  if (block.data.kind !== KINDS.Notebook) {
    throw new Error(`Cannot export block of kind "${block.data.kind}" as a Notebook.`);
  }
  // NOTE: this should be handled better in the client.
  const resp = await session.get(`${version.$createUrl()}/download`);
  if (resp.status !== 200) throw new Error(`Could not download notebook.`);
  fs.writeFileSync(opts.filename, JSON.stringify(resp.json));
}

export const oxaLinkToNotebook = exportFromOxaLink(notebookToIpynb);
