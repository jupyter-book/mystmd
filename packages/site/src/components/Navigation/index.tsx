import { useNavOpen } from '@curvenote/ui-providers';
import { TableOfContents } from './TableOfContents';

export function Navigation({
  children,
  projectSlug,
  urlbase,
}: {
  children?: React.ReactNode;
  urlbase?: string;
  projectSlug?: string;
}) {
  const [open, setOpen] = useNavOpen();
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={() => setOpen(false)}
        ></div>
      )}
      {children}
      <TableOfContents projectSlug={projectSlug} urlbase={urlbase} />
    </>
  );
}
