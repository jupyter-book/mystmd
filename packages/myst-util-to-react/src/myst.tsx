import { useParse } from 'myst-util-to-react';
import yaml from 'js-yaml';
import type { NodeRenderer } from 'myst-util-to-react';
import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import { CopyIcon } from './CopyIcon';
import { CodeBlock } from './code';

async function parse(text: string) {
  const { MyST } = await import('mystjs');
  const myst = new MyST();
  const mdast = myst.parse(text);
  const html = myst.renderMdast(mdast);
  const content = useParse(mdast as any);
  return { mdast: yaml.dump(mdast), html, content };
}

export const MySTRenderer: NodeRenderer = (node) => {
  const area = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState<string>(node.value.trim());
  const [mdast, setMdast] = useState<string>('Loading...');
  const [html, setHtml] = useState<string>('Loading...');
  const [content, setContent] = useState<React.ReactNode>(<p>{node.value}</p>);
  const [previewType, setPreviewType] = useState('Demo');

  useEffect(() => {
    const ref = { current: true };
    parse(text).then((result) => {
      if (!ref.current) return;
      setMdast(result.mdast);
      setHtml(result.html);
      setContent(result.content);
    });
    return () => {
      ref.current = false;
    };
  }, [text]);

  useEffect(() => {
    if (!area.current) return;
    area.current.style.height = 'auto'; // for the scroll area in the next step!
    area.current.style.height = `${area.current.scrollHeight}px`;
  }, [text]);

  return (
    <figure key={node.key} className="relative shadow-lg rounded overflow-hidden">
      <div className="absolute right-0 p-1">
        <CopyIcon text={text} />
      </div>
      <div className="myst">
        <label>
          <span className="sr-only">Edit the MyST text</span>
          <textarea
            ref={area}
            value={text}
            className="block p-6 shadow-inner resize-none w-full font-mono bg-slate-50 outline-none"
            onChange={(e) => setText(e.target.value)}
          ></textarea>
        </label>
      </div>
      <div className="relative min-h-1 pt-[50px] px-6 pb-6">
        <div className="absolute cursor-pointer top-0 left-0 border">
          {['Demo', 'AST', 'HTML'].map((show) => (
            <button
              className={classnames('px-2 uppercase', {
                'bg-white hover:bg-slate-200': previewType !== show,
                'bg-curvenote-blue text-white': previewType === show,
              })}
              title={`Show the ${show}`}
              aria-label={`Show the ${show}`}
              aria-pressed={previewType === show ? 'true' : 'false'}
              onClick={() => setPreviewType(show)}
            >
              {show}
            </button>
          ))}
        </div>
        {previewType === 'Demo' && content}
        {previewType === 'AST' && <CodeBlock lang="yaml" value={mdast} showCopy={false} />}
        {previewType === 'HTML' && <CodeBlock lang="xml" value={html} showCopy={false} />}
      </div>
    </figure>
  );
};

const MYST_RENDERERS = {
  myst: MySTRenderer,
};

export default MYST_RENDERERS;
