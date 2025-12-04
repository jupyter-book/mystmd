import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import type { Link } from 'myst-spec-ext';

// Matches "body<label>" and captures the body text (group 1) and link target (group 2).
const BODY_TARGET_PATTERN = /^(.+?)<([^<>]+)>$/;
// Matches an autolink-style "<target>" body.
const AUTOLINK_PATTERN = /^<([^<>]+)>$/;

export const buttonRole: RoleSpec = {
  name: 'button',
  doc: 'Button element with an action to navigate to internal or external links.',
  body: {
    type: String,
    doc: 'The body of the button.',
    required: true,
  },
  run(data: RoleData): GenericNode[] {
    const body = data.body as string;
    /**
     * Behavior:
     * - `{button}`text`` => button with text only (no link target).
     * - `{button}`<text>`` => button links to `text`, shows `text`.
     * - `{button}`text<label>`` => button links to `label`, shows `text`.
     */
    const bodyTargetMatch = BODY_TARGET_PATTERN.exec(body);
    if (bodyTargetMatch) {
      const [, bodyText, target] = bodyTargetMatch;
      const displayText = bodyText.trim();
      const node: Link = {
        type: 'link',
        url: target,
        children: displayText ? [{ type: 'text', value: displayText }] : [],
        class: 'button', // TODO: allow users to extend this
      };
      return [node];
    }

    const autolinkMatch = AUTOLINK_PATTERN.exec(body);
    if (autolinkMatch) {
      const [, target] = autolinkMatch;
      const node: Link = {
        type: 'link',
        url: target,
        children: [{ type: 'text', value: target }],
        class: 'button',
      };
      return [node];
    }

    return [
      {
        type: 'span',
        class: 'button',
        children: [{ type: 'text', value: body }],
      },
    ];
  },
};
