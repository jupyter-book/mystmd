import type { RoleSpec, RoleData, GenericNode } from 'myst-common';

/**
 * Inline role for embedding markdown content from other blocks
 *
 * Usage:
 * - {embed-markdown}`label` - Embeds content preserving markdown formatting (default)
 * - {embed-markdown format=text}`label` - Embeds plain text only
 * - {embed-markdown format=markdown}`label` - Explicit markdown format
 *
 * Creates an embedMarkdown node that will be processed by the embedMarkdownTransform
 * to extract and insert content from the referenced block.
 */
export const embedMarkdownRole: RoleSpec = {
  name: 'embed-markdown',
  options: {
    format: {
      type: String,
      doc: 'Output format: "markdown" (default, preserves formatting) or "text" (plain text only)',
    },
  },
  body: {
    type: String,
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const label = (data.body as string).trim();
    const format = (data.options?.format as string) || 'markdown';

    // Validate format option
    if (format !== 'markdown' && format !== 'text') {
      throw new Error(`Invalid format option "${format}". Must be "markdown" or "text".`);
    }

    return [
      {
        type: 'embedMarkdown',
        label,
        format,
      },
    ];
  },
};
