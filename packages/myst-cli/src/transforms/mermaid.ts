import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { GenericParent } from 'myst-common';
import type { Image as ImageNode } from 'myst-spec-ext';
import { selectAll } from 'unist-util-select';
import { fileError, fileWarn, RuleId } from 'myst-common';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import which from 'which';
import { createTempFolder } from '../utils/createTempFolder.js';
import pLimit from 'p-limit';

const execAsync = promisify(exec);

// Create a limiter with concurrency limit
const limitConnections = pLimit(5);

function isMermaidCliAvailable(): boolean {
  return !!which.sync('mmdc', { nothrow: true });
}

export type MermaidOptions = {
  theme?: 'default' | 'forest' | 'dark' | 'neutral';
  format?: 'png' | 'svg';
};

interface MermaidNode {
  type: 'mermaid';
  value: string;
  identifier?: string;
  label?: string;
  html_id?: string;
}

async function renderMermaidToBase64(
  mermaidCode: string,
  theme = 'default',
  format: 'png' | 'svg' = 'svg',
): Promise<string> {
  // Create unique temporary output file name
  const hash = crypto.createHash('md5').update(mermaidCode).digest('hex');
  const tempFolder = createTempFolder();
  const outputFile = path.join(tempFolder, `mermaid-output-${hash}.${format}`);

  if (!isMermaidCliAvailable()) {
    throw new Error('Mermaid CLI is not available');
  }

  try {
    // Render using Mermaid CLI with stdin input
    await execAsync(
      `echo '${mermaidCode.replace(/'/g, "'\"'\"'")}' | mmdc -i - -o "${outputFile}" -t ${theme} -b transparent`,
    );

    // Read the generated file
    const fileContent = await fs.readFile(outputFile, format === 'svg' ? 'utf-8' : undefined);

    // Convert to base64
    const base64Content = Buffer.from(fileContent).toString('base64');
    const mimeType = format === 'svg' ? 'image/svg+xml' : 'image/png';
    const dataUrl = `data:${mimeType};base64,${base64Content}`;

    return dataUrl;
  } finally {
    // Clean up temporary file
    try {
      await fs.rm(tempFolder, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

export async function renderMermaidDiagram(
  file: VFile,
  node: MermaidNode,
  opts?: MermaidOptions,
): Promise<ImageNode | MermaidNode> {
  const { value } = node;
  if (!value) {
    const message = 'No input for mermaid node';
    fileWarn(file, message, {
      node,
      ruleId: RuleId.directiveArgumentCorrect,
    });
    return node;
  }

  try {
    const base64Url = await renderMermaidToBase64(value, opts?.theme, opts?.format);

    // Create image node
    const imageNode: ImageNode = {
      type: 'image',
      url: base64Url,
      alt: `Mermaid diagram: ${value.split('\n')[0]}`,
      title: 'Mermaid diagram',
      identifier: node.identifier,
      label: node.label,
      html_id: node.html_id,
    };

    return imageNode;
  } catch (error) {
    const message = `Failed to render Mermaid diagram: ${(error as Error).message}`;
    fileError(file, message, {
      ruleId: RuleId.imageFormatConverts,
      node,
      note: 'To install the Mermaid CLI, run `npm install -g @mermaid-js/mermaid-cli`',
    });
    return node;
  }
}

export async function mermaidTransform(tree: GenericParent, file: VFile, opts?: MermaidOptions) {
  const nodes = selectAll('mermaid', tree) as MermaidNode[];
  await Promise.all(
    nodes.map(async (node) =>
      limitConnections(async () => {
        const result = await renderMermaidDiagram(file, node, opts);
        // Replace the mermaid node with the image node if successful
        if (result.type === 'image') {
          // Delete all keys from the original node and replace with result
          Object.keys(node).forEach((key) => {
            delete (node as any)[key];
          });
          Object.assign(node, result);
        }
      }),
    ),
  );
}

export const mermaidPlugin: Plugin<[MermaidOptions?], GenericParent, GenericParent> =
  (opts) => async (tree, file) => {
    await mermaidTransform(tree, file, opts);
  };
