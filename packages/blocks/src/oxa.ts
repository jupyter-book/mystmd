import type { BlockId, VersionId } from './blocks/types';

const legacyMatch = /^block:([a-zA-Z0-9-]{2,})\/([a-zA-Z0-9-]{2,})(?:\/([\d]+))?$/;
const blockMatch =
  /^((@?[a-zA-Z0-9-]{2,}(?::[a-zA-Z0-9-]{2,})?)\/(!?[a-zA-Z0-9-]{2,})(?:\.([\d]+))?)((?::)(?:(@?[a-zA-Z0-9-]{2,}(?::[a-zA-Z0-9-]{2,})?)(?:\/))?(!?[a-zA-Z0-9-]{2,})(?:\.([\d]+))?)?$/;
const idMatch = /^[a-zA-Z0-9-]{2,}$/;

export type OxaLink = {
  context: BlockId | VersionId | null;
  block: BlockId | VersionId;
  id: string | null;
} | null;

function addBase(base: string, str: string) {
  if (!base) return `oxa:${str}`;
  return `${base}/oxa:${str}`;
}

function idPart(id: string | undefined | null) {
  if (!id) return '';
  return `#${id}`;
}
function lastPart(block: BlockId | VersionId, pinned: boolean, id?: string | null) {
  if (!pinned || !('version' in block) || !block.version || block.version === -1) return idPart(id);
  return `.${block.version}${idPart(id)}`;
}

export type OxaOpts = {
  context?: BlockId | VersionId | null;
  pinned?: boolean;
  id?: string | null;
};
export function oxaLink(oxa: OxaLink): string | null;
export function oxaLink(oxa: OxaLink, pinned: boolean): string | null;
export function oxaLink(
  base: string,
  block: BlockId | VersionId | null,
  opts?: OxaOpts,
): string | null;
export function oxaLink(
  base: string | OxaLink,
  block?: BlockId | VersionId | null | boolean,
  opts: OxaOpts = { context: null, pinned: true },
): string | null {
  if (base == null) return null;
  if (typeof base !== 'string') {
    const pinned = block ?? true;
    if (typeof pinned !== 'boolean') throw new Error();
    return oxaLink('', base.block, { context: base.context ?? null, id: base.id ?? null, pinned });
  }
  if (!block || typeof block === 'boolean') return null;
  const { context, pinned: pinnedIn, id } = opts;
  const pinned = pinnedIn ?? true;
  if (!context) {
    return addBase(base, `${block.project}/${block.block}${lastPart(block, pinned, id)}`);
  }
  const contextPart = `${context.project}/${context.block}${lastPart(context, pinned)}`;
  const blockPart =
    context.project === block.project
      ? `${block.block}${lastPart(block, pinned, id)}`
      : `${block.project}/${block.block}${lastPart(block, pinned, id)}`;
  return addBase(base, `${contextPart}:${blockPart}`);
}

function withVersion(project: string, block: string, version: string | null) {
  if (!version) return { project, block };
  const number = Number.parseInt(version, 10);
  if (Number.isNaN(number) || number < 1) return null;
  return { project, block, version: number };
}

function processMatch(
  project: string | null,
  block: string | null,
  version: string | null,
): BlockId | VersionId | null {
  if (project == null) return null;
  if (block == null) return null;
  if (project.startsWith('@')) {
    if (!project.includes(':')) return null;
    const blockUrl = block.startsWith('!') ? block.slice(1) : `@${block}`;
    return withVersion(project, blockUrl, version);
  }
  if (project.includes(':')) return null;
  const blockId = block.startsWith('!') ? block.slice(1) : block;
  return withVersion(project, blockId, version);
}

function processLink(link: string | null): OxaLink {
  if (!link) return null;
  const [myLink, myId] = link.split('#');
  const match = myLink?.match(blockMatch);
  const validId = myId?.match(idMatch);
  if (!match || (myId && !validId)) return null;
  // First there is only 1 - i.e. no context
  if (match[5] == null) {
    const [project, block, version] = match.slice(2);
    const id = processMatch(project, block, version);
    if (id == null) return null;
    return { context: null, block: id, id: myId || null };
  }
  // Deal with a context!
  const [cp, cb, cv, , bp, bb, bv] = match.slice(2);
  const context = processMatch(cp, cb, cv);
  const block = processMatch(bp || cp, bb, bv);
  if (context == null || block == null) return null;
  return { context, block, id: myId || null };
}

export function oxaLinkToId(linkEncoded: string | null): OxaLink {
  if (!linkEncoded) return null;
  const link = decodeURIComponent(linkEncoded);
  const isLink = link.startsWith('http');
  const urlPath = link.split('/').slice(3).join('/');
  const legacy = link.match(legacyMatch);
  if (legacy) {
    // This supports legacy links with block:
    const [, project, block, version] = legacy;
    const id = processMatch(project, block, version);
    return id ? { context: null, block: id, id: null } : null;
  }
  if (link.startsWith('oxa:') || (isLink && urlPath.startsWith('oxa:'))) {
    return processLink(link.split('oxa:')[1]);
  }
  if (isLink) {
    // http://localhost:3000/@rowanc1/project1/test-1/edit
    const [team, name, block, ...rest] = urlPath.split('/');
    if (team == null || name == null || block == null || !team.startsWith('@')) return null;
    if (rest.length > 1) return null;
    if (rest.length === 1 && rest[0] !== 'edit') return null;
    return processLink(`${team}:${name}/${block}`);
  }
  return null;
}
