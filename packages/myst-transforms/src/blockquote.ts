import type { Plugin } from 'unified';
import type { Blockquote, Caption, Container, Paragraph, Text } from 'myst-spec';
import { selectAll, select, matches } from 'unist-util-select';
import type { GenericParent, GenericNode } from 'myst-common';
import { remove } from 'unist-util-remove';
import { copyNode, liftChildren } from 'myst-common';
import { visit } from 'unist-util-visit';

const ATTRIBUTION_PATTERN = /(?:---?(?!-)|\u2014) +(.*)/;

function maybeLiftAttribution(container: Container, quote: Blockquote): boolean {
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

  // We've found an attribution, now we want to strip the prefix
  if (match[1]) {
    maybeCaptionText.value = match[1];
  }
  // There's no remainder, delete the text node entirely
  else {
    (maybeCaptionText as GenericNode).type = '__delete__';
    remove(maybeCaptionParagraph, '__delete__');
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
  visit(mdast, 'blockquote', (quote: Blockquote, quoteParent: GenericNode | undefined) => {
    const isContainer = matches('container[kind=quote]', quoteParent);

    // If there's already a `container`, then we just lift the attribution into the container
    if (isContainer) {
      maybeLiftAttribution(quoteParent as unknown as Container, quote);
      return 'skip';
    }
    // Otherwise, we create a container, and replace the blockquote with a container
    // containing the blockquote
    else {
      const container = {
        type: 'container',
        kind: 'quote',
        children: [quote],
      };
      if (maybeLiftAttribution(container as unknown as Container, quote)) {
        // Copy container before we modify the quote node
        const nextContainer = copyNode(container);
        // Erase the original blockquote node, using it as a mechanism
        // to lift the new container into the right place
        (quote as GenericNode).type = '__lift__';
        quote.children = [nextContainer as unknown as Container];
        // Let's be safe for now (due to ! assertion below)
        if (quoteParent === undefined) {
          throw new Error("Encountered root-level blockquote, can't replace parent");
        }
        liftChildren(quoteParent!, '__lift__');
      }
      return 'skip';
    }
  });
}

export const blockquotePlugin: Plugin<[], GenericParent, GenericParent> = () => (tree) => {
  blockquoteTransform(tree);
};
