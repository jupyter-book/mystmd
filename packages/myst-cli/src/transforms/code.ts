import type { Root } from 'mdast';
import type { GenericNode } from 'myst-common';
import { fileError, fileWarn } from 'myst-common';
import { select, selectAll } from 'unist-util-select';
import yaml from 'js-yaml';
import type { ISession } from '../session/types.js';
import type { VFile } from 'vfile';

const CELL_OPTION_PREFIX = '#| ';

/**
 * Parse metadata from code block using js-yaml
 *
 * Metadata is defined at the beginning of code cells as:
 *
 * ```python
 * #| key: value
 * #| flag: true
 *
 * print('hello world')
 * ```
 *
 * New lines around metadata will be ignored, but once a non-metadata line
 * is encountered, metadata parsing is stopped (i.e. you cannot define
 * metadata in the middle of other code).
 */
export function metadataFromCode(
  session: ISession,
  filename: string,
  value: string,
  opts?: { remove?: boolean },
): { value: string; metadata?: Record<string, any> } {
  const metaLines: string[] = [];
  const outputLines: string[] = [];
  let inHeader = true;
  value.split('\n').forEach((line) => {
    if (inHeader) {
      if (line.startsWith(CELL_OPTION_PREFIX)) {
        metaLines.push(line.substring(CELL_OPTION_PREFIX.length));
      } else if (line.trim()) {
        inHeader = false;
      }
    }
    if (!inHeader || !opts?.remove) {
      outputLines.push(line);
    }
  });
  let metadata: Record<string, any> | undefined;
  if (metaLines.length) {
    try {
      metadata = yaml.load(metaLines.join('\n')) as Record<string, any>;
    } catch {
      session.log.error(`Invalid code cell metadata in ${filename}`);
    }
  }
  if (!metadata) {
    return { value };
  }
  return {
    value: outputLines.join('\n'),
    metadata,
  };
}

/**
 * Traverse mdast, remove code cell metadata, and add it to parent block
 */
export function liftCodeMetadataToBlock(session: ISession, filename: string, mdast: Root) {
  const blocks = selectAll('block', mdast) as GenericNode[];
  blocks.forEach((block) => {
    const codeNodes = selectAll('code', block) as GenericNode[];
    let blockMetadata: Record<string, any> | undefined;
    codeNodes.forEach((node) => {
      if (!node.value) return;
      const { metadata, value } = metadataFromCode(session, filename, node.value, { remove: true });
      if (blockMetadata && metadata) {
        session.log.warn(`Multiple code blocks with metadata found in ${filename}`);
      } else {
        blockMetadata = metadata;
      }
      node.value = value;
    });
    if (blockMetadata) {
      block.data = block.data ? { ...block.data, ...blockMetadata } : blockMetadata;
    }
  });
}

/**
 * Check duplicated meta tags and conflict meta tags.
 * Separate the meta tags from tag if filter is true, otherwise just go through and process.
 */
export function checkMetaTags(
  vfile: VFile,
  node: GenericNode,
  tags: string[],
  filter: boolean,
): string[] {
  const metaTagsCounter = new Map();
  for (const action of ['hide', 'remove']) {
    for (const target of ['cell', 'input', 'output']) {
      metaTagsCounter.set(`${action}-${target}`, 0);
    }
  }
  const check = (tag: string) => {
    const isMetaTag = metaTagsCounter.has(tag);
    if (isMetaTag) {
      metaTagsCounter.set(tag, metaTagsCounter.get(tag) + 1);
    }
    return !isMetaTag;
  };
  if (filter) {
    tags.splice(0, tags.length, ...tags.filter(check));
  } else {
    tags.forEach(check);
  }
  const validMetatags = [];
  metaTagsCounter.forEach((value, key) => {
    if (value >= 2) {
      fileWarn(vfile, `tag '${key}' is duplicated`, { node });
    }
  });
  for (const target of ['cell', 'input', 'output']) {
    const hide = metaTagsCounter.get(`hide-${target}`) > 0;
    const remove = metaTagsCounter.get(`remove-${target}`) > 0;
    if (hide && remove) {
      fileWarn(vfile, `'hide-${target}' and 'remove-${target}' both exist`, { node });
      validMetatags.push(`remove-${target}`);
    } else if (hide) {
      validMetatags.push(`hide-${target}`);
    } else if (remove) {
      validMetatags.push(`remove-${target}`);
    }
  }
  return validMetatags;
}

/**
 * Traverse mdast, propagate block tags to code and output
 */
export function propagateBlockDataToCode(session: ISession, vfile: VFile, mdast: Root) {
  const blocks = selectAll('block', mdast) as GenericNode[];
  blocks.forEach((block) => {
    if (!block.data || !block.data.tags) return;
    if (!Array.isArray(block.data.tags)) {
      fileError(vfile, `tags in code-cell directive must be a list of strings`, { node: block });
    }
    const validMetatags = checkMetaTags(vfile, block, block.data.tags, true);
    const codeNode = select('code[executable=true]', block) as GenericNode | null;
    const outputNode = select('output', block) as GenericNode | null;
    validMetatags.forEach((tag: string) => {
      switch (tag) {
        // should we raise when hide and remove both exist?
        case 'hide-cell':
          block.visibility = 'hide';
          break;
        case 'remove-cell':
          block.visibility = 'remove';
          break;
        case 'hide-input':
          if (codeNode) codeNode.visibility = 'hide';
          break;
        case 'remove-input':
          if (codeNode) codeNode.visibility = 'remove';
          break;
        case 'hide-output':
          if (outputNode) outputNode.visibility = 'hide';
          break;
        case 'remove-output':
          if (outputNode) outputNode.visibility = 'remove';
          break;
        default:
          session.log.debug(`tag '${tag}' is not valid in code-cell tags'`);
      }
    });
    if (!block.visibility) block.visibility = 'show';
    if (codeNode && !codeNode.visibility) codeNode.visibility = 'show';
    if (outputNode && !outputNode.visibility) outputNode.visibility = 'show';
  });
}
