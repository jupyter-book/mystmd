import type { GenericNode, GenericParent } from 'myst-common';
import { selectAll } from 'unist-util-select';

export function listItemParagraphsTransform(tree: GenericParent) {
  // Fix mixed content in list items
  selectAll('listItem', tree).forEach((node: GenericNode) => {
    if (!node.children || node.children.length === 0) return;

    // Define phrasing content types
    const phrasingTypes = new Set([
      'text',
      'emphasis',
      'strong',
      'delete',
      'link',
      'image',
      'break',
      'subscript',
      'superscript',
      'smallcaps',
      'inlineCode',
      'inlineMath',
      'mystRole',
      'footnoteReference',
      'crossReference',
      'cite',
      'citeGroup',
      'html',
    ]);

    // Check if this list item has any phrasing content
    const hasPhrasingContent = node.children.some((child: GenericNode) =>
      phrasingTypes.has(child.type),
    );

    if (hasPhrasingContent) {
      // Group consecutive phrasing content into paragraphs
      const newChildren: GenericNode[] = [];
      let currentPhrasingGroup: GenericNode[] = [];

      node.children.forEach((child: GenericNode) => {
        if (phrasingTypes.has(child.type)) {
          currentPhrasingGroup.push(child);
        } else {
          // If we have accumulated phrasing content, wrap it in a paragraph
          if (currentPhrasingGroup.length > 0) {
            newChildren.push({
              type: 'paragraph',
              children: currentPhrasingGroup,
            });
            currentPhrasingGroup = [];
          }
          // Add the flow content as-is
          newChildren.push(child);
        }
      });

      // Don't forget any remaining phrasing content
      if (currentPhrasingGroup.length > 0) {
        newChildren.push({
          type: 'paragraph',
          children: currentPhrasingGroup,
        });
      }

      node.children = newChildren;
    }
  });
}
