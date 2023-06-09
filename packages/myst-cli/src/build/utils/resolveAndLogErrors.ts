import type { ISession } from '../../session/types.js';

/**
 * Resolve all promises
 *
 * Errors are caught so successful promises can resolve. Then errors are logged.
 */
export async function resolveAndLogErrors(
  session: ISession,
  promises: Promise<any>[],
  throwOnFailure?: boolean,
) {
  let errors = await Promise.all(promises.map((p) => p.catch((e) => e)));
  errors = errors.filter((e) => e instanceof Error);
  errors.forEach((e) => {
    session.log.error(e);
  });
  if (throwOnFailure && errors.length > 0) throw errors[0];
}
