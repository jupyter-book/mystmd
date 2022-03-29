import { useNavOpen } from '../UiStateProvider';
import { LeftNav } from './LeftNav';
import { TopNav } from './TopNav';

export function Navigation() {
  const [open, setOpen] = useNavOpen();
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={() => setOpen(false)}
        ></div>
      )}
      <TopNav />
      <LeftNav />
    </>
  );
}
