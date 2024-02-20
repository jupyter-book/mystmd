import type { Plugin } from 'unified';
import { selectAll } from 'unist-util-select';
import type { GenericNode, GenericParent } from 'myst-common';
import { RuleId, fileWarn } from 'myst-common';
import type { VFile } from 'vfile';
import type { Code, InlineCode } from 'myst-spec';

type Options = {
  lang?: string;
  transformPython?: boolean;
};

/**
 * Flatten any inline code that only has text in it to a single value.
 */
export function inlineCodeFlattenTransform(mdast: GenericParent, file: VFile) {
  const code = selectAll('inlineCode', mdast) as (InlineCode & { children?: GenericNode[] })[];
  code.forEach((node) => {
    if (!node?.children) return;
    if (node.value) {
      fileWarn(file, 'Both children and value defined for inline code.', {
        node,
        ruleId: RuleId.inlineCodeMalformed,
      });
      // This is a warning, but can be ignored.
      return;
    }
    if (!node.children.reduce((b, c) => b && c.type === 'text', true)) return;
    // All the children are now text nodes
    node.value = node.children.reduce((t, c) => t + c.value, '');
    delete node.children;
  });
}

export function codeTransform(mdast: GenericParent, file: VFile, opts?: Options) {
  const code = selectAll('code', mdast) as Code[];
  code.forEach((node) => {
    if (node.lang === '') return; // raw code cell passes through with no warning
    if (!node.lang) {
      if (!opts?.lang) {
        fileWarn(file, 'Language is not defined for code block', {
          node,
          ruleId: RuleId.codeLangDefined,
        });
        return;
      }
      node.lang = opts?.lang;
    }
    if (node.lang.toLowerCase().includes('python') && opts?.transformPython !== false) {
      // captures ipython3 etc.
      node.lang = 'python';
    }
  });
}

export const codePlugin: Plugin<[Options?], GenericParent, GenericParent> =
  (opts) => (tree, file) => {
    codeTransform(tree, file, opts);
  };

type CodeBlockTransformOptions = {
  translate: (string | { lang: string; directive?: string })[];
};

export function codeBlockToDirectiveTransform(
  tree: GenericParent,
  file: VFile,
  opts?: CodeBlockTransformOptions,
) {
  if (!opts || !opts.translate || opts.translate.length === 0) return;
  const nodes = selectAll('code', tree) as Code[];
  nodes.forEach((node) => {
    if (!node.lang) return;
    const res = opts.translate.find(
      (t) => t === node.lang || (typeof t !== 'string' && t.lang === node.lang),
    );
    if (!res) return;
    (node as GenericNode).type = typeof res === 'string' ? res : res.directive || res.lang;
    delete node.lang;
  });
}

export const codeBlockToDirectivePlugin: Plugin<
  [CodeBlockTransformOptions?],
  GenericParent,
  GenericParent
> = (opts) => (tree, file) => {
  codeBlockToDirectiveTransform(tree, file, opts);
};

export const inlineCodeFlattenPlugin: Plugin<[], GenericParent, GenericParent> =
  () => (tree, file) => {
    inlineCodeFlattenTransform(tree, file);
  };
