import { describe, expect, it } from 'vitest';
import { Session } from '../session/session';
import { config } from '../store/reducers';
import { parseMyst } from './myst';

function sessionWithProject(settings?: Record<string, any>) {
  const session = new Session();
  session.store.dispatch(config.actions.receiveCurrentProjectPath({ path: '.' }));
  session.store.dispatch(config.actions.receiveProjectConfig({ path: '.', settings }));
  return session;
}

function parseText(session: Session) {
  const tree = parseMyst(session, 'A ~~struck~~ word', 'index.md');
  return JSON.stringify(tree);
}

describe('parseMyst strikethrough setting', () => {
  it('leaves tildes as text by default', () => {
    expect(parseText(sessionWithProject())).not.toContain('"delete"');
  });
  it('leaves tildes as text when disabled', () => {
    const session = sessionWithProject({ parser: { strikethrough: false } });
    expect(parseText(session)).not.toContain('"delete"');
  });
  it('parses tildes as delete nodes when enabled', () => {
    const session = sessionWithProject({ parser: { strikethrough: true } });
    expect(parseText(session)).toContain('"delete"');
  });
});
