import type { VFile } from 'vfile';
import type { VFileMessage } from 'vfile-message';
import { map } from 'unist-util-map';
import { customAlphabet } from 'nanoid';
import type { Root, PhrasingContent } from 'mdast';
import type { Node, Parent } from 'myst-spec';

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
  return addMessageInfo(file.message(message, opts?.node, opts?.source), opts);
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
 * @returns { identifier, label }
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
  return { identifier, label, html_id };
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

export function liftChildren(tree: Root, nodeType: string) {
  map(tree, (node) => {
    const children = ((node as Parent).children as Parent[])
      ?.map((child) => {
        if (child.type === nodeType && child.children) return child.children;
        return child;
      })
      ?.flat();
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
      if ('value' in n) return n.value;
      if ('children' in n && n.children) return toText(n.children);
      return '';
    })
    .join('');
}

export function copyNode<T extends Node | Node[]>(node: T): T {
  return JSON.parse(JSON.stringify(node));
}
