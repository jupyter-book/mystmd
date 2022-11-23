import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Container, Blockquote } from 'myst-spec';
import { select, selectAll } from 'unist-util-select';
import { remove } from 'unist-util-remove';

function liftCaptionNumber(container: Container) {
  // TODO: this won't work for multi-panel figures?
  const caption = select('caption', container);
  const captionNumber = select('captionNumber', container);
  if (caption) remove(caption, 'captionNumber');
  if (captionNumber) container.children.splice(0, 0, captionNumber);
}

export function containerTransform(mdast: Root) {
  const figures = selectAll('container', mdast) as Container[];
  figures.forEach((container) => {
    liftCaptionNumber(container);
    if ((container as any).kind === 'quote') {
      const caption = select('caption > paragraph', container);
      const blockquote = select('blockquote', container) as Blockquote;
      if (blockquote && caption) {
        const newContainer = container as unknown as Blockquote;
        newContainer.type = 'blockquote';
        newContainer.children = blockquote.children;
        caption.type = 'attrib'; // Change the caption to attribution for JATS
        newContainer.children.push(caption);
      }
    }
  });
}

export const containerPlugin: Plugin<[], Root, Root> = () => (tree) => {
  containerTransform(tree);
};
