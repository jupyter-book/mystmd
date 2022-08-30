import { MyST, State, transform, unified } from 'mystjs';
import mystToTex from '../src';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const everything =
  'Some *markdown* $Ax=b$\n\nok\n\n# Heading\n\n```\npython\n```\n\n* hello `code`\n* hi\n\n> ok\n\n---\n\n2. ok\n\n% comment\n\n$$math$$\n\n| header 1 | header 2 |\n|:---|---:|\n| $$3$$ | ok |\n\nH{sub}`2`O\n\n```{note}\nok\n```\n\n```{figure} image.png\n:name: hi\nSome caption\n```\n\nIn {numref}`Fig. %s <hi>`';

describe('myst-to-tex', () => {
  it('emphasis in paragraph', () => {
    const myst = new MyST();
    const content = 'Some % *markdown*';

    const state = new State();
    const tree = myst.parse(content);
    const pipe = unified().use(transform, state, {}).use(mystToTex);
    const result = pipe.runSync(tree as any);
    const tex = pipe.stringify(result);

    expect(tex.result).toEqual('Some \\% \\textit{markdown}');
  });
});
