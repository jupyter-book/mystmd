import { useEffect, useMemo, useRef, useState } from 'react';
import { useFetchAnyTruncatedContent } from './hooks';
import { nanoid } from 'nanoid';
import {
  selectIFrameReady,
  selectIFrameHeight as selectIFrameHeight,
} from '~/selectors';
import { State } from '~/store';
import { useSelector } from 'react-redux';
import { host, actions } from '@curvenote/connect';
import type { IOutput } from '@jupyterlab/nbformat';
import { MinifiedOutput, convertToIOutputs } from '@curvenote/nbtx';

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
    if (iframeRef.current == null || !rendererReady || !data) return;
    host.commsDispatch(
      iframeRef.current,
      actions.connectHostSendContent(uid, convertToIOutputs(data)),
    );
  }, [id, iframeRef.current, rendererReady]);

  useEffect(() => {
    if (height == null) return;
    setLoading(false);
  }, [height]);

  if (error) {
    return <div className="text-red-500">Error rendering output: {error.message}</div>;
  }

  if (process.env.NODE_ENV === 'development')
    console.log('Output connecting to http://localhost:3003');

  return (
    <>
      {loading && <div className="p-2.5">Loading...</div>}
      <iframe
        ref={iframeRef}
        id={uid}
        name={uid}
        title={uid}
        src={
          process.env.NODE_ENV === 'development' // TODO should this be in config.json?
            ? 'http://localhost:3003'
            : 'https://next.curvenote.run'
        }
        width={'100%'}
        height={height ? height + 25 : 0}
        sandbox="allow-scripts"
      ></iframe>
    </>
  );
};
