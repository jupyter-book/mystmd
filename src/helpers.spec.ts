import moment from 'moment';
import { formatDate, tokeniseContent, ensureString } from './helpers';

describe('Helpers', () => {
  test.each([
    ['string', 'hello world', 'hello world'],
    ['string', ['hello ', 'world'], 'hello world'],
  ])('%s', (s, maybeString: string[] | string, expected: string) => {
    expect(ensureString(maybeString)).toEqual(expected);
  });

  it('formatDate returns an ISO string', () => {
    expect(formatDate(moment.utc('2020-06-01 10:10:30').toDate())).toEqual(
      expect.stringMatching('2020-06-01T10:10:30.000Z'),
    );
  });
  describe('tokeniseContent', () => {
    it('with a trailing newline', () => {
      expect(tokeniseContent('Hello\nWorld\n')).toEqual(['Hello\n', 'World\n']);
      expect(tokeniseContent('Hello\n\nWorld\n')).toEqual(['Hello\n', '\n', 'World\n']);
      expect(tokeniseContent('Hello\n\nWorld\n\n')).toEqual(['Hello\n', '\n', 'World\n', '\n']);
      expect(tokeniseContent('Single line\n')).toEqual(['Single line\n']);
    });
    it('without a trailing newline', () => {
      expect(tokeniseContent('Hello\n\nWorld')).toEqual(['Hello\n', '\n', 'World']);
      expect(tokeniseContent('Single line of raw text')).toEqual(['Single line of raw text']);
    });
  });
});
