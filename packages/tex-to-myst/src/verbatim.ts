import { u } from 'unist-builder';
import type { Handler } from './types.js';
import type { VFile } from 'vfile';
import type { GenericNode } from 'myst-common';
import { fileWarn, normalizeLabel } from 'myst-common';
import type { Code } from 'myst-spec-ext';

type ListingsProps = {
  language?: string;
  caption?: string;
  label?: string;
  numbers?: string;
  firstnumber?: string;
};

function getListingProperty(line?: string): ListingsProps | false {
  if (!line || !line.match(/^\s*\[(.*)\]\s*$/)) return false;
  const props: ListingsProps = {};
  ['language', 'caption', 'label', 'numbers', 'firstnumber'].forEach((key) => {
    let prop = line.match(new RegExp(`${key}(?:[\\s]*)?=([^,\\]]*)`))?.[1].trim();
    if (prop?.match(/^{.*}$/)) prop = prop.slice(1, prop.length - 1);
    props[key as keyof typeof props] = prop;
  });
  return props;
}

function parseFirstLine(vfile: VFile, node: GenericNode) {
  const code = node.content;
  const lines = code?.split('\n');
  const firstLine = lines?.[0];
  const props = getListingProperty(firstLine);
  if (!lines || props === false) return { value: code?.replace(/(\s)$/, '') };
  const value = lines.slice(1).join('\n').replace(/(\s)$/, '');
  let startingLineNumber = undefined;
  let showLineNumbers = undefined;
  if (props.firstnumber) {
    const number = parseInt(props.firstnumber, 10);
    if (isNaN(number)) {
      fileWarn(vfile, 'Unknown code option for "firstnumber", should be an integer.', { node });
    } else {
      startingLineNumber = number;
    }
  }
  if (props.numbers) {
    if (['none', 'left', 'right'].includes(props.numbers)) {
      if (props.numbers !== 'none') showLineNumbers = true;
    } else {
      fileWarn(
        vfile,
        "Unknown code option for \"numbers\", should be an 'none', 'left' or 'right'.",
        { node },
      );
    }
  }
  return {
    lang: props.language,
    value,
    label: props.label,
    caption: props.caption,
    showLineNumbers,
    startingLineNumber,
  };
}

export const VERBATIM_HANDLERS: Record<string, Handler> = {
  verbatim(node, state) {
    if (node.env === 'comment') {
      state.pushNode(u('comment', { value: node?.content.trim() ?? '' }));
      return;
    }
    state.closeParagraph();
    const { value, lang, showLineNumbers, startingLineNumber, ...props } = parseFirstLine(
      state.file,
      node,
    );
    const { label, identifier } = normalizeLabel(props.label as string | undefined) || {};
    const code = u('code', { value, lang, showLineNumbers, startingLineNumber }) as Code;
    if (props.caption) {
      state.pushNode(
        u('container', { kind: 'code', label, identifier }, [
          code,
          u('caption', [u('paragraph', [u('text', props.caption)])]),
        ]),
      );
      return;
    }
    code.label = label;
    code.identifier = identifier;
    state.pushNode(code);
  },
};
