import type { ISession, ISessionWithCache } from './types';

export function castSession(session: ISession): ISessionWithCache {
  const cache = session as unknown as ISessionWithCache;
  if (!cache.$citationRenderers) cache.$citationRenderers = {};
  if (!cache.$doiRenderers) cache.$doiRenderers = {};
  if (!cache.$internalReferences) cache.$internalReferences = {};
  if (!cache.$externalReferences) cache.$externalReferences = {};
  if (!cache.$mdast) cache.$mdast = {};
  if (!cache.$outputs) cache.$outputs = {};
  return cache;
}
