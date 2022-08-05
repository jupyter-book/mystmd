import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { XClientName } from '@curvenote/blocks';
import type { Logger } from '../logging';
import CLIENT_VERSION from '../version';
import type { Tokens } from './types';

function decodeAndValidateToken(
  log: Logger,
  token: string,
  throwErrors = true,
): { decoded: jwt.JwtPayload; expired: boolean | 'soon' } {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Could not decode session token. Please ensure that the API token is valid.');
  }
  const timeLeft = (decoded.exp as number) * 1000 - Date.now();
  if (!decoded.ignoreExpiration && timeLeft < 0) {
    if (throwErrors) throw new Error('The API token has expired.');
    return { decoded, expired: true };
  }
  if (!decoded.ignoreExpiration && timeLeft < 5 * 60 * 1000) {
    if (throwErrors) log.warn('The token has less than five minutes remaining');
    return { decoded, expired: 'soon' };
  }
  return { decoded, expired: false };
}

export function setSessionOrUserToken(
  log: Logger,
  token?: string,
): { tokens: Tokens; url?: string } {
  if (!token) return { tokens: {} };
  const { decoded } = decodeAndValidateToken(log, token);
  const { aud } = decoded;
  if (typeof aud !== 'string') throw new Error('Expected an audience on the token (string).');
  if (aud.endsWith('/login')) {
    return { tokens: { user: token }, url: aud.slice(0, -6) };
  }
  return { tokens: { session: token }, url: aud };
}

export async function getSessionToken(log: Logger, tokens: Tokens): Promise<string | undefined> {
  if (!tokens.user) {
    if (!tokens.session) return undefined;
    decodeAndValidateToken(log, tokens.session, false);
    return tokens.session;
  }
  // There is a user token.
  if (tokens.session) {
    const { expired } = decodeAndValidateToken(log, tokens.session, false);
    if (!expired) return tokens.session;
  }
  // The session token hasn't been created, has expired or will 'soon'.
  log.debug('SessionToken: Generating a fresh session token.');
  const { decoded } = decodeAndValidateToken(log, tokens.user);
  const response = await fetch(decoded.aud as string, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.user}`,
    },
  });
  if (!response.ok) throw new Error('SessionToken: The user token is not valid.');
  const json = await response.json();
  if (!json.session)
    throw new Error(
      "SessionToken: There was an error in the response, expected a 'session' in the JSON object.",
    );
  return json.session;
}

export async function getHeaders(log: Logger, tokens: Tokens): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'X-Client-Name': XClientName.javascript,
    'X-Client-Version': CLIENT_VERSION,
  };
  const session = await getSessionToken(log, tokens);
  if (session) {
    tokens.session = session;
    headers.Authorization = `Bearer ${session}`;
  }
  return headers;
}
