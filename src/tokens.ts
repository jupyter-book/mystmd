import { JsonObject, BaseLinks } from './types';
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

export function ensureValidTokenExpiresIn(expiry?: TokenExpiresIn): TokenExpiresIn {
  switch (expiry) {
    case TokenExpiresIn.never:
      return TokenExpiresIn.never;
    case TokenExpiresIn.nintyDays:
      return TokenExpiresIn.nintyDays;
    case TokenExpiresIn.sixtyDays:
      return TokenExpiresIn.sixtyDays;
    case TokenExpiresIn.thirtyDays:
      return TokenExpiresIn.thirtyDays;
    case TokenExpiresIn.sevenDays:
      return TokenExpiresIn.sevenDays;
    case TokenExpiresIn.oneDay:
    default:
      return TokenExpiresIn.oneDay;
  }
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
  date_expires: Date;
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
