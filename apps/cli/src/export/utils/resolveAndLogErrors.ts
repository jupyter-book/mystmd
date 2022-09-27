import type { ISession } from '../../session/types';

/**
 * Resolve all promises
 *
 * Errors are caught so successful promises can resolve. Then errors are logged.
 */
export async function resolveAndLogErrors(session: ISession, promises: Promise<any>[]) {
  const errors = await Promise.all(promises.map((p) => p.catch((e) => e)));
  errors
    .filter((e) => e instanceof Error)
    .forEach((e) => {
      session.log.error(e);
    });
}
