import { Image as ImageNode } from 'myst-spec';
import { NodeRenderer } from '~/myst-to-react';

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

export const Image: NodeRenderer<ImageNode> = (node) => {
  return (
    <img
      key={node.key}
      src={node.url}
      style={{
        width: node.width || undefined,
        ...alignToMargin(node.align || 'center'),
      }}
    />
  );
};

const IMAGE_RENDERERS = {
  image: Image,
};

export default IMAGE_RENDERERS;
