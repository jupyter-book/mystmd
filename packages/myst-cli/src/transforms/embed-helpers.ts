import { MystTransformer, SphinxTransformer, type IReferenceStateResolver } from 'myst-transforms';
import type { GenericNode } from 'myst-common';
import { normalizeLabel, fileError, selectMdastNodes } from 'myst-common';
import type { CrossReference, Link } from 'myst-spec-ext';
import type { VFile } from 'vfile';
import type { ISession } from '../session/types.js';
import { castSession } from '../session/cache.js';
import type { MystData } from './crossReferences.js';
import { fetchMystLinkData, fetchMystXRefData, nodesFromMystXRefData } from './crossReferences.js';
import { fileFromSourceFolder, getSourceFolder } from './links.js';

/**
 * Initialize references and transformers for embed operations
 */
export function initializeEmbedReferences(session: ISession) {
  const references = Object.values(castSession(session).$externalReferences);
  const mystTransformer = new MystTransformer(references);
  const sphinxTransformer = new SphinxTransformer(references);
  return { references, mystTransformer, sphinxTransformer };
}

/**
 * Resolve remote MyST reference (xref: or myst: prefix)
 * Returns target nodes or null on error
 */
export async function resolveRemoteMystReference({
  session,
  label,
  mystTransformer,
  sphinxTransformer,
  vfile,
  node,
}: {
  session: ISession;
  label: string;
  mystTransformer: MystTransformer;
  sphinxTransformer: SphinxTransformer;
  vfile: VFile;
  node: GenericNode;
}): Promise<GenericNode[] | null> {
  if (!mystTransformer.test(label)) {
    let note: string;
    if (sphinxTransformer.test(label)) {
      note = 'Embed target must be a MyST project, not intersphinx.';
    } else {
      note = 'Embed target must be a MyST project and included in your project references.';
    }
    fileError(vfile, `Cannot embed "${label}"`, { node, note });
    return null;
  }

  const referenceLink: Link = {
    type: 'link',
    url: label,
    urlSource: label,
    children: [],
  };

  const transformed = mystTransformer.transform(referenceLink, vfile);
  const referenceXRef = referenceLink as any as CrossReference;

  if (!transformed) return null;

  let data: MystData | undefined;
  let targetNodes: GenericNode[] | undefined;

  if (referenceXRef.identifier) {
    data = await fetchMystXRefData(session, referenceXRef, vfile);
    if (!data) return null;
    targetNodes = nodesFromMystXRefData(data, referenceXRef.identifier, vfile, {
      urlSource: label,
    });
  } else {
    data = await fetchMystLinkData(session, referenceLink, vfile);
    if (!data?.mdast) return null;
    targetNodes = data.mdast.children;
  }

  if (!targetNodes?.length) return null;

  return targetNodes;
}

/**
 * Resolve local file reference (with optional #anchor)
 * Returns target nodes or null on error
 */
export async function resolveLocalReference({
  session,
  label,
  file,
  state,
  vfile,
  node,
}: {
  session: ISession;
  label: string;
  file: string;
  state: IReferenceStateResolver;
  vfile: VFile;
  node: GenericNode;
}): Promise<GenericNode[] | null> {
  let hash = label;
  let linkFile: string | undefined;

  if (label.includes('#')) {
    const sourceFileFolder = getSourceFolder(label, file, session.sourcePath());
    const linkFileWithTarget = fileFromSourceFolder(label, sourceFileFolder);
    if (!linkFileWithTarget) return null;
    linkFile = linkFileWithTarget.split('#')[0];
    hash = linkFileWithTarget.slice(linkFile.length + 1);
  }

  const { identifier } = normalizeLabel(hash) ?? {};
  if (!identifier) {
    fileError(vfile, 'Embed node does not have label', { node });
    return null;
  }

  const stateProvider = state.resolveStateProvider(identifier, linkFile);
  if (!stateProvider) return null;

  const cache = castSession(session);
  const pageMdast = cache.$getMdast(stateProvider.filePath)?.post?.mdast;
  if (!pageMdast) return null;

  let targetNodes: GenericNode[];
  if (stateProvider.getFileTarget(identifier)) {
    targetNodes = pageMdast.children;
  } else {
    targetNodes = selectMdastNodes(pageMdast, identifier).nodes;
  }

  if (!targetNodes?.length) {
    fileError(vfile, `Embed target for "${label}" not found`, { node });
    return null;
  }

  return targetNodes;
}
