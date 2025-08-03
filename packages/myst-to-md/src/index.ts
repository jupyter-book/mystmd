import type { Root } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import type { Options } from 'mdast-util-to-markdown';
import { defaultHandlers, toMarkdown } from 'mdast-util-to-markdown';
import { directiveHandlers, directiveValidators } from './directives.js';
import { exerciseDirectives } from 'myst-ext-exercise';
import { miscHandlers, miscValidators } from './misc.js';
import { referenceHandlers } from './references.js';
import { roleHandlers } from './roles.js';
import { addFrontmatter, runValidators, unsupportedHandlers } from './utils.js';
import type { PageFrontmatter } from 'myst-frontmatter';

const FOOTNOTE_HANDLER_KEYS = ['footnoteDefinition', 'footnoteReference'];
const TABLE_HANDLER_KEYS = ['table', 'tableRow', 'tableCell'];

export function writeMd(file: VFile, node: Root, frontmatter?: PageFrontmatter) {
  const handlers = {
    ...directiveHandlers,
    ...roleHandlers,
    ...referenceHandlers,
    ...miscHandlers,
  };
  const exerciseDirectivesNames = exerciseDirectives.flatMap(({ name, alias }) => [
    ...(name && name.trim() !== '' ? [name] : []),
    ...(alias?.filter((a) => a && a.trim() !== '') || []),
  ]);
  const handlerKeys = [
    ...Object.keys(handlers),
    ...Object.keys(defaultHandlers),
    ...exerciseDirectivesNames,
    ...FOOTNOTE_HANDLER_KEYS,
    ...TABLE_HANDLER_KEYS,
  ];
  const unsupported = unsupportedHandlers(node, handlerKeys, file);
  const options: Options = {
    fences: true,
    rule: '-',
    handlers: {
      ...handlers,
      ...unsupported,
    },
    extensions: [gfmFootnoteToMarkdown(), gfmTableToMarkdown()],
  };
  const validators = { ...directiveValidators, ...miscValidators };
  runValidators(node, validators, file);
  const result = toMarkdown(node as any, options).trim();
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
