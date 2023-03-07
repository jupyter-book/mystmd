import type { Handle, Info, State } from 'mdast-util-to-markdown';
import type { Parent } from 'mdast';
import { defaultHandlers } from 'mdast-util-to-markdown';

function roleMarkerFromState(state: State) {
  const nestedRoleCount = state.stack.filter((n) => (n as any) === 'role').length;
  return '`'.repeat(nestedRoleCount);
}

/**
 * Handler for any role with children nodes
 *
 * This adds multiple backticks in cases where roles are nested
 */
function writePhrasingRole(name: string) {
  return (node: any, _: Parent | undefined, state: State, info: Info): string => {
    const exit = state.enter('role' as any);
    const marker = roleMarkerFromState(state);
    const tracker = state.createTracker(info);
    let value = tracker.move(`{${name}}`);
    value += tracker.move(marker);
    value += tracker.move(
      state.containerPhrasing(node, {
        before: value,
        after: marker,
        ...tracker.current(),
      }),
    );
    if (value.endsWith('`')) value += tracker.move(' ');
    value += tracker.move(marker);
    exit();
    return value;
  };
}

/**
 * Inline code handler
 *
 * This extends the default inlineCode handler by adding additional surrounding
 * backticks if nested inside role(s)
 *
 * If the inlineCode is nested inside a role, a backtick within the inlineCode
 * will break myst parsing, so we raise an error.
 */
function inlineCode(node: any, _: Parent | undefined, state: State): string {
  const marker = roleMarkerFromState(state);
  if (marker && node.value?.includes('`')) {
    throw Error();
  }
  return `${marker}${defaultHandlers.inlineCode(node, undefined, state)}${marker}`;
}

/**
 * Handler for any role with a static value, not children
 */
function writeStaticRole(name: string) {
  return (node: any, _: Parent | undefined, state: State): string => {
    return `{${name}}${inlineCode(node, undefined, state)}`;
  };
}

/**
 * Generic MyST role handler
 *
 * This uses the role name/value and ignores any children nodes
 */
function mystRole(node: any, parent: Parent | undefined, state: State): string {
  return writeStaticRole(node.name)(node, parent, state);
}

/**
 * Abbreviation role handler
 *
 * This is almost identical to 'writePhrasingRole' except it appends the title
 * before closing the backticks.
 */
function abbreviation(node: any, _: Parent | undefined, state: State, info: Info): string {
  const exit = state.enter('role' as any);
  const marker = roleMarkerFromState(state);
  const tracker = state.createTracker(info);
  let value = tracker.move('{abbr}');
  value += tracker.move(marker);
  value += tracker.move(
    state.containerPhrasing(node, {
      before: value,
      after: marker,
      ...tracker.current(),
    }),
  );
  if (node.title) value += tracker.move(` (${node.title})`);
  if (value.endsWith('`')) value += tracker.move(' ');
  value += tracker.move(marker);
  exit();
  return value;
}

/**
 * Cite role handler
 */
function cite(node: any, _: Parent | undefined, state: State, info: Info): string {
  const exit = state.enter('role' as any);
  const marker = roleMarkerFromState(state);
  const tracker = state.createTracker(info);
  let value = tracker.move('{cite}');
  value += tracker.move(marker);
  value += tracker.move(node.label);
  value += tracker.move(marker);
  exit();
  return value;
}

/**
 * Cite group role handler
 */
function citeGroup(node: any, _: Parent | undefined, state: State, info: Info): string {
  const exit = state.enter('role' as any);
  const marker = roleMarkerFromState(state);
  const tracker = state.createTracker(info);
  let value = tracker.move(`{cite${node.kind === 'narrative' ? ':t' : ':p'}}`);
  value += tracker.move(marker);
  const labels = ((node.children ?? []) as { type: string; label: string }[])
    .filter((n) => n.type === 'cite')
    .map((n) => n.label)
    .join(',');
  value += tracker.move(labels);
  value += tracker.move(marker);
  exit();
  return value;
}

export const roleHandlers: Record<string, Handle> = {
  subscript: writePhrasingRole('sub'),
  superscript: writePhrasingRole('sup'),
  delete: writePhrasingRole('del'),
  underline: writePhrasingRole('u'),
  smallcaps: writePhrasingRole('sc'),
  abbreviation,
  inlineMath: writeStaticRole('math'),
  inlineCode,
  cite,
  citeGroup,
  mystRole,
};
