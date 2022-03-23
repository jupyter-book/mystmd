import { useEffect, useState } from 'react';
import { DangerousHTML } from './dangerous';

interface ResolvedContent {
  contentType: string;
  content: string;
}

export const HTMLOutput = ({
  content,
  contentType,
  path,
}: {
  content: string;
  contentType: string;
  path?: string;
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedContent, setResolvedContent] = useState<ResolvedContent | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!path) return;
    setLoading(true);
    fetch(path).then((res) => {
      if (res.ok) {
        res.json().then((json) => {
          setResolvedContent(json);
        });
      } else {
        setError(`status: ${res.status} | ${res.statusText}`);
      }
      setLoading(false);
    });
  }, [path]);

  if (loading) return <div>Loading....</div>;
  if (!path)
    return (
      <div>
        <DangerousHTML content={content} />
      </div>
    );
  if (resolvedContent) {
    return (
      <div>
        <DangerousHTML content={resolvedContent.content} />
      </div>
    );
  }
  if (error) return <div>ERROR!!! {error}</div>;
  return <div>[MISSING HTML OUTPUT] {path}</div>;
};
