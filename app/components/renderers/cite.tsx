import { useParse, Component, NodeTypes } from 'myst-util-to-react';
import { useReferences } from '../ReferencesProvider';
import { GenericParent } from 'mystjs';
import { ClickPopover } from './ClickPopover';

function CiteChild({ label }: { label: string }) {
  const references = useReferences();
  const { html } = references?.cite.data[label] ?? {};
  return <div dangerouslySetInnerHTML={{ __html: html || '' }} />;
}

export const CiteGroup: Component = (node, children) => {
  return (
    <span key={node.key} className="cite-group">
      {children}
    </span>
  );
};

export const Cite: Component = (node, children) => {
  return (
    <ClickPopover key={node.key} card={<CiteChild label={node.label as string} />}>
      {children}
    </ClickPopover>
  );
};

function Bibliography() {
  const references = useReferences();
  const { order, data } = references?.cite ?? {};
  const filtered = order?.filter((l) => l);
  if (!filtered || !data || filtered.length === 0) return null;
  return (
    <div className="text-xs mb-8 pl-3 text-stone-500 dark:text-stone-300">
      <ol>
        {filtered.map((label) => {
          const { html } = data[label];
          return (
            <li
              key={label}
              className="break-words"
              id={`cite-${label}`}
              dangerouslySetInnerHTML={{ __html: html || '' }}
            />
          );
        })}
      </ol>
    </div>
  );
}

export const citeRenderers: NodeTypes = {
  citeGroup: CiteGroup,
  cite: Cite,
  bibliography: (node) => <Bibliography key={node.key}></Bibliography>,
};
