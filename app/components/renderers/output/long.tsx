import { DangerousHTML } from './dangerous';
import { useFetchLongContent } from './hooks';

export const MaybeLongContent = ({
  content,
  path,
  render,
}: {
  content: string;
  path?: string;
  render: (content: string) => JSX.Element;
}) => {
  const { loading, error, longContent } = useFetchLongContent(path);

  if (loading) return <div>Loading....</div>;
  if (error) return <div>ERROR!!! {error}</div>;
  return <div>{render(longContent ? longContent.content : content)}</div>;
};
