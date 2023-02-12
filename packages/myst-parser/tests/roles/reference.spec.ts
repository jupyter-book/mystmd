import { mystParse } from '../../src';
import { position } from '../position';

describe('reference role default', () => {
  it('ref role parses', async () => {
    const content = '{ref}`my-ref`';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'ref',
              value: 'my-ref',
              children: [
                {
                  type: 'crossReference',
                  kind: 'ref',
                  label: 'my-ref',
                  identifier: 'my-ref',
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
  it('numref role parses', async () => {
    const content = '{numref}`My Ref %s <my-ref>`';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'numref',
              value: 'My Ref %s <my-ref>',
              children: [
                {
                  type: 'crossReference',
                  kind: 'numref',
                  label: 'my-ref',
                  identifier: 'my-ref',
                  children: [
                    {
                      type: 'text',
                      value: 'My Ref %s',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
  it('eq role parses', async () => {
    const content = '{eq}`my-eq`';
    const expected = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          position,
          children: [
            {
              type: 'mystRole',
              position,
              name: 'eq',
              value: 'my-eq',
              children: [
                {
                  type: 'crossReference',
                  kind: 'eq',
                  label: 'my-eq',
                  identifier: 'my-eq',
                },
              ],
            },
          ],
        },
      ],
    };
    expect(mystParse(content)).toEqual(expected);
  });
});
