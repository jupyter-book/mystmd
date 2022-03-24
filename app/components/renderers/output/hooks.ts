import { useEffect, useState } from 'react';

interface LongContent {
  contentType: string;
  content: string;
}

export function useFetchLongContent(url?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [longContent, setLongContent] = useState<LongContent | undefined>(undefined);

  useEffect(() => {
    if (!url) return;
    setLoading(true);
    fetch(url).then((res) => {
      if (res.ok) {
        res.json().then((json) => {
          setLongContent(json);
        });
      } else {
        setError(`status: ${res.status} | ${res.statusText}`);
      }
      setLoading(false);
    });
  }, [url]);

  return {
    loading,
    error,
    longContent,
  };
}
