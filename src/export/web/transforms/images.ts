import { GenericNode, selectAll } from 'mystjs';
import { Root } from './types';

export function transformImages(mdast: Root) {
  const images = selectAll('image', mdast) as GenericNode[];
  images.forEach((image) => {
    image.url = `/${image.url}`;
  });
}
