import Ansi from 'ansi-to-react';
import { ensureString } from '@curvenote/blocks';
import type { MinifiedErrorOutput } from '@curvenote/nbtx';
import { MaybeLongContent } from './components';

export default function Error({ output }: { output: MinifiedErrorOutput }) {
  return (
    <MaybeLongContent
      content={ensureString(output.traceback)}
      path={output.path}
      render={(content?: string) => {
        return (
          <pre className="text-sm font-thin font-system jupyter-error">
            <Ansi>{content ?? ''}</Ansi>
          </pre>
        );
      }}
    />
  );
}
