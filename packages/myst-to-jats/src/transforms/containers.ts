import type { Plugin } from 'unified';
import type { Root } from 'mdast';
import type { Container, Blockquote, Legend, Caption, FlowContent } from 'myst-spec';
import { select, selectAll } from 'unist-util-select';
import { remove } from 'unist-util-remove';

export type SupplementaryMaterial = {
  type: 'supplementaryMaterial';
  enumerator?: string;
  figIdentifier?: string;
  sourceUrl?: string;
  sourceSlug?: string;
  embedIdentifier?: string;
};

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
    const caption = (select('caption', container) ?? { type: 'caption', children: [] }) as Caption;
    const legends = selectAll('legend', container) as Legend[];
    if (legends.length) {
      const legendChildren = legends.map((leg) => leg.children).flat() as FlowContent[] & Node[];
      caption.children.push(...legendChildren);
      remove(container as any, 'legend');
    }
    if ((container as any).kind === 'figure') {
      container.children = [
        ...container.children.filter((child) => child.type !== 'image'),
        ...container.children.filter((child) => child.type === 'image'),
      ];
    }
    const embed = select('embed', container);
    if (embed) {
      const embedBlock = select('block', embed);
      const embedOutputs = selectAll('output', embedBlock);
      caption.children.push({
        type: 'supplementaryMaterial',
        enumerator: container.enumerator,
        figIdentifier: container.identifier,
        sourceUrl: (embed as any).source?.url,
        sourceSlug: (embed as any).source?.slug,
        embedIdentifier: (embedBlock as any)?.identifier,
      } as SupplementaryMaterial);
      if (embedOutputs) container.children.push(...(embedOutputs as any[]));
    }
  });
}

export const containerPlugin: Plugin<[], Root, Root> = () => (tree) => {
  containerTransform(tree);
};
