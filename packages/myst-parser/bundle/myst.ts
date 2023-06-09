import { mystParse, mystParser } from '../src/myst.js';

(globalThis as any).mystParse = mystParse;
(globalThis as any).mystParser = mystParser;
