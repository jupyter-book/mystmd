import useSWR from 'swr';
import {
  MinifiedErrorOutput,
  MinifiedMimeBundle,
  MinifiedMimePayload,
  MinifiedOutput,
  MinifiedStreamOutput,
} from '@curvenote/nbtx/dist/minify/types';
import { walkPaths } from '@curvenote/nbtx/dist/minify/utils';

/**
 * Truncation vs Summarization
 *
 * In Curvespace, we're decided to change our data structure for outputs to align it as
 * closely as possible with Jupyters nbformat.IOutput[] type, but in a way that still allows
 * us to truncate output content and push that to storage.
 *
 * This will be used only in the CLI and Curvespace initially but should be ported back to
 * the rest of the code base. This will mean
 *
 * - changing the DB schema
 * - migration
 * - changing API response
 * - changing the frontend
 * - changing the extension
 *
 */

interface LongContent {
  content_type?: string;
  content: string;
}

const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => {
    if (res.status === 200) return res.json();
    throw new Error(`Content returned with status ${res.status}.`);
  });

export function useLongContent(
  content?: string,
  url?: string,
): { data?: LongContent; error?: Error } {
  if (typeof window === 'undefined')
    return url ? {} : { data: { content: content ?? '' } };
  const { data, error } = useSWR<LongContent>(url || null, fetcher);
  if (!url) return { data: { content: content ?? '' } };
  return { data, error };
}

const arrayFetcher = (...urls: string[]) => {
  return Promise.all(urls.map((url) => fetcher(url)));
};

type ObjectWithPath = MinifiedErrorOutput | MinifiedStreamOutput | MinifiedMimePayload;

function shallowCloneOutputs(outputs: MinifiedOutput[]) {
  return outputs.map((output) => {
    if ('data' in output && output.data) {
      const data = output.data as MinifiedMimeBundle;
      return {
        ...output,
        data: Object.entries(data).reduce((acc, [mimetype, payload]) => {
          return { ...acc, [mimetype]: { ...payload } };
        }, {}),
      };
    }
    return { ...output };
  });
}

export function useFetchAllTruncatedContent(outputs: MinifiedOutput[]) {
  const itemsWithPaths: ObjectWithPath[] = [];
  const updated = shallowCloneOutputs(outputs);

  walkPaths(updated, (path, obj) => {
    itemsWithPaths.push({ ...obj, path });
  });

  const { data, error } = useSWR<LongContent[]>(
    itemsWithPaths.map(({ path }) => path) || null,
    arrayFetcher,
  );

  data?.forEach(({ content }, idx) => {
    const obj = itemsWithPaths[idx];
    if ('text' in obj) obj.text = content; // stream
    if ('traceback' in obj) obj.traceback = content; // error
    if ('content' in obj) obj.content = content; // mimeoutput
  });

  return {
    data: data ? [...outputs] : undefined,
    error,
  };
}
