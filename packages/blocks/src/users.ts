import type { JsonObject, BaseLinks } from './types';
import { getDate } from './helpers';

export enum UserKINDS {
  User = 'User',
  Team = 'Team',
}

/**
 * 1. user starts on community
 * 2. can create a team => Team in a Trial, trial date end on dbo, expose on teams dto
 * 3. user can upgrade the team to Full, or tiral expires and read only
 * 4. user can updgrade to Pro (capacity)
 */

// using meaningful enum keys, but plain enum values
export enum PLANS {
  None = 'none',
  Community = 'Community',
  Pro = 'Pro',
  Trial = 'Trial',
  Teams = 'Teams',
}

export enum PaymentFrequency {
  Monthly = 'Monthly',
  Annually = 'Annually',
}

export enum BillingEvent {
  ProTrialStarted = 'pro.trial.started',
  InvoicePaid = 'invoice.paid',
  InvoicePaymentFailed = 'invoice.payment_failed',
  SubscriptionCancelled = 'customer.subscription.deleted',
}

export interface UserLinks extends BaseLinks {
  photo: string;
  banner?: string;
}

export interface MyUserLinks extends UserLinks {
  projects: string;
  access: string;
}

export interface PartialUser {
  username: string;
  display_name: string;
  bio: string;
  location: string;
  website: string;
  affiliation: string;
  orcid: string;
  twitter: string;
  github: string;
}

export interface User extends PartialUser {
  id: string;
  date_created: Date;
  links: UserLinks;
}

export type SearchUser = Pick<User, 'id' | 'display_name' | 'username'> & {
  links: { photo: string };
};

export interface MyUser extends User {
  email: string;
  email_verified: boolean;
  links: MyUserLinks;
}

export interface AccountInfo {
  is_stripe_customer: boolean;
  plan: PLANS;
  start_date: string | null;
  expiry_date: string | null;
  mb_hmac?: string | null;
}

export function myUserFromDTO(id: string, json: JsonObject): MyUser {
  return {
    id,
    username: json.username ?? '',
    display_name: json.display_name ?? '',
    bio: json.bio ?? '',
    location: json.location ?? '',
    website: json.website ?? '',
    affiliation: json.affiliation ?? '',
    orcid: json.orcid ?? '',
    twitter: json.twitter ?? '',
    github: json.github ?? '',
    email: json.email ?? '',
    email_verified: json.email_verified ?? false,
    date_created: getDate(json.date_created),
    links: { ...json.links },
  };
}

export function userFromDTO(id: string, json: JsonObject): User {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email, email_verified, ...data } = myUserFromDTO(id, json);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { projects, access, ...links } = data.links;
  const user = data as User;
  user.links = links;
  return user;
}
