import { Component } from 'myst-util-to-react';
import { Link as RemixLink } from 'remix';

export const Link: Component = (node, children) => {
  const internal = node.internal ?? false;
  if (internal) {
    return (
      <RemixLink key={node.key} to={node.url} prefetch="intent">
        {children}
      </RemixLink>
    );
  }
  return (
    <a key={node.key} target="_blank" href={node.url}>
      {children}
    </a>
  );
};

export const linkRenderers = {
  link: Link,
};
