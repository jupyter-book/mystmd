import { IOutput } from '@jupyterlab/nbformat';
import { MinifiedOutput } from './types';

export function convertToIOutputs(minified: MinifiedOutput[]): IOutput[] {
  return minified.map((m: MinifiedOutput) => {
    switch (m.output_type) {
      case 'stream': {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { path, ...rest } = m;
        return rest;
      }
      case 'error': {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { path, traceback, ...rest } = m;
        return { ...rest, traceback: [traceback] };
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
