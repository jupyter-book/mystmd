import type { Root } from 'myst-spec';
import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import { gfmFootnoteToMarkdown } from 'mdast-util-gfm-footnote';
import { gfmTableToMarkdown } from 'mdast-util-gfm-table';
import type { Options } from 'mdast-util-to-markdown';
import { defaultHandlers, toMarkdown } from 'mdast-util-to-markdown';
import { directiveHandlers, directiveValidators } from './directives';
import { miscHandlers, miscValidators } from './misc';
import { referenceHandlers } from './references';
import { roleHandlers } from './roles';
import { runValidators, unsupportedHandlers } from './utils';

const FOOTNOTE_HANDLER_KEYS = ['footnoteDefinition', 'footnoteReference'];
const TABLE_HANDLER_KEYS = ['table', 'tableRow', 'tableCell'];

const plugin: Plugin<[], Root, VFile> = function () {
  this.Compiler = (node, file) => {
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
    file.result = toMarkdown(node as any, options).trim();
    return file;
  };

  return (node: Root) => {
    // Preprocess
    return node;
  };
};

export default plugin;
