import type { Root } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import type { Options } from 'mdast-util-to-markdown';
import { defaultHandlers, toMarkdown } from 'mdast-util-to-markdown';
import { directiveHandlers, directiveValidators } from './directives.js';
import { miscHandlers, miscValidators } from './misc.js';
import { referenceHandlers } from './references.js';
import { roleHandlers } from './roles.js';
import { addFrontmatter, runValidators, unsupportedHandlers } from './utils.js';
import type { PageFrontmatter } from 'myst-frontmatter';
import { basicTransformations } from './transforms/index.js';
import { copyNode } from 'myst-common';

const FOOTNOTE_HANDLER_KEYS = ['footnoteDefinition', 'footnoteReference'];
const TABLE_HANDLER_KEYS = ['table', 'tableRow', 'tableCell'];

export function writeMd(file: VFile, node: Root, frontmatter?: PageFrontmatter) {
  const handlers = {
    ...directiveHandlers,
    ...roleHandlers,
    ...referenceHandlers,
    ...miscHandlers,
  };
  const handlerKeys = [
    ...Object.keys(handlers),
    ...Object.keys(defaultHandlers),
    ...FOOTNOTE_HANDLER_KEYS,
    ...TABLE_HANDLER_KEYS,
  ];
  const copy = copyNode(node);
  const unsupported = unsupportedHandlers(copy, handlerKeys, file);
  const options: Options = {
    fences: true,
    rule: '-',
    ruleRepetition: 3,
    emphasis: '_',
    bullet: '-',
    listItemIndent: 'one',
    handlers: {
      ...handlers,
      ...unsupported,
    },
    join: [
      (left, right, parent) => {
        if (left.type === ('mystTarget' as any)) return 0;
        if (right.type === ('definitionDescription' as any)) return 0;
        if (
          // This ensures lists are tightly joined always
          left.type === ('listItem' as any) ||
          (right.type === ('list' as any) && parent.type === ('listItem' as any))
        )
          return 0;
        return 1;
      },
    ],
    extensions: [gfmFootnoteToMarkdown(), gfmTableToMarkdown()],
  };
  const validators = { ...directiveValidators, ...miscValidators };
  runValidators(copy, validators, file);
  basicTransformations(copy);
  const result = toMarkdown(copy as any, options);
  file.result = addFrontmatter(result, frontmatter);
  return file;
}

const plugin: Plugin<[PageFrontmatter?], Root, VFile> = function (frontmatter?) {
  this.Compiler = (node, file) => {
    return writeMd(file, node, frontmatter);
  };

  return (node: Root) => {
    // Preprocess
    return node;
  };
};

export default plugin;
