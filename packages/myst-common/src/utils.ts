import type { VFile } from 'vfile';
import type { VFileMessage } from 'vfile-message';
import { map } from 'unist-util-map';
import { customAlphabet } from 'nanoid';
import type { Node, Parent, PhrasingContent } from 'myst-spec';
import type { AdmonitionKind, GenericNode, GenericParent } from './types.js';

export type MessageInfo = {
  node?: Node;
  note?: string;
  source?: string;
  url?: string;
  fatal?: boolean;
};

function addMessageInfo(message: VFileMessage, info?: MessageInfo) {
  if (info?.note) message.note = info?.note;
  if (info?.url) message.url = info?.url;
  if (info?.fatal) message.fatal = true;
  return message;
}

export function fileError(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  return addMessageInfo(file.message(message, opts?.node, opts?.source), { ...opts, fatal: true });
}

export function fileWarn(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  return addMessageInfo(file.message(message, opts?.node, opts?.source), opts);
}

export function fileInfo(file: VFile, message: string | Error, opts?: MessageInfo): VFileMessage {
  return addMessageInfo(file.info(message, opts?.node, opts?.source), opts);
}

const az = 'abcdefghijklmnopqrstuvwxyz';
const alpha = az + az.toUpperCase();
const numbers = '0123456789';
const nanoidAZ = customAlphabet(alpha, 1);
const nanoidAZ9 = customAlphabet(alpha + numbers, 9);

export function createId() {
  return nanoidAZ() + nanoidAZ9();
}

/**
 * https://github.com/syntax-tree/mdast#association
 * @param label A label field can be present.
 *        label is a string value: it works just like title on a link or a
 *        lang on code: character escapes and character references are parsed.
 * @returns { identifier, label, html_id }
 */
export function normalizeLabel(
  label: string | undefined,
): { identifier: string; label: string; html_id: string } | undefined {
  if (!label) return undefined;
  const identifier = label
    .replace(/[\t\n\r ]+/g, ' ')
    .trim()
    .toLowerCase();
  const html_id = createHtmlId(identifier) as string;
  return { identifier, label: label, html_id };
}

export function createHtmlId(identifier?: string): string | undefined {
  if (!identifier) return undefined;
  return identifier
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Remove any fancy characters
    .replace(/^([0-9-])/, 'id-$1') // Ensure that the id starts with a letter
    .replace(/-[-]+/g, '-') // Replace repeated `-`s
    .replace(/(?:^[-]+)|(?:[-]+$)/g, ''); // Remove repeated `-`s at the start or the end
}

export function liftChildren(tree: GenericParent, nodeType: string) {
  map(tree, (node) => {
    const children = ((node as GenericParent).children as Parent[])
      ?.map((child) => {
        if (child.type === nodeType && child.children) return child.children;
        return child;
      })
      ?.flat();
    // There are some checks in unist that look like `'children' in node`
    // all children must be deleted, and not a key on the object
    if (node && (node as any).children == null) delete (node as any).children;
    if (children !== undefined) (node as Parent).children = children;
    return node;
  });
}

export function setTextAsChild(node: Partial<Parent>, text: string) {
  node.children = [{ type: 'text', value: text } as Node];
}

export function toText(content?: Node[] | Node | null): string {
  if (!content) return '';
  if (!Array.isArray(content)) return toText([content]);
  return (content as PhrasingContent[])
    .map((n) => {
      if (!n || typeof n === 'string') return n || '';
      if ('value' in n) return n.value;
      if ('children' in n && n.children) return toText(n.children);
      return '';
    })
    .join('');
}

export function copyNode<T extends Node | Node[]>(node: T): T {
  return JSON.parse(JSON.stringify(node));
}

export function mergeTextNodes(node: GenericNode): GenericNode {
  const children = node.children?.reduce((c, n) => {
    if (n?.type !== 'text') {
      c.push(mergeTextNodes(n));
      return c;
    }
    const last = c[c.length - 1];
    if (last?.type !== 'text') {
      c.push(n);
      return c;
    }
    if (n.position?.end) {
      if (!last.position) last.position = {} as Required<GenericNode>['position'];
      last.position.end = n.position.end;
    }
    if (!last.value) last.value = '';
    if (n.value) last.value += n.value;
    return c;
  }, [] as GenericNode[]);
  if (children) node.children = children;
  return node;
}

export function admonitionKindToTitle(kind: AdmonitionKind | string) {
  const transform: Record<string, string> = {
    attention: 'Attention',
    caution: 'Caution',
    danger: 'Danger',
    error: 'Error',
    important: 'Important',
    hint: 'Hint',
    note: 'Note',
    seealso: 'See Also',
    tip: 'Tip',
    warning: 'Warning',
  };
  return transform[kind] || `Unknown Admonition "${kind}"`;
}

export function writeTexLabelledComment(title: string, commands: string[], commentLength: number) {
  if (!commands || commands?.length === 0) return '';
  const len = (commentLength - title.length - 4) / 2;
  const start = ''.padEnd(Math.ceil(len), '%');
  const end = ''.padEnd(Math.floor(len), '%');
  const titleBlock = `${start}  ${title}  ${end}\n`;
  return `${titleBlock}${commands.join('\n')}\n`;
}
