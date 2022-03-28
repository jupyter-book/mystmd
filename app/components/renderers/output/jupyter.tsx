import PassiveCellRenderer from 'thebe-core/dist/passive';
import { nanoid } from 'nanoid';
import { OutputSummary, useFetchAllTruncatedContent } from './hooks';
import { useEffect, useRef } from 'react';

// we could import these types from @juptyerlab/nbformat
export type IOutput = Record<string, any>;

export function convertToJupyterOutputs(summaries: OutputSummary[]): IOutput[] {
  return summaries.map((summary: OutputSummary) => {
    return Object.entries(summary.items).reduce((acc, [mimetype, item]) => {
      return { ...acc, [mimetype]: item.content };
    }, {});
  });
}

export const NativeJupyterOutputs = ({ summaries }: { summaries: OutputSummary[] }) => {
  const renderer = useRef<PassiveCellRenderer | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);

  const { data, error } = useFetchAllTruncatedContent(summaries);

  useEffect(() => {
    if (!ref.current || !data || renderer.current) return;
    renderer.current = new PassiveCellRenderer(nanoid());
    renderer.current.attachToDOM(ref.current);
    renderer.current.render(convertToJupyterOutputs(summaries));
  }, [ref, renderer, data]);

  if (error)
    return <div className="text-red-500">Error rendering output: {error.message}</div>;

  return <div ref={ref}>Loading...</div>;
};

export const outputRenderers = {
  output: NativeJupyterOutputs,
};
