import useSWR from 'swr';
import {
  OutputSummaryEntry,
  OutputSummaryKind,
} from '@curvenote/blocks/dist/blocks/output';

export interface OutputSummary {
  kind: OutputSummaryKind;
  items: { [key: string]: OutputSummaryEntry };
}

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

export function useFetchAllTruncatedContent(summaries: OutputSummary[]) {
  const itemsWithPaths: OutputSummaryEntry[] = [];
  const paths: string[] = [];
  summaries.forEach((summary) => {
    Object.values(summary.items).forEach((item) => {
      if (item.path) {
        itemsWithPaths.push(item);
        paths.push(item.path);
      }
    });
  }, []);

  const { data, error } = useSWR<LongContent[]>(paths || null, arrayFetcher);

  data?.forEach(({ content }, idx) => {
    itemsWithPaths[idx].content = content;
  });

  return {
    data: data ? summaries : undefined,
    error,
  };
}
