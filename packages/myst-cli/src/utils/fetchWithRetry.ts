import type { RequestInfo, RequestInit, Response } from 'undici';
import type { ISession } from '../session/types.js';

/**
 * Recursively fetch a URL with retry and exponential backoff.
 */
export async function fetchWithRetry(
  session: Pick<ISession, 'log' | 'fetch'>,
  /** The URL to fetch. */
  url: URL | RequestInfo,
  /** Options to pass to fetch (e.g., headers, method). */
  options?: RequestInit,
  /** How many times total to attempt the fetch. */
  maxRetries = 3,
  /** The current attempt number. */
  attempt = 1,
  /** The current backoff duration in milliseconds. */
  backoff = 250,
): Promise<Response> {
  try {
    const resp = await session.fetch(url, options);
    if (resp.ok) {
      // If it's a 2xx response, we consider it a success and return it
      return resp;
    } else {
      // For non-2xx, we treat it as a failure that triggers a retry
      session.log.warn(
        `Fetch of ${url} failed with HTTP status ${resp.status} for URL: ${url} (Attempt #${attempt})`,
      );
    }
  } catch (error) {
    // This covers network failures and other errors that cause fetch to reject
    session.log.warn(`Fetch of ${url} threw an error (Attempt #${attempt})`, error);
  }

  // If we haven't reached the max retries, wait and recurse
  if (attempt < maxRetries) {
    session.log.debug(`Waiting ${backoff}ms before retry #${attempt + 1}...`);
    await new Promise((resolve) => setTimeout(resolve, backoff));
    return fetchWithRetry(session, url, options, maxRetries, attempt + 1, backoff * 2);
  }

  // If we made it here, all retries have been exhausted
  throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts.`);
}
