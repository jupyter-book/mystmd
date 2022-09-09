import type { Alignment } from '@curvenote/blocks';
import type { Image as ImageNode } from 'myst-spec';
import type { NodeRenderer } from './types';

function alignToMargin(align: string) {
  switch (align) {
    case 'left':
      return { marginRight: 'auto' };
    case 'right':
      return { marginLeft: 'auto' };
    case 'center':
      return { margin: '0 auto' };
    default:
      return {};
  }
}

function Picture({
  src,
  srcOptimized,
  urlSource,
  align = 'center',
  alt,
  width,
}: {
  src: string;
  srcOptimized?: string;
  urlSource?: string;
  alt?: string;
  width?: string;
  align?: Alignment;
}) {
  const image = (
    <img
      style={{
        width: width || undefined,
        ...alignToMargin(align),
      }}
      src={src}
      alt={alt}
      data-canonical-url={urlSource}
    />
  );
  if (!srcOptimized) return image;
  return (
    <picture>
      <source srcSet={srcOptimized} type="image/webp" />
      {image}
    </picture>
  );
}

export const Image: NodeRenderer<ImageNode> = (node) => {
  return (
    <Picture
      key={node.key}
      src={node.url}
      srcOptimized={(node as any).urlOptimized}
      alt={node.alt || node.title}
      width={node.width || undefined}
      align={node.align}
      // Note that sourceUrl is for backwards compatibility
      urlSource={(node as any).urlSource || (node as any).sourceUrl}
    />
  );
};

const IMAGE_RENDERERS = {
  image: Image,
};

export default IMAGE_RENDERERS;
