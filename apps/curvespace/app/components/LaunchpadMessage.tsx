import { useEffect, useState } from 'react';
import { formatDistanceToNow, addDays } from 'date-fns';

export default function LaunchpadMessage() {
  const hostname = window.location.hostname;
  const [expiresIn, setExpiresIn] = useState('and will expire in - days.');
  const [show, setShow] = useState(true);

  const match = hostname.match(/^launchpad-(.*).curve.space$/);

  useEffect(() => {
    if (match == null) return;
    const [, id] = match;
    fetch(`https://api.curvenote.com/launchpad/${id}`).then((resp) => {
      if (resp.ok)
        resp.json().then((json) => {
          console.log('created', json.date_created);
          setExpiresIn(
            `and will expire in ${formatDistanceToNow(addDays(new Date(json.date_created), 5))}.`,
          );
        });
      else setExpiresIn('and is temporary.');
    });
  }, []);

  if (!show || match == null) return null;

  return (
    <div className="fixed border text-sm bg-white bottom-2 right-2 p-3 w-[385px] max-w-full z-20 space-y-2 shadow animate-fadein-fast">
      <p className="mb-1 text-lg font-semibold text-center">🚀 Try Curvenote 🚀</p>
      <p>
        This website was launched using{' '}
        <a
          href="https://try.curvenote.com"
          target="_blank"
          rel="noreferrer noopener"
          className="hover:underline text-blue-500"
        >
          try.curvenote.com
        </a>{' '}
        {expiresIn}
      </p>
      <div className="text-left space-y-1">
        <p className="font-bold">What&apos;s Next?</p>
        <ul className="list-inside indent-4">
          <li>
            <a
              href="https://docs.curvenote.com/web/launchpad#J7q8FCSPRp"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:underline text-blue-500"
            >
              Customize the site and make it permanent
            </a>
          </li>
          <li>
            <a
              href="https://try.curvenote.com"
              target="_blank"
              rel="noreferrer noopener"
              className="hover:underline text-blue-500"
            >
              Launch temporary website like this one
            </a>
          </li>
        </ul>
      </div>
      <div className="text-right py-2">
        <a
          className="border p-2 mr-2 rounded text-blue-500 hover:text-blue-600 hover:border-blue-500 cursor-pointer"
          onClick={() => setShow(false)}
        >
          Dismiss
        </a>
        <a
          className="border p-2 rounded text-white bg-blue-400 hover:bg-blue-500 hover:border-blue-400"
          href="https://docs.curvenote.com/web/launchpad#J7q8FCSPRp"
          target="_blank"
          rel="noreferrer noopener"
        >
          <span className="text-white">Learn More</span>
        </a>
      </div>
    </div>
  );
}
