import { selectAll } from 'unist-util-select';
import {
  MystTransformer,
  SphinxTransformer,
  type IReferenceStateResolver,
} from 'myst-transforms';
import type { GenericNode, GenericParent } from 'myst-common';
import { normalizeLabel, fileError, selectMdastNodes } from 'myst-common';
import type { CrossReference, Link } from 'myst-spec-ext';
import { toMarkdown, defaultHandlers } from 'mdast-util-to-markdown';
import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { mystParse } from 'myst-parser';
import type { ISession } from '../session/types.js';
import { castSession } from '../session/cache.js';
import type { MystData } from './crossReferences.js';
import { fetchMystLinkData, fetchMystXRefData, nodesFromMystXRefData } from './crossReferences.js';
import { fileFromSourceFolder, getSourceFolder } from './links.js';

/**
 * Recursively extracts plain text content from a node tree (format=text)
 */
function extractTextFromNodes(nodes: GenericNode[]): string {
  const textParts: string[] = [];

  function walk(node: GenericNode) {
    if (node.type === 'text') {
      textParts.push(node.value as string);
    } else if (node.type === 'inlineCode') {
      textParts.push(node.value as string);
    } else if ((node as GenericParent).children) {
      (node as GenericParent).children.forEach(walk);
    }
  }

  nodes.forEach(walk);
  return textParts.join('');
}

/**
 * Extracts inline content from nodes, unwrapping paragraphs
 */
function extractInlineNodes(nodes: GenericNode[]): GenericNode[] {
  if (!nodes?.length) return [];

  // Flatten and extract inline content from block containers
  const inlineNodes = nodes.flatMap((node) => {
    // If it's a paragraph, extract its children
    if (node.type === 'paragraph' && (node as GenericParent).children) {
      return (node as GenericParent).children;
    }

    // Allow known inline node types through
    const inlineTypes = [
      'text',
      'emphasis',
      'strong',
      'inlineCode',
      'inlineMath',
      'link',
      'crossReference',
      'subscript',
      'superscript',
      'delete',
      'underline',
      'smallcaps',
      'abbreviation',
      'cite',
      'citeGroup',
      'mystRole',
      'break',
      'image',
    ];

    if (inlineTypes.includes(node.type)) {
      return [node];
    }

    // For other block nodes, try to extract inline children
    if ((node as GenericParent).children) {
      return extractInlineNodes((node as GenericParent).children);
    }

    return [];
  });

  return inlineNodes;
}

/**
 * Extracts markdown content from notebook output nodes
 * Looks for text/markdown or text/plain mime types in jupyter_data
 */
function extractMarkdownFromNotebookOutput(nodes: GenericNode[]): string | null {
  for (const node of nodes) {
    // Check if this is an output node with jupyter_data
    if (node.type === 'output' && (node as any).jupyter_data) {
      const jupyterData = (node as any).jupyter_data;

      // Prefer text/markdown mime type (from display(Markdown(...)))
      if (jupyterData.data?.['text/markdown']?.content) {
        return jupyterData.data['text/markdown'].content;
      }

      // Fall back to text/plain mime type (from print())
      if (jupyterData.data?.['text/plain']?.content) {
        return jupyterData.data['text/plain'].content;
      }

      // Also check for stream output (stdout/stderr from print())
      if (jupyterData.output_type === 'stream' && jupyterData.text) {
        return jupyterData.text;
      }
    }

    // Recursively search in children
    if ((node as GenericParent).children) {
      const result = extractMarkdownFromNotebookOutput((node as GenericParent).children);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Extracts markdown content from nodes, preserving formatting (format=markdown)
 */
function extractMarkdownFromNodes(nodes: GenericNode[]): string {
  if (!nodes?.length) return '';

  // Extract inline nodes from block containers
  const inlineNodes = extractInlineNodes(nodes);

  if (!inlineNodes.length) return '';

  // Create a temporary tree structure for serialization
  // We wrap in a paragraph so toMarkdown can serialize inline content
  const tempTree = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: inlineNodes,
      },
    ],
  };

  // Configure options for markdown serialization
  // Uses default handlers which cover standard markdown elements
  // (bold, italic, code, links, etc.)
  const options = {
    fences: true,
    rule: '-' as const,
    extensions: [gfmFootnoteToMarkdown(), gfmTableToMarkdown()],
  };

  // Serialize to markdown
  const result = toMarkdown(tempTree as any, options).trim();

  return result;
}

/**
 * Transform that processes {embed-markdown}`label` roles
 *
 * This role extracts content from labeled blocks and embeds it inline.
 * - format=markdown (default): Preserves markdown formatting (bold, italic, links, etc.)
 * - format=text: Extracts plain text only
 */
export async function embedMarkdownTransform(
  session: ISession,
  mdast: GenericParent,
  file: string,
  state: IReferenceStateResolver,
) {
  const references = Object.values(castSession(session).$externalReferences);
  const mystTransformer = new MystTransformer(references);
  const embedMarkdownNodes = selectAll('embedMarkdown', mdast) as any[];

  await Promise.all(
    embedMarkdownNodes.map(async (node) => {
      const vfile = state.vfile;
      const label = node.label;
      const format = node.format || 'markdown';

      if (!label) {
        fileError(vfile, 'Embed-markdown node does not have a label', { node });
        return;
      }

      // Handle remote MyST references (xref: or myst: prefixes)
      if (label.startsWith('xref:') || label.startsWith('myst:')) {
        if (!mystTransformer.test(label)) {
          let note: string;
          const sphinxTransformer = new SphinxTransformer(references);
          if (sphinxTransformer.test(label)) {
            note = 'Embed-markdown target must be a MyST project, not intersphinx.';
          } else {
            note =
              'Embed-markdown target must be a MyST project and included in your project references.';
          }
          fileError(vfile, `Cannot embed from "${label}"`, { node, note });
          return;
        }

        const referenceLink: Link = {
          type: 'link',
          url: label,
          urlSource: label,
          children: [],
        };
        const transformed = mystTransformer.transform(referenceLink, vfile);
        const referenceXRef = referenceLink as any as CrossReference;

        if (transformed) {
          let data: MystData | undefined;
          let targetNodes: GenericNode[] | undefined;

          if (referenceXRef.identifier) {
            data = await fetchMystXRefData(session, referenceXRef, vfile);
            if (!data) return;
            targetNodes = nodesFromMystXRefData(data, referenceXRef.identifier, vfile, {
              urlSource: label,
            });
          } else {
            data = await fetchMystLinkData(session, referenceLink, vfile);
            if (!data?.mdast) return;
            targetNodes = data.mdast.children;
          }

          if (!targetNodes?.length) return;

          // Extract content based on format
          const content =
            format === 'text'
              ? extractTextFromNodes(targetNodes)
              : extractMarkdownFromNodes(targetNodes);

          // Replace embedMarkdown node with a text node
          node.type = 'text';
          node.value = content;
          delete node.label;
          delete node.format;
        }
        return;
      }

      // Handle local references
      let hash = label;
      let linkFile: string | undefined;

      if (label.includes('#')) {
        const sourceFileFolder = getSourceFolder(label, file, session.sourcePath());
        const linkFileWithTarget = fileFromSourceFolder(label, sourceFileFolder);
        if (!linkFileWithTarget) return;
        linkFile = linkFileWithTarget.split('#')[0];
        hash = linkFileWithTarget.slice(linkFile.length + 1);
      }

      const { identifier } = normalizeLabel(hash) ?? {};
      if (!identifier) {
        fileError(vfile, 'Embed-markdown node does not have label', { node });
        return;
      }

      const stateProvider = state.resolveStateProvider(identifier, linkFile);
      if (!stateProvider) return;

      const cache = castSession(session);
      const pageMdast = cache.$getMdast(stateProvider.filePath)?.post?.mdast;
      if (!pageMdast) return;

      let targetNodes: GenericNode[];
      if (stateProvider.getFileTarget(identifier)) {
        targetNodes = pageMdast.children;
      } else {
        targetNodes = selectMdastNodes(pageMdast, identifier).nodes;
      }

      if (!targetNodes?.length) {
        fileError(vfile, `Embed-markdown target for "${label}" not found`, { node });
        return;
      }

      // Try to extract from notebook output first (for text/markdown mime type)
      let content = extractMarkdownFromNotebookOutput(targetNodes);

      // If we got markdown content from notebook output and format=text,
      // we need to strip the markdown formatting
      if (content !== null && format === 'text') {
        // Parse the markdown to get text only
        try {
          const parsed = mystParse(content, { vfile });
          content = extractTextFromNodes(parsed.children);
        } catch (error) {
          // If parsing fails, just use the raw content
          // It's already text if it came from text/plain or stream
        }
      }

      // If not found in notebook outputs, extract from parsed mdast nodes
      if (content === null) {
        content =
          format === 'text'
            ? extractTextFromNodes(targetNodes)
            : extractMarkdownFromNodes(targetNodes);
      }

      // If still no content, skip this embed
      if (!content) return;

      // For markdown format, parse the content and replace with inline nodes
      if (format === 'markdown') {
        try {
          const parsed = mystParse(content, { vfile });

          // Debug: log the parsed structure
          if (parsed.children && parsed.children.length > 0) {
            const firstChild = parsed.children[0];
            // If it's a paragraph, get its children
            if (firstChild.type === 'paragraph' && (firstChild as any).children) {
              const inlineNodes = (firstChild as any).children;

              if (inlineNodes.length === 0) {
                // Fallback to text if no inline nodes found
                node.type = 'text';
                node.value = content;
              } else {
                // Always wrap in a span to preserve multiple nodes
                node.type = 'span';
                (node as any).children = inlineNodes;
                // Clean up embed-specific properties
                delete (node as any).value;
              }
            } else {
              // Not a paragraph, fallback to text
              node.type = 'text';
              node.value = content;
            }
          } else {
            // No children, fallback to text
            node.type = 'text';
            node.value = content;
          }
        } catch (error) {
          // Fallback to text on parsing error
          fileError(vfile, `Failed to parse embedded markdown: ${error}`, { node });
          node.type = 'text';
          node.value = content;
        }
      } else {
        // For text format, just replace with text node
        node.type = 'text';
        node.value = content;
      }

      delete node.label;
      delete node.format;
    }),
  );
}
