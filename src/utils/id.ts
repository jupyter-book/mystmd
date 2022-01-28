import { VersionId, BlockId, DraftId, SrcId, BlockChildDict, NAV_ID } from '../blocks/types';
import { ProjectId } from '../projects';
import { CommentId } from '../comments';
import { StepId } from '../drafts';
import { Manifest, AccessId } from '../access';

export const projectIdToString = (id: ProjectId): string => `${id}`;
export const blockListToString = (id: ProjectId): string => `${id}/blocks`;
export const blockIdToString = (id: BlockId): string => {
  return `${id.project}/${id.block}`;
};
export const blockIdFromString = (str: string): BlockId => {
  const [project, block] = str.split('/');
  return { project, block };
};
export const versionListToString = (id: BlockId): string => `${id.project}/${id.block}/versions`;
export const versionIdToString = (id: VersionId): string =>
  `${id.project}/${id.block}/${id.version}`;
export const draftListToString = (id: BlockId): string => `${id.project}/${id.block}/drafts`;
export const draftIdToString = (id: DraftId): string => {
  return `${id.project}/${id.block}/${id.draft}`;
};
export const commentListToString = (id: BlockId): string => `${id.project}/${id.block}/comments`;
export const commentIdToString = (id: CommentId): string => {
  return `${id.project}/${id.block}/${id.comment}`;
};
export const commentIdFromString = (str: string): CommentId => {
  const [project, block, comment] = str.split('/');
  return { project, block, comment };
};

export const stepIdToString = (id: StepId): string =>
  `${id.project}/${id.block}/${id.draft}/${id.step}`;
export const stepListToString = (id: DraftId): string =>
  `${id.project}/${id.block}/${id.draft}/steps`;

export const srcIdToString = (id: SrcId): string =>
  `${id.project}/${id.block}/${id.version || null}/${id.draft}`;
export const srcIdFromString = (str: string): SrcId => {
  const [project, block, versionS, draftS] = str.split('/');
  const draft = draftS === 'null' || draftS === '' ? null : draftS;
  const version = versionS === 'null' || versionS === '' ? null : Number.parseInt(versionS, 10);
  return {
    project,
    block,
    version,
    draft,
  };
};

export const accessIdToString = (id: AccessId): string => {
  if ('project' in id) {
    return id.user == null ? `${id.project}/manifest` : `${id.project}/${id.user}`;
  }
  if ('team' in id) {
    return `${id.team}/${id.user}`;
  }
  throw new Error('Invalid AccessId');
};
export const accessListToString = (id: { project: string } | { team: string }): string =>
  'team' in id ? `${id.team}/access` : `${id.project}/access`;

type BlockLikeId = BlockId | VersionId | CommentId | DraftId;

export const convertToBlockId = (id: BlockLikeId): BlockId => {
  return { project: id.project, block: id.block };
};

export const convertToVersionId = (id: VersionId | DraftId | SrcId | null): VersionId | null => {
  if (id == null) return null;
  if ('version' in id && id.version == null) return null;
  if ('block' in id) return { project: id.project, block: id.block, version: id.version };
  return null;
};

export const convertToDraftId = (id: DraftId | SrcId | null): DraftId | null => {
  if (id == null) return null;
  const { draft } = id;
  if (draft == null) return null;
  return { ...id, draft };
};

export const convertToSrcId = (id: VersionId | DraftId | null): SrcId | null => {
  if (id == null) return null;
  if ('draft' in id || 'block' in id) {
    return {
      project: id.project,
      block: id.block,
      version: id.version,
      draft: 'draft' in id ? id.draft : null,
    };
  }
  // Do not handle the ClientDraftIdNoBlock case
  return null;
};

function input2name(input: string, allowed: RegExp, join: string) {
  let name = `¶${input}`
    .toLowerCase()
    .split('')
    .map((char) => (allowed.test(char) ? char : '¶'))
    .join('')
    .split('')
    .reduce((p, n) => (p.charAt(p.length - 1) === '¶' && n === '¶' ? p : p + n))
    .slice(1)
    .replace(/¶/g, join);
  if (join) {
    name = name.replace(new RegExp(`${join}+`, 'g'), join);
  }
  if (name.charAt(0) === join) name = name.slice(1);
  if (name.charAt(name.length - 1) === join) name = name.slice(0, name.length - 1);
  return name;
}

export function bibtexIdToName(id: string) {
  return `ref-${input2name(id, /^[a-z0-9-]/, '-')}`;
}

export const title2name = (title: string) =>
  input2name(title.replace(/&/g, '¶and¶'), /^[a-z0-9-]/, '-').slice(0, 50);
export function makeUniqueName(name: string) {
  return `${name ? `${name}-` : ''}${(Date.now() + Math.round(Math.random() * 1e12)).toString(36)}`;
}
export const input2username = (input: string) => input2name(input, /^[a-z0-9_]/, '').slice(0, 20);
export const input2orcid = (orcid: string) => input2name(orcid, /^[0-9-]/, '').slice(0, 19);

// Manifest helpers

// Must have at least a project ID
type ManifestInfo = Pick<Manifest, 'direct' | 'nested'> & { id?: { project?: ProjectId } };

export function flattenManifest(manifest: ManifestInfo) {
  const direct = Object.entries(manifest.direct).map(([, grant]) => grant.grant);
  const nested = Object.entries(manifest.nested)
    .map(([, grant]) => [grant.grant, ...grant.children])
    .flat(1);

  const unique = [...new Set([...direct, ...nested])];
  return unique;
}

export function blockInManifest(manifest: ManifestInfo, id: BlockId) {
  // The nav is auto published
  if (manifest.id?.project === id.project && id.block === NAV_ID) return true;
  const grants = flattenManifest(manifest);
  const idStr = blockIdToString(id);
  const idGrants = grants.filter((grant) => grant.indexOf(idStr) !== -1);
  return idGrants.length > 0;
}

export function versionInManifest(manifest: ManifestInfo, id: VersionId) {
  // The nav is auto published
  if (manifest.id?.project === id.project && id.block === NAV_ID) return true;
  const grants = flattenManifest(manifest);
  const idStr = versionIdToString(id);
  const idGrants = grants.filter((grant) => grant.indexOf(idStr) !== -1);
  return idGrants.length > 0;
}

export function assertNever(x: never): never {
  throw Error(`Some values not covered in mapping ${x}`);
  // eslint-disable-next-line no-unreachable
  return x;
}

// TODO move to common
export function ensureConsistentChildren(oldOrder: string[], oldChildren: BlockChildDict) {
  const order = oldOrder.filter((childId: string) => Boolean(oldChildren[childId]));
  const children = order.reduce(
    (obj, childId) => ({ ...obj, [childId]: oldChildren[childId] }),
    {} as BlockChildDict,
  );
  return { order, children };
}

export function splitScopedTemplateId(scopedId: string) {
  const [owner, templateId] = scopedId.split('/');
  if (!templateId) throw Error(`Malformed scopedId: ${scopedId}`);
  return { owner, templateId, isPrivate: owner !== 'public' };
}
