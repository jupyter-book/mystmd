import type { Migration } from './types.js';
import * as v1 from './v1_footnotes.js';
import * as v2 from './v2_blockClasses.js';

export const MIGRATIONS: Migration[] = [v1, v2];
