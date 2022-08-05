import type { Blocks } from '@curvenote/blocks';
import { KINDS, OutputSummaryKind } from '@curvenote/blocks';
import type { Version } from '../../models';

type ImageSrc = { src?: string; content_type?: string };

export function getImageSrc(version: Version<Blocks.Image | Blocks.Output>): ImageSrc {
  if (version.data.kind === KINDS.Image)
    return { src: version.data.links.download, content_type: version.data.content_type };
  return version.data.outputs.reduce((found, { kind, link, content_type }) => {
    if (found.src) return found;
    if (kind === OutputSummaryKind.image) return { src: link, content_type };
    return {};
  }, {} as ImageSrc);
}
