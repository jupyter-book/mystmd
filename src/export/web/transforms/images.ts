import { GenericNode, selectAll } from 'mystjs';
import path from 'path';

import { Root } from './types';

export function transformImages(mdast: Root) {
  const images = selectAll('image', mdast) as GenericNode[];
  images.forEach((image) => {
    // assumes all images referenced in myst content are moved to public/_static
    image.url = `/_static/${path.basename(image.url)}`;
  });
}
