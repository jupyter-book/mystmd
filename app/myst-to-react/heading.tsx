import { Heading } from 'myst-spec';
import { NodeRenderer } from './types';
import { createElement as e } from 'react';

const HELP_TEXT = 'Link to this Section';

const Heading: NodeRenderer<Heading> = (node, children) => {
  const { enumerator, depth, key, identifier } = node;
  const id = identifier || key;
  const textContent = (
    <>
      <a
        className="select-none absolute top-0 left-0 -translate-x-[100%] font-normal pr-3 no-underline transition-opacity opacity-0 group-hover:opacity-70"
        href={`#${id}`}
        title={HELP_TEXT}
        aria-label={HELP_TEXT}
      >
        #
      </a>
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
