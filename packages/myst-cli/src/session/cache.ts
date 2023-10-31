import path from 'node:path';
import type { ISession, ISessionWithCache } from './types.js';

export function castSession(session: ISession): ISessionWithCache {
  const cache = session as unknown as ISessionWithCache;
  if (!cache.$citationRenderers) cache.$citationRenderers = {};
  if (!cache.$doiRenderers) cache.$doiRenderers = {};
  if (!cache.$internalReferences) cache.$internalReferences = {};
  if (!cache.$externalReferences) cache.$externalReferences = {};
  if (!cache.$mdast) cache.$mdast = {};
  if (!cache.$outputs) cache.$outputs = {};
  cache.$setMdast = (file, data) => {
    cache.$mdast[path.resolve(file)] = data;
  };
  cache.$getMdast = (file) => {
    return cache.$mdast[path.resolve(file)];
  };
  return cache;
}
