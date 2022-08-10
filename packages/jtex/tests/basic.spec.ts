import JTex, { Session } from '../src';

const basicDoc = `\\documentclass{article}
\\begin{document}
\\section{Famous People}
%% Print a list of famous people defined in the context dictionary
\\begin{itemize}
[# for person in famous_people #]
\\item [-person.name-], [-person.job-] [# if person.email #]([-person.email-])[# endif #]

[# endfor #]
\\end{itemize}
tags: [-tags|join(', ')-]
\\end{document}`;

describe('JTEX', () => {
  it('Basic rendering', async () => {
    const rendered = new JTex(new Session(), '.').freeform(basicDoc, {
      famous_people: [
        { name: 'Rowan', job: 'CEO', email: 'rowan@curvenote.com' },
        { name: 'Steve', job: 'CTO' },
      ],
      tags: ['tag1', 'tag2'],
    });
    expect(rendered.includes('Rowan')).toBe(true);
    expect(rendered.includes('curvenote.com')).toBe(true);
    expect(rendered.includes('Steve')).toBe(true);
    expect(rendered.includes('CEO')).toBe(true);
    expect(rendered.includes('CTO')).toBe(true);
    expect(rendered.includes('tag1')).toBe(true);
    expect(rendered.includes('tag2')).toBe(true);
  });
});
