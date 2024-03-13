import type { Plugin } from 'unified';
import type { Blockquote, Caption, Container } from 'myst-spec';
import { select, matches } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';
import { remove } from 'unist-util-remove';
import { copyNode } from 'myst-common';
import { visit } from 'unist-util-visit';

// Attributions start with one of `--`, `---`, `—` (an emdash) followed by at least one space
const ATTRIBUTION_PATTERN = /^(?:---?|\u2014) +(.*)/;

function maybeLiftAttributionAsCaption(container: Container, quote: Blockquote): boolean {
  // Make this idempotent
  if (select('caption', container)) {
    return false;
  }
  // Do we have a final paragraph
  const maybeCaptionParagraph = quote.children[quote.children.length - 1]; //.at(-1);
  if (maybeCaptionParagraph?.type !== 'paragraph') {
    return false;
  }
  // Do we have a leading text element?
  const maybeCaptionText = maybeCaptionParagraph.children[0];
  if (maybeCaptionText?.type !== 'text') {
    return false;
  }
  // Does the text match the attribution pattern?
  const match = maybeCaptionText.value?.match(ATTRIBUTION_PATTERN);
  if (!match) {
    return false;
  }

  // We've found a non-empty text-component in the attribution
  if (match[1]) {
    // Bow we want to strip the prefix
    maybeCaptionText.value = match[1];
  }
  // There's no leading text component, but there is subsequent markup
  else if (maybeCaptionParagraph.children.length > 1) {
    // Delete the text node entirely
    (maybeCaptionText as GenericNode).type = '__delete__';
    remove(maybeCaptionParagraph, '__delete__');
  }
  // There's nothing to use as an attribution, cancel!
  else {
    return false;
  }
  // Delete original (final) paragraph
  quote.children.pop();

  // Create caption
  const caption: Caption = {
    type: 'caption',
    children: [maybeCaptionParagraph],
  };

  // Add caption
  container.children.push(caption);
  return true;
}
export function blockquoteTransform(mdast: GenericParent) {
  visit(
    mdast,
    'blockquote',
    (quote: Blockquote, index: number, quoteParent: GenericNode | undefined) => {
      // Have we already performed a transform of this block-quote and its sibling?
      // i.e. was this blockquote previously a bare blockquote with an attribution,
      // which has been given a caption using this transform?
      if (quoteParent?.children?.some((node) => matches('caption', node))) {
        // If so, skip application of the transform at _this_ depth
        return;
      }

      // Do we have a pre-built container-of-blockquote (e.g. epigraph, pull-quote directive results)
      // If there's already a `container`, then we just lift the attribution into the container
      if (matches('container[kind=quote]', quoteParent)) {
        maybeLiftAttributionAsCaption(quoteParent as unknown as Container, quote);
        // Don't need to return special index; new caption sibling is automatically visited
        return;
      }

      // Otherwise, we have a bare blockquote, and we need to create a container
      const container = {
        type: 'container',
        kind: 'quote',
        children: [quote],
      };

      // If we find an attribution, lift it into this new container
      if (maybeLiftAttributionAsCaption(container as unknown as Container, quote)) {
        // Having found an attribution, we need to replace the existing quote with the container
        // Copy container before we modify the quote node
        const nextContainer = copyNode(container);
        // Overwrite the original Blockquote with the new container
        // Normally we'd just use a lift utility, but this quote _might_ be the root node.
        const containerDest = quote as GenericNode;
        containerDest.type = 'container';
        containerDest.kind = 'quote';
        containerDest.children = nextContainer.children;
      }
    },
  );
}

export const blockquotePlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  blockquoteTransform(tree);
};
