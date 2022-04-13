import classNames from 'classnames';
import { NodeRenderer } from '~/myst-to-react';
import { useReferences } from '~/components/ReferencesProvider';
import { useState } from 'react';
import { ClickPopover } from './ClickPopover';
import { InlineError } from './inlineError';

function CiteChild({ label }: { label: string }) {
  const references = useReferences();
  const { html } = references?.cite.data[label] ?? {};
  return <div dangerouslySetInnerHTML={{ __html: html || '' }} />;
}

export const CiteGroup: NodeRenderer = (node, children) => {
  return (
    <span
      key={node.key}
      className={classNames('cite-group', {
        narrative: node.kind === 'narrative',
        parenthetical: node.kind === 'parenthetical',
      })}
    >
      {children}
    </span>
  );
};

export const Cite: NodeRenderer = (node, children) => {
  if (node.error) {
    return (
      <InlineError key={node.key} value={node.label} message={'Citation Not Found'} />
    );
  }
  return (
    <ClickPopover key={node.key} card={<CiteChild label={node.label as string} />}>
      {children}
    </ClickPopover>
  );
};

const HIDE_OVER_N_REFERENCES = 5;

export function Bibliography() {
  const references = useReferences();
  const { order, data } = references?.cite ?? {};
  const filtered = order?.filter((l) => l);
  const [hidden, setHidden] = useState(true);
  if (!filtered || !data || filtered.length === 0) return null;
  const refs = hidden ? filtered.slice(0, HIDE_OVER_N_REFERENCES) : filtered;
  return (
    <section>
      {filtered.length > HIDE_OVER_N_REFERENCES && (
        <button
          onClick={() => setHidden(!hidden)}
          className="float-right text-xs p-1 px-2 border rounded hover:border-blue-500 dark:hover:border-blue-400"
        >
          {hidden ? 'Show All' : 'Collapse'}
        </button>
      )}
      <header className="text-lg font-semibold text-stone-900 dark:text-white">
        References
      </header>
      <div className="text-xs mb-8 pl-3 text-stone-500 dark:text-stone-300">
        <ol>
          {refs.map((label) => {
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
          {filtered.length > HIDE_OVER_N_REFERENCES && (
            <li className="list-none text-center">
              <button
                onClick={() => setHidden(!hidden)}
                className="p-2 border rounded hover:border-blue-500 dark:hover:border-blue-400"
              >
                {hidden
                  ? `Show all ${filtered.length} references`
                  : 'Collapse references'}
              </button>
            </li>
          )}
        </ol>
      </div>
    </section>
  );
}

const CITE_RENDERERS: Record<string, NodeRenderer> = {
  citeGroup: CiteGroup,
  cite: Cite,
  bibliography: (node) => <Bibliography key={node.key}></Bibliography>,
};

export default CITE_RENDERERS;
