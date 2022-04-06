import { useFetchAllTruncatedContent } from './hooks';
import { MinifiedOutput } from '@curvenote/nbtx/dist/minify/types';

export const NativeJupyterOutputs = ({ outputs }: { outputs: MinifiedOutput[] }) => {
  const { data, error } = useFetchAllTruncatedContent(outputs);

  if (error)
    return <div className="text-red-500">Error rendering output: {error.message}</div>;

  // curvenote "connect"

  // return <iframe src="https://next.curvenote.run" allowscripts></iframe>;
  return <div>[Unsafe Content - Waiting for Render Service]</div>;
};

export const outputRenderers = {
  output: NativeJupyterOutputs,
};
