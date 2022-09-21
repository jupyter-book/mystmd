import type { Alignment } from '@curvenote/blocks';
import type { Image as ImageNodeSpec } from 'myst-spec';
import type { NodeRenderer } from './types';

type ImageNode = ImageNodeSpec & { height?: string };

function getStyleValue(width?: number | string): string | number | undefined {
  if (typeof width === 'number' && Number.isNaN(width)) {
    // If it is nan, return undefined.
    return undefined;
  }
  if (typeof width === 'string') {
    if (width.endsWith('%')) {
      return width;
    } else if (width.endsWith('px')) {
      return Number(width.replace('px', ''));
    } else if (!Number.isNaN(Number(width))) {
      return Number(width);
    }
    console.log(`Unknown width ${width} in getImageWidth`);
    return undefined;
  }
  return width;
}

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
  height,
}: {
  src: string;
  srcOptimized?: string;
  urlSource?: string;
  alt?: string;
  width?: string;
  height?: string;
  align?: Alignment;
}) {
  const image = (
    <img
      style={{
        width: getStyleValue(width),
        height: getStyleValue(height),
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
      height={node.height || undefined}
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
