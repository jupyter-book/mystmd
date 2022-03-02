import { Card } from '~/components/card';

export default function Index() {
  return (
    <main className="mt-[80px] max-w-5xl mx-auto p-3 break-words">
      <div className="flex flex-wrap">
        <Card
          folder="interactive"
          slug="test"
          title="Explorable Explanations"
          tags={['Interactive']}
        >
          An explorable explanation (often shortened to explorable) is a form of
          informative media where an interactive computer simulation of a given concept
          is presented, along with some form of guidance (usually prose) that suggests
          ways that the audience can learn from the simulation.
        </Card>
      </div>
    </main>
  );
}
