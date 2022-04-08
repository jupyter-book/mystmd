import { useEffect, useMemo, useRef, useState } from 'react';
import { useFetchAnyTruncatedContent } from './hooks';
import { MinifiedOutput } from '@curvenote/nbtx/dist/minify/types';
import { nanoid } from 'nanoid';
import {
  selectIFrameReady,
  selectIFrameHeight as selectIFrameHeight,
} from '~/selectors';
import { State } from '~/store';
import { useSelector } from 'react-redux';
import { host, actions } from '@curvenote/connect';
import type { IOutput } from '@jupyterlab/nbformat';

function toIOutputs(minified: MinifiedOutput[]): IOutput[] {
  return minified.map((m: MinifiedOutput) => {
    switch (m.output_type) {
      case 'stream':
      case 'error': {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { path, ...rest } = m;
        return rest;
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return {
          ...m,
          data: Object.entries(m.data).reduce((acc, [mimetype, payload]) => {
            return { ...acc, [mimetype]: payload.content };
          }, {}),
        };
      }
    }
  });
}

export const NativeJupyterOutputs = ({
  id,
  outputs,
}: {
  id: string;
  outputs: MinifiedOutput[];
}) => {
  if (typeof window === 'undefined') return null;

  const { data, error } = useFetchAnyTruncatedContent(outputs);

  const [loading, setLoading] = useState(true);

  const uid = useMemo(nanoid, []);

  const height = useSelector((state: State) => selectIFrameHeight(state, uid));
  const rendererReady = useSelector((state: State) => selectIFrameReady(state, uid));

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    console.log({ if: iframeRef.current, rendererReady, data });
    if (iframeRef.current == null || !rendererReady || !data) return;
    console.log('Sending...');
    console.log({ data, send: toIOutputs(data) });
    host.commsDispatch(
      iframeRef.current,
      actions.connectHostSendContent(uid, toIOutputs(data)),
    );
  }, [id, iframeRef.current, rendererReady]);

  console.log('height', height);
  useEffect(() => {
    if (height == null) return;
    setLoading(false);
  }, [height]);

  if (error) {
    console.log('ERROR', error);
    return <div className="text-red-500">Error rendering output: {error.message}</div>;
  }

  return (
    <>
      {loading && <div>Loading...</div>}
      <iframe
        ref={iframeRef}
        id={uid}
        name={uid}
        title={uid}
        src="http://localhost:3003"
        width={'100%'}
        height={height ? height + 25 : 0}
        sandbox="allow-scripts"
      ></iframe>
    </>
  );
};

export const outputRenderers = {
  output: NativeJupyterOutputs,
};
