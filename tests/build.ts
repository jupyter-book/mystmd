import fs from 'fs';

export function getFixtures(name: string) {
  const fixtures = fs.readFileSync(`fixtures/${name}.md`).toString();
  return fixtures.split('\n.\n\n').map((s) => s.split('\n.\n'));
}
