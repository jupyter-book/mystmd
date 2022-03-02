import { Component, NodeTypes } from 'myst-util-to-react';
import { InformationCircleIcon } from '@heroicons/react/outline';

export const AdmonitionTitle: Component = (node, children) => {
  return (
    <p
      key={node.key}
      className="admonition-header m-0 bg-blue-50 dark:bg-slate-900 text-lg font-medium"
    >
      <InformationCircleIcon className="h-8 w-8 inline-block pl-2 mr-2 text-blue-600" />
      {children}
    </p>
  );
};

export const Admonition: Component = (node, children) => {
  const [title, ...rest] = children as any[];
  return (
    <aside
      key={node.key}
      className="admonition rounded-md my-4 border-l-4 border-blue-500 shadow-md dark:shadow-2xl overflow-hidden"
    >
      {title}
      <div className="px-4 py-1">{rest}</div>
    </aside>
  );
};

export const admonitionRenderers: NodeTypes = {
  admonition: Admonition,
  admonitionTitle: AdmonitionTitle,
};
