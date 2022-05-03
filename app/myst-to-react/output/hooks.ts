import useSWRImmutable from 'swr/immutable';
import {
  MinifiedErrorOutput,
  MinifiedMimeBundle,
  MinifiedMimePayload,
  MinifiedOutput,
  MinifiedStreamOutput,
} from '@curvenote/nbtx/dist/minify/types';
import { walkPaths } from '@curvenote/nbtx/dist/minify/utils';
import { useState, useLayoutEffect } from 'react';

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
  const { data, error } = useSWRImmutable<LongContent>(url || null, fetcher);
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

export function useFetchAnyTruncatedContent(outputs: MinifiedOutput[]) {
  const itemsWithPaths: ObjectWithPath[] = [];
  const updated = shallowCloneOutputs(outputs);

  walkPaths(updated, (path, obj) => {
    // images have paths, but we don't need to fetch them
    if (
      'content_type' in obj &&
      (obj as MinifiedMimePayload).content_type.startsWith('image/')
    )
      return;
    obj.path = path;
    itemsWithPaths.push(obj);
  });

  const { data, error } = useSWRImmutable<LongContent[]>(
    itemsWithPaths.map(({ path }) => path),
    arrayFetcher,
  );

  data?.forEach(({ content }, idx) => {
    const obj = itemsWithPaths[idx];
    if ('text' in obj) obj.text = content; // stream
    if ('traceback' in obj) obj.traceback = content; // error
    if ('content' in obj) obj.content = content; // mimeoutput
    obj.path = undefined;
  });

  return {
    data: itemsWithPaths.length === 0 || data ? updated : undefined,
    error,
  };
}

function getWindowSize() {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export default function useWindowSize() {
  const [windowSize, setWindowSize] = useState(getWindowSize());

  useLayoutEffect(() => {
    function handleResize() {
      setWindowSize(getWindowSize());
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
