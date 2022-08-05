import type { ISession } from '../../session/types';
import { createPdfGivenTexFile } from './create';

export async function buildPdfOnly(session: ISession, filename: string) {
  await createPdfGivenTexFile(session.log, filename, false);
}
