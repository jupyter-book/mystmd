import useSWR from 'swr';

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
  content: string,
  url?: string,
): { data?: LongContent; error?: Error } {
  if (typeof window === 'undefined') return url ? {} : { data: { content } };
  const { data, error } = useSWR<LongContent>(url || null, fetcher);
  if (!url) return { data: { content } };
  return { data, error };
}
