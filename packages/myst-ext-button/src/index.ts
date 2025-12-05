import type { RoleSpec, RoleData, GenericNode } from 'myst-common';
import type { Link } from 'myst-spec-ext';

// Matches "text<link>" capturing body text (group 1) and an optional "<link>" suffix (group 2).
// Group 2 keeps the angle brackets; it can also be exactly "<>" to signal an empty target.
const TEXT_LINK_PATTERN = /^([^<>]*)(<[^<>]*>)?$/;

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
     * - `{button}`text`` => button with text, no link target (rendered as span.button).
     * - `{button}`<text>`` => button links to `text`, shows `text`.
     * - `{button}`text<label>`` => button links to `label`, shows `text`.
     * - `{button}`text<>`` or `{button}`text` (no link) => button with text, no link target.
     */
    const match = TEXT_LINK_PATTERN.exec(body);
    if (!match) {
      // Fallback if we don't match: degrade to a plain-text button.
      return [
        {
          type: 'span',
          class: 'button',
          children: [{ type: 'text', value: "❌ could not parse button syntax!" }],
        },
      ];
    }

    const [, rawBodyText, rawLink] = match;
    const bodyText = rawBodyText?.trim() ?? '';
    // If no link, return nothing. Otherwise strip brackets.
    const linkTarget =
      rawLink && rawLink !== '<>'
        ? rawLink.slice(1, -1) // strip angle brackets
        : undefined;

    // Prefer body text, otherwise fall back to the link text.
    const displayText = bodyText || linkTarget || '';

    // No link target -> render a <span> button container.
    if (!linkTarget) {
      return [
        {
          type: 'span',
          children: displayText ? [{ type: 'text', value: displayText }] : [],
          class: 'button', // TODO: allow users to extend this
        },
      ];
    }

    // Link target present -> render a link-styled button.
    const node: Link = {
      type: 'link',
      url: linkTarget,
      children: displayText ? [{ type: 'text', value: displayText }] : [],
      class: 'button', // TODO: allow users to extend this
    };
    return [node];
  },
};
