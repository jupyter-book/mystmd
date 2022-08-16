import type { JsonObject, BaseLinks } from './types';
import { getDate } from './helpers';

export interface TokenLinks extends BaseLinks {
  user: string;
}

export enum TokenExpiresIn {
  // TODO: custom
  never = 'never',
  nintyDays = 90,
  sixtyDays = 60,
  thirtyDays = 30,
  sevenDays = 7,
  oneDay = 1,
}

export function ensureValidTokenExpiresIn(expiry?: TokenExpiresIn | string): TokenExpiresIn {
  switch (expiry) {
    case TokenExpiresIn.never:
      return TokenExpiresIn.never;
    case '90':
    case TokenExpiresIn.nintyDays:
      return TokenExpiresIn.nintyDays;
    case '60':
    case TokenExpiresIn.sixtyDays:
      return TokenExpiresIn.sixtyDays;
    case '30':
    case TokenExpiresIn.thirtyDays:
      return TokenExpiresIn.thirtyDays;
    case '7':
    case TokenExpiresIn.sevenDays:
      return TokenExpiresIn.sevenDays;
    case '1':
    case TokenExpiresIn.oneDay:
    default:
      return TokenExpiresIn.oneDay;
  }
}

export function tokenExpiryToSeconds(expiry: TokenExpiresIn): number | null {
  switch (expiry) {
    case TokenExpiresIn.oneDay:
    case TokenExpiresIn.sevenDays:
    case TokenExpiresIn.thirtyDays:
    case TokenExpiresIn.sixtyDays:
    case TokenExpiresIn.nintyDays:
      return expiry * 24 * 3600;
    case TokenExpiresIn.never:
      return null;
    default:
      throw new Error('Undefined expiry');
  }
}

export function tokenExpiryToDate(expiry: TokenExpiresIn): Date | null {
  const seconds = tokenExpiryToSeconds(expiry);
  if (seconds == null) return null;
  return new Date(Date.now() + seconds * 1000);
}

export interface PartialToken {
  description: string;
}

export interface Token extends PartialToken {
  id: string;
  user: string;
  has_been_used: boolean;
  date_created: Date;
  date_last_used: Date | null;
  date_expires: Date | null;
  links: TokenLinks;
  token?: string; // This is only included in a POST response.
}

export function tokenFromDTO(id: string, json: JsonObject): Token {
  return {
    id,
    user: json.user,
    description: json.description || '',
    has_been_used: json.has_been_used ?? false,
    date_created: getDate(json.date_created),
    date_last_used: json.date_last_used ? getDate(json.date_last_used) : null,
    date_expires: getDate(json.date_expires),
    links: { ...json.links },
    token: json.token ? json.token : undefined,
  };
}
