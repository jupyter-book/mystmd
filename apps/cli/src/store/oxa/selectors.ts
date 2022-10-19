import type { RootState } from '../reducers';

export function selectOxaLinkInformation(state: RootState, oxa: string) {
  const info = state.oxalink.lookup[oxa];
  if (!info) return undefined;
  const fileInfo = state.local.watch.files[info.path];
  return {
    title: fileInfo.title,
    description: fileInfo.description,
    url: info.url,
    thumbnail: fileInfo.thumbnail || undefined,
    thumbnailOptimized: fileInfo.thumbnailOptimized || undefined,
  };
}
