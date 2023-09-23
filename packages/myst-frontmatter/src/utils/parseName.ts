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
 * Parse string literal name to family, dropping-particle, non-dropping-particle, given, and suffix parts
 *
 * This function attempts to follow bibtex rules described here:
 * http://maverick.inria.fr/~Xavier.Decoret/resources/xdkbibtex/bibtex_summary.html#names
 * However, unlike the description in the site above, for input, we only expect simple
 * unicode string names, no latex.
 *
 * We also take some inspiration from https://github.com/citation-js/name
 * particularly around non-dropping vs. dropping particles.
 * However, that library is very under-tested, and some of the behavior around parsing commas
 * and formatting particles feels wrong.
 */
export function parseName(literal: string): Name {
  const displayParts = literal.split(',');
  // Handle "Given particle Family"
  if (displayParts.length === 1) {
    return { literal, ...parseGivenParticleFamily(literal) };
  }
  // Handle "non-dropping-particle Family, Given dropping-particle"
  const lastPart = displayParts.pop()?.trim();
  const givenAndParticle = parseGivenParticle(lastPart);
  if (displayParts.length === 1) {
    return { literal, ...givenAndParticle, ...parseParticleFamily(displayParts[0]) };
  }
  // Handle "non-dropping-particle Family, Suffix, Given dropping-particle"
  const suffix = displayParts.pop()?.trim();
  const particleAndFamily = parseParticleFamily(displayParts.join(','));
  if (!suffix) return { literal, ...givenAndParticle, ...particleAndFamily };
  return { literal, ...givenAndParticle, ...particleAndFamily, suffix };
}

/**
 * Parse string as "Given dropping-particle"
 */
function parseGivenParticle(name?: string): Name {
  const nameParts = name?.trim().split(/\s+/);
  if (!nameParts?.length) return {};
  let given = nameParts.shift();
  if (!given) return {};
  while (nameParts.length && startsWithUpperCase(nameParts[0])) {
    given = `${given} ${nameParts.shift()}`;
  }
  if (!nameParts.length) return { given };
  return { given, dropping_particle: nameParts.join(' ') };
}

/**
 * Parse string as "non-dropping-particle Family"
 */
function parseParticleFamily(name: string): Name {
  const nameParts = name.trim().split(/\s+/);
  if (!nameParts.length) return {};
  let family = nameParts.pop();
  if (!family) return {};
  if (nameParts.length && startsWithUpperCase(nameParts[0])) {
    return { family: [...nameParts, family].join(' ') };
  }
  while (nameParts.length && startsWithUpperCase(nameParts[nameParts.length - 1])) {
    family = `${nameParts.pop()} ${family}`;
  }
  if (!nameParts.length) return { family };
  return { non_dropping_particle: nameParts.join(' '), family };
}

/**
 * Parse string as "Given non-dropping-particle Family"
 */
function parseGivenParticleFamily(name: string): Name {
  const nameParts = name.trim().split(/\s+/);
  if (!nameParts.length) return {};
  let family = nameParts.pop();
  if (!family) return {};
  if (!nameParts.length) return { family };
  let given = nameParts.shift();
  while (nameParts.length && startsWithUpperCase(nameParts[0])) {
    given = `${given} ${nameParts.shift()}`;
  }
  while (nameParts.length && startsWithUpperCase(nameParts[nameParts.length - 1])) {
    family = `${nameParts.pop()} ${family}`;
  }
  if (!nameParts.length) return { given, family };
  return { given, non_dropping_particle: nameParts.join(' '), family };
}

/**
 * Render parsed name to a string
 *
 * If parsed name has literal value, this value is always returned.
 *
 * If alwaysReverse is not set to true, we try to format the name as "Given non-dropping-particle Family"
 * However, it must roundtrip successfully and parse to equal the input.
 *
 * Otherwise, it is rendered as "non-dropping-particle Family, Suffix, Given dropping-particle"
 */
export function formatName(name: Name, alwaysReversed = false): string {
  const { literal, given, dropping_particle, non_dropping_particle, family, suffix } = name;
  // Always return literal if we can.
  if (literal) return literal;
  // Check if there are any unexpected commas in the name parts; if so, we must format as reversed.
  const hasCommas = [given, dropping_particle, non_dropping_particle, family, suffix]
    .join('')
    .includes(',');
  // We can try to format the string "normally" given these checks:
  if (!alwaysReversed && !hasCommas && !dropping_particle && !suffix) {
    const formattedName = [given, non_dropping_particle, family].filter(Boolean).join(' ');
    const reParsedName = parseName(formattedName);
    delete reParsedName.literal;
    const serializedParsedName = JSON.stringify(Object.entries(reParsedName).sort());
    const serializedSourceName = JSON.stringify(Object.entries(name).sort());
    if (serializedParsedName === serializedSourceName) {
      return formattedName;
    }
  }
  // Otherwise, format the string "reversed"
  let output = ',';
  if (suffix || hasCommas) output = `${output}${suffix ? ' ' : ''}${suffix ?? ''},`;
  if (given) output = `${output} ${given}`;
  if (family) output = `${family}${output}`;
  if (dropping_particle) output = `${output} ${dropping_particle}`;
  if (non_dropping_particle) output = `${non_dropping_particle} ${output}`;
  if (output === ',') return '';
  return output;
}
