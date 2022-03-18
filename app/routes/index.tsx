// import { Card } from '~/components/card';

import { LoaderFunction, redirect } from 'remix';
import { getSection } from '../utils';

export const loader: LoaderFunction = async (): Promise<Response | null> => {
  const sec = getSection(0);
  if (!sec) throw new Response('Article was not found', { status: 404 });
  return redirect(`/${sec.folder}`);
};

// export default function Index() {
//   return (
//     <main className="mt-[80px] max-w-5xl mx-auto p-3 break-words">
//       <div className="flex flex-wrap">
//         <Card
//           folder="interactive"
//           slug="test"
//           title="Explorable Explanations"
//           tags={['Interactive']}
//         >
//           An explorable explanation (often shortened to explorable) is a form of
//           informative media where an interactive computer simulation of a given concept
//           is presented, along with some form of guidance (usually prose) that suggests
//           ways that the audience can learn from the simulation.
//         </Card>
//       </div>
//     </main>
//   );
// }
