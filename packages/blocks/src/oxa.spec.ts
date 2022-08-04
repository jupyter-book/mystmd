import { oxaLinkToId, oxaLink } from './oxa';

describe('Oxa Link', () => {
  test.each([
    ['', null, null],
    ['https://curvenote.com/', null, null],
    // An oxa: in the wrong place should be fine!
    ['https://curvenote.com/@cu/oxa:rve/note', null, null],
    ['https://curvenote.com/@cu/release-n!otes/note', null, null],
    ['https://curvenote.com/@cu/rve/202!1-2', null, null],
    ['https://curvenote.com/@cu/rve/!note', { project: '@cu:rve', block: 'note' }, null],
    ['https://curvenote.com/@cu/rve/note', { project: '@cu:rve', block: '@note' }, null],
    ['https://curvenote.com/@cu/rve/note/edit', { project: '@cu:rve', block: '@note' }, null],
    ['https://curvenote.com/@cu/rve/note/edit/again', null, null],
    ['https://curvenote.com/@cu/rve/note/edit/again/and/again', null, null],
    [
      'https://curvenote.com/@cu/rve/note.2',
      { project: '@cu:rve', block: '@note', version: 2 },
      null,
    ],
    ['https://curvenote.com/@cu/rve/note.-1', null, null],
    ['https://curvenote.com/@cu/rve/note.0', null, null],
    [
      'https://curvenote.com/@cu/rve/note.3000',
      { project: '@cu:rve', block: '@note', version: 3000 },
      null,
    ],
    [
      'https://curvenote.com/@cu/rve/note.3000/edit',
      { project: '@cu:rve', block: '@note', version: 3000 },
      null,
    ],
    [
      'https://localhost:3000/@cu/rve/note.3000/edit',
      { project: '@cu:rve', block: '@note', version: 3000 },
      null,
    ],
    // Treat the oxa link as a URL type if the first is a project name
    ['oxa:@cu:rve/note.3000', { project: '@cu:rve', block: '@note', version: 3000 }, null],
    // If you are doing that you MUST include a team AND project name
    ['oxa:@cu/note.3000', null, null],
    // If you don't include the @ sign, then it will also fail
    ['oxa:curvenote:rve/note.3000', null, null],
    // You can address by block ID with a !
    ['oxa:@cu:rve/!note.3000', { project: '@cu:rve', block: 'note', version: 3000 }, null],
    // If it slips through that is fine, and will be cleaned up
    ['oxa:curvenote/!note.3000', { project: 'curvenote', block: 'note', version: 3000 }, null],
    // And this will be treated as an id
    ['oxa:curvenote/note.3000', { project: 'curvenote', block: 'note', version: 3000 }, null],
    ['oxa:curvenote/note', { project: 'curvenote', block: 'note' }, null],
    ['oxa:project/block', { project: 'project', block: 'block' }, null],
    ['oxa:project/block.version', null, null],
    ['oxa:project/block.2', { project: 'project', block: 'block', version: 2 }, null],
    ['oxa:project/block.-1', null, null],
    // Test the same as the above with block
    ['block:curvenote/note/3000', { project: 'curvenote', block: 'note', version: 3000 }, null],
    ['block:curvenote/note', { project: 'curvenote', block: 'note' }, null],
    ['block:project/block', { project: 'project', block: 'block' }, null],
    ['block:project/block.version', null, null],
    ['block:project/block/2', { project: 'project', block: 'block', version: 2 }, null],
    ['block:project/block.-1', null, null],
    [
      'block:l7ZKutTbJ4FeBUfuChA4/sJDUi1TVElYvvhwg3B02/5',
      { project: 'l7ZKutTbJ4FeBUfuChA4', block: 'sJDUi1TVElYvvhwg3B02', version: 5 },
      null,
    ],
    // But the block as a url does NOT work
    ['https://localhost:3000/block:@cu:rve/note.3000', null, null],
    // oxa: is more important than the http
    ['https://localhost:3000/oxa:@cu/rve/note.3000/edit', null, null],
    ['https://localhost:3000/oxa:@cu/rve/note.3000', null, null],
    // If you are using an oxa link, you MUST have the colon sep for the team/name
    [
      'https://localhost:3000/oxa:@cu:rve/note.3000',
      { project: '@cu:rve', block: '@note', version: 3000 },
      null,
    ],
    // URI encoding also works
    [
      'https://localhost:3000/oxa%3A%40cu%3Arve%2Fnote.3000',
      { project: '@cu:rve', block: '@note', version: 3000 },
      null,
    ],
    // Just for a real one:
    [
      'http://localhost:3000/oxa:l7ZKutTbJ4FeBUfuChA4/ByM4jkfPUwtGucXGrtDN.1',
      { project: 'l7ZKutTbJ4FeBUfuChA4', block: 'ByM4jkfPUwtGucXGrtDN', version: 1 },
      null,
    ],
    // Now try to build up multi blocks
    [
      'https://localhost:3000/oxa:project1/block1.2',
      { project: 'project1', block: 'block1', version: 2 },
      null,
    ],
    // TEST CONTEXT
    [
      'oxa:project1/block1:project2/block2',
      { project: 'project2', block: 'block2' },
      { project: 'project1', block: 'block1' },
    ],
    ['oxa:project1/block1:/block2', null, null],
    [
      'oxa:project1/block1:block2',
      { project: 'project1', block: 'block2' },
      { project: 'project1', block: 'block1' },
    ],
    [
      'oxa:project1/block1:block2.4',
      { project: 'project1', block: 'block2', version: 4 },
      { project: 'project1', block: 'block1' },
    ],
    [
      'oxa:project1/block1.56:block2.4',
      { project: 'project1', block: 'block2', version: 4 },
      { project: 'project1', block: 'block1', version: 56 },
    ],
    [
      'https://localhost:3000/oxa:project1/block1.2:project2/block2.1',
      { project: 'project2', block: 'block2', version: 1 },
      { project: 'project1', block: 'block1', version: 2 },
    ],
    [
      'https://localhost:3000/oxa:project1/block1.2:@p2:n1/block2.1',
      { project: '@p2:n1', block: '@block2', version: 1 },
      { project: 'project1', block: 'block1', version: 2 },
    ],
    [
      'https://localhost:3000/oxa:project1/block1.2:@p2:n1/!block2.1',
      { project: '@p2:n1', block: 'block2', version: 1 },
      { project: 'project1', block: 'block1', version: 2 },
    ],
  ])('from oxa link to id: %s', async (link, testBlock, testContext) => {
    const oxa = oxaLinkToId(link);
    expect(oxa?.block ?? null).toEqual(testBlock);
    expect(oxa?.context ?? null).toEqual(testContext);
  });

  test.each([
    ['oxa:project1/block2', null],
    ['oxa:project1/block2#', null],
    ['oxa:project1/block2#id', 'id'],
    ['oxa:project1/block2.2#', null],
    ['oxa:project1/block2.2#id', 'id'],
    ['oxa:project1/block1:block2', null],
    ['oxa:project1/block1:block2#', null],
    ['oxa:project1/block1:block2#id', 'id'],
    ['oxa:project1/block1:block2.2#id', 'id'],
    ['oxa:project1/block1.1:project2/block2.2#id', 'id'],
  ])('from oxa link with a scoped ID: %s', async (link, id) => {
    const oxa = oxaLinkToId(link);
    expect(oxa?.id ?? null).toEqual(id);
  });

  test.each([
    ['', null, null, true, ''],
    ['oxa:p1/b1', { project: 'p1', block: 'b1' }, null, true, undefined],
    ['oxa:p1/b1', { project: 'p1', block: 'b1', version: 1 }, null, false, undefined],
    ['oxa:p1/b1#id', { project: 'p1', block: 'b1' }, null, true, 'id'],
    ['oxa:p1/b1.1', { project: 'p1', block: 'b1', version: 1 }, null, true, undefined],
    ['oxa:p1/b1.1', { project: 'p1', block: 'b1', version: 1 }, null, undefined, undefined],
    ['oxa:p1/b1.1#id', { project: 'p1', block: 'b1', version: 1 }, null, undefined, 'id'],
    [
      'oxa:p1/b1.1:p2/b2.2',
      { project: 'p2', block: 'b2', version: 2 },
      { project: 'p1', block: 'b1', version: 1 },
      undefined,
      undefined,
    ],
    [
      'oxa:p1/b1.1:p2/b2.2#id',
      { project: 'p2', block: 'b2', version: 2 },
      { project: 'p1', block: 'b1', version: 1 },
      undefined,
      'id',
    ],
    [
      'oxa:p1/b1.1:b2.2',
      { project: 'p1', block: 'b2', version: 2 },
      { project: 'p1', block: 'b1', version: 1 },
      undefined,
      undefined,
    ],
    [
      'oxa:p1/b1.1:b2.2#id',
      { project: 'p1', block: 'b2', version: 2 },
      { project: 'p1', block: 'b1', version: 1 },
      undefined,
      'id',
    ],
    [
      'oxa:p1/b1:b2',
      { project: 'p1', block: 'b2', version: 2 },
      { project: 'p1', block: 'b1', version: 1 },
      false,
      undefined,
    ],
    [
      'oxa:p1/b1:b2#id',
      { project: 'p1', block: 'b2', version: 2 },
      { project: 'p1', block: 'b1', version: 1 },
      false,
      'id',
    ],
  ])('from id to oxa link: %s', async (link, block, context, pinned, id) => {
    const oxa = oxaLink('', block, { context, pinned, id });
    expect(oxa).toEqual(link || null);
  });
});
