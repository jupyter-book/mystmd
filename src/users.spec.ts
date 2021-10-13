import { User, Session, Team } from '.';

describe('Models', () => {
  it('unauthenticated requests work for users', async () => {
    const session = new Session();
    const user = await new User(session, '@rowanc1').get();
    expect(user.data.username).toBe('rowanc1');
  });
  it('unauthenticated requests work for teams', async () => {
    const session = new Session();
    const user = await new Team(session, '@curvenote').get();
    expect(user.data.username).toBe('curvenote');
  });
});
