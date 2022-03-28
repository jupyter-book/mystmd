import { OutputSummaryKind } from '@curvenote/blocks/dist/blocks/output';
import { MaybeLongContent } from './components';
import { OutputSummary } from './hooks';

function SafeOutput({ output }: { output: OutputSummary }) {
  const entry = output.items[output.kind];
  switch (output.kind) {
    case OutputSummaryKind.image:
      return <img src={`${entry.path}`} />;
    case OutputSummaryKind.text:
      return (
        <MaybeLongContent {...entry} render={(content?: string) => <p>{content}</p>} />
      );
    case OutputSummaryKind.stream:
    case OutputSummaryKind.json:
      return (
        <MaybeLongContent
          {...entry}
          render={(content: string) => (
            <pre className="max-h-[20em] overflow-scroll">{content}</pre>
          )}
        />
      );
    default:
      console.warn(entry);
      console.warn(`Missing output: ${entry?.kind}`);
      return null;
  }
}

export function SafeOutputs({
  keyStub,
  data,
}: {
  keyStub: string;
  data: OutputSummary[];
}) {
  // TODO better key - add keys during content creation?
  const components = data.map((output, idx) => (
    <SafeOutput key={`${keyStub}-${idx}`} output={output} />
  ));
  return <>{components}</>;
}
