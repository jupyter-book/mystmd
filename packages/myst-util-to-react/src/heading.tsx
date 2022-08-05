import { Heading } from 'myst-spec';
import type { NodeRenderer } from './types';
import { createElement as e } from 'react';
import classNames from 'classnames';

function getHelpHashText(kind: string) {
  return `Link to this ${kind}`;
}

export function HashLink({
  id,
  kind,
  align = 'left',
}: {
  id: string;
  kind: string;
  align?: 'left' | 'right';
}) {
  const helpText = getHelpHashText(kind);
  return (
    <a
      className={classNames(
        'select-none absolute top-0 font-normal no-underline transition-opacity opacity-0 group-hover:opacity-70',
        {
          'left-0 -translate-x-[100%] pr-3': align === 'left',
          'right-0 translate-x-[100%] pl-3': align === 'right',
        },
      )}
      href={`#${id}`}
      title={helpText}
      aria-label={helpText}
    >
      #
    </a>
  );
}

const Heading: NodeRenderer<Heading> = (node, children) => {
  const { enumerator, depth, key, identifier } = node;
  const id = identifier || key;
  const textContent = (
    <>
      <HashLink id={id} align="left" kind="Section" />
      {enumerator && <span className="select-none mr-3">{enumerator}</span>}
      <span className="heading-text">{children}</span>
    </>
  );
  // The `heading-text` class picked up in the TableOfContents to select without the enumerator and "#" link
  return e(
    `h${depth}`,
    {
      key: id,
      id,
      className: 'relative group',
    },
    textContent,
  );
};

const HEADING_RENDERERS = {
  heading: Heading,
};

export default HEADING_RENDERERS;
