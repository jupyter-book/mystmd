import { Heading } from 'myst-spec';
import { NodeRenderer } from './types';
import { createElement as e } from 'react';

const Heading: NodeRenderer<Heading> = (node, children) => {
  // TODO: this should be in css
  const { enumerator, depth, key, identifier } = node;
  const id = identifier || key;
  const textContent = (
    <>
      <a
        className="select-none absolute top-0 left-0 -translate-x-[100%] font-normal pr-3 no-underline transition-opacity opacity-0 group-hover:opacity-70"
        href={`#${id}`}
        aria-label="Permalink to this Section"
      >
        <span>#</span>
      </a>
      {enumerator && <span className="select-none mr-3">{enumerator}</span>}
      {children}
    </>
  );
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
