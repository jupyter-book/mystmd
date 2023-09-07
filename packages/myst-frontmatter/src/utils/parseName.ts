import type { Name } from '../index.js';

/**
 * Check if the first letter in a word is uppercase
 *
 * Non-letters are bypassed; if the entire word is non-letters it is considered uppercase
 */
export function startsWithUpperCase(word: string) {
  for (const letter of word) {
    // Non-letters are unchanged by lower/upper case
    if (letter.toLowerCase() === letter.toUpperCase()) continue;
    return letter === letter.toUpperCase();
  }
  return true;
}

/**
 * Parse string display name to family, given, particle, and suffix parts
 *
 * This function attempts to follow bibtex rules described here:
 * http://maverick.inria.fr/~Xavier.Decoret/resources/xdkbibtex/bibtex_summary.html#names
 * However, unlike the description in the site above, for input, we only expect simple
 * unicode string names, no latex.
 */
export function parseName(display: string): Name {
  const parsed: Name = { display };
  const displayParts = display.split(',');
  // Handle "Given particle Family"
  if (displayParts.length === 1) {
    return { ...parsed, ...parseGivenParticleFamily(display) };
  }
  // Handle "particle Family, Given"
  const given = displayParts.pop()?.trim();
  if (given) parsed.given = given;
  if (displayParts.length === 1) {
    return { ...parsed, ...parseParticleFamily(displayParts[0]) };
  }
  // Handle "particle Family, Suffix, Given"
  const suffix = displayParts.pop()?.trim();
  const particleAndFamily = parseParticleFamily(displayParts.join(','));
  if (!suffix) return { ...parsed, ...particleAndFamily };
  return { ...parsed, ...particleAndFamily, suffix };
}

/**
 * Parse string as "particle Family"
 */
function parseParticleFamily(name: string): Name {
  const nameParts = name.trim().split(/\s+/);
  if (!nameParts.length) return {};
  let family = nameParts.pop();
  if (!family) return {};
  if (!nameParts.length) return { family };
  if (startsWithUpperCase(nameParts[0])) {
    return { family: [...nameParts, family].join(' ') };
  }
  while (nameParts.length && startsWithUpperCase(nameParts[nameParts.length - 1])) {
    family = `${nameParts.pop()} ${family}`;
  }
  if (!nameParts.length) return { family };
  return { particle: nameParts.join(' '), family };
}

/**
 * Parse string as "Given particle Family"
 */
function parseGivenParticleFamily(name: string): Name {
  const nameParts = name.trim().split(/\s+/);
  if (!nameParts.length) return {};
  let family = nameParts.pop();
  if (!family) return {};
  if (!nameParts.length) return { family };
  let given = nameParts.shift();
  if (!nameParts.length) return { given, family };
  while (nameParts.length && startsWithUpperCase(nameParts[0])) {
    given = `${given} ${nameParts.shift()}`;
  }
  while (nameParts.length && startsWithUpperCase(nameParts[nameParts.length - 1])) {
    family = `${nameParts.pop()} ${family}`;
  }
  if (!nameParts.length) return { given, family };
  return { given, particle: nameParts.join(' '), family };
}

/**
 * Render parsed name to a string
 *
 * If parsed name has display value, this is simply returned.
 * Otherwise, it is rendered as "particle Family, Suffix, Given"
 */
export function renderName(name: Name): string {
  const { display, given, particle, family, suffix } = name;
  if (display) return display;
  let output = ',';
  const unexpectedCommas = `${given}${particle}${family}${suffix}`.includes(',');
  if (suffix || unexpectedCommas) output = `${output} ${suffix ?? ''},`;
  if (given || unexpectedCommas) output = `${output} ${given ?? ''}`;
  if (family || unexpectedCommas) output = `${family ?? ''}${output}`;
  if (particle || unexpectedCommas) output = `${particle ?? ''} ${output}`;
  if (output === ',') return '';
  return output;
}
