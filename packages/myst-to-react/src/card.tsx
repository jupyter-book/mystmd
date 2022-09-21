import React from 'react';
import type { NodeRenderer } from './types';
import classNames from 'classnames';
// import { AdmonitionKind } from 'mystjs';

type CardSpec = {
  type: 'card';
  url?: string;
};
type CardTitleSpec = {
  type: 'cardTitle';
};
type HeaderSpec = {
  type: 'header';
};
type FooterSpec = {
  type: 'footer';
};

export const Header: NodeRenderer<HeaderSpec> = (node, children) => {
  return (
    <header
      key={node.key}
      className="m-0 py-1 pl-3 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800"
    >
      {children}
    </header>
  );
};

export const Footer: NodeRenderer<FooterSpec> = (node, children) => {
  return (
    <footer
      key={node.key}
      className="m-0 py-1 pl-3 bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800"
    >
      {children}
    </footer>
  );
};

export const CardTitle: NodeRenderer<CardTitleSpec> = (node, children) => {
  return (
    <div key={node.key} className="pt-3 font-bold group-hover:underline">
      {children}
    </div>
  );
};

type Parts = {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
};

function getParts(children: React.ReactNode): Parts {
  const parts: Parts = {};
  if (!Array.isArray(children)) return parts;
  const next = [...children];
  if (next[0]?.type === 'header') {
    parts.header = next.splice(0, 1);
  }
  if (next[next.length - 1]?.type === 'footer') {
    parts.footer = next.splice(-1, 1);
  }
  parts.body = next;
  return parts;
}

function Card({ children, url }: { children: React.ReactNode; url?: string }) {
  const parts = getParts(children);
  const link = !!url;
  const sharedStyle =
    'rounded-md shadow dark:shadow-neutral-800 overflow-hidden border border-gray-100 dark:border-gray-800';
  if (link) {
    // TODO: internal links
    return (
      <a
        href={url}
        className={classNames(
          sharedStyle,
          'block font-normal no-underline cursor-pointer group',
          'hover:border-blue-500 dark:hover:border-blue-400',
        )}
      >
        {parts.header}
        <div className="py-2 px-4">{parts.body}</div>
        {parts.footer}
      </a>
    );
  }
  return (
    <div className={sharedStyle}>
      {parts.header}
      <div className="py-2 px-4">{parts.body}</div>
      {parts.footer}
    </div>
  );
}

export const CardRenderer: NodeRenderer<CardSpec> = (node, children) => {
  return (
    <Card key={node.key} url={node.url}>
      {children}
    </Card>
  );
};

const CARD_RENDERERS = {
  card: CardRenderer,
  cardTitle: CardTitle,
  header: Header,
  footer: Footer,
};

export default CARD_RENDERERS;
