import { useEffect, useMemo, useRef, useState } from 'react';
import { useFetchAllTruncatedContent } from './hooks';
import { MinifiedOutput } from '@curvenote/nbtx/dist/minify/types';
import { nanoid } from 'nanoid';
import {
  selectIFrameReady,
  selectIFrameHeight as selectIFrameHeight,
} from '~/selectors';
import { State } from '~/store';
import { useSelector } from 'react-redux';
import { host, actions } from '@curvenote/connect';

export const NativeJupyterOutputs = ({
  id,
  outputs,
}: {
  id: string;
  outputs: MinifiedOutput[];
}) => {
  if (typeof window === 'undefined') return null;

  const [loading, setLoading] = useState(false);
  const { data, error } = useFetchAllTruncatedContent(outputs);
  const uid = useMemo(nanoid, []);

  const height = useSelector((state: State) => selectIFrameHeight(state, uid));
  const rendererReady = useSelector((state: State) => selectIFrameReady(state, uid));

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    console.log('curvespace iframe', iframeRef.current != null);
    console.log('curvespace ready', rendererReady);
    console.log('curvespace data', !!data);
    if (iframeRef.current == null || !rendererReady || !data) return;
    host.commsDispatch(iframeRef.current, actions.connectHostSendContent(uid, data));
    setTimeout(() => setLoading(false), 100);
  }, [id, iframeRef.current, rendererReady]);

  useEffect(() => {
    if (height == null) return;
    setLoading(false);
  }, [height]);

  if (error)
    return <div className="text-red-500">Error rendering output: {error.message}</div>;

  const styles = {
    border: '1px solid blue',
    backgroundColor: loading ? 'red' : 'white',
  };

  return (
    <>
      {loading && <div>Loading...</div>}
      <iframe
        ref={iframeRef}
        style={styles}
        id={uid}
        name={uid}
        title={uid}
        src="http://localhost:3003"
        width={'100%'}
        height={height ?? 150}
        sandbox="allow-scripts"
      ></iframe>
    </>
  );
};

export const outputRenderers = {
  output: NativeJupyterOutputs,
};
