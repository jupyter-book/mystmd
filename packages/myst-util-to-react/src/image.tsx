import { Alignment } from '@curvenote/blocks';
import { Image as ImageNode } from 'myst-spec';
import { NodeRenderer } from './types';

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
  sourceUrl,
  align = 'center',
  alt,
  width,
}: {
  src: string;
  srcOptimized?: string;
  sourceUrl?: string;
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
      data-canonical-url={sourceUrl}
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
      sourceUrl={(node as any).sourceUrl}
    />
  );
};

const IMAGE_RENDERERS = {
  image: Image,
};

export default IMAGE_RENDERERS;
