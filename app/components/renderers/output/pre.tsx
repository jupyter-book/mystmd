import { useFetchLongContent } from './hooks';

export const PreOutput = ({ content, path }: { content: string; path?: string }) => {
  const { loading, error, longContent } = useFetchLongContent(path);

  if (loading) return <div>Loading....</div>;
  if (error) return <div>ERROR!!! {error}</div>;

  return (
    <div>
      <pre>{longContent ? longContent.content : content}</pre>
    </div>
  );
};
