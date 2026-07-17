/**
 * Compute the indentation of a YAML line
 *
 * @param line
 */
export function yamlLineIndent(line: string): number | undefined {
  const prefix = line.match(/^\s*[^\s#]/)?.[0];
  return prefix ? prefix.length - 1 : undefined;
}

/**
 * Test if line matches YAML section declaration
 *
 * @param name - section name
 * @param line
 *
 **/
function matchesYAMLSection(name: string, line: string): boolean {
  // NB the name is not escaped!
  return !!line.match(new RegExp(`^\\s*${name}:\\s*(#.*)?$`));
}

/**
 * Find the start of a YAML section body with a given key.
 *
 * @param name - section name
 * @param indent - indent of parent section
 * @param lines - lines to parse
 * @param index - index of starting line
 *
 * e.g. for the following YAML:
 *   saturn:
 *     best-moons:
 *       - titan
 *       - dione
 *   jupiter:
 *     best-moons:
 *       - io
 *       - europa
 * This function can be used to find the lines bounding the `jupiter`- section, i.e.
 *     best-moons:
 *       - io
 *       - europa
 */
export function findYAMLSection(
  name: string,
  indent: number,
  lines: string[],
  index: number = 0,
): { start: number; stop: number; indent: number | undefined } | undefined {
  let i = index;

  // Find a section with the form
  //   key:
  //     ...
  // Leave `i` at the smallest of:
  //   - the first parent-level indented key (i.e. lesser-indented key)
  //   - the first line after an indented key matching <name>
  //   - `lines.length`
  let foundMatch;
  for (; i < lines.length; i++) {
    const thisIndent = yamlLineIndent(lines[i]);
    if (thisIndent === undefined) {
      continue;
    }

    // Has our indentation finished?
    if (thisIndent < indent) {
      break;
    }
    // If we are too indented, skip
    else if (thisIndent > indent) {
      continue;
    }
    const isMatch = matchesYAMLSection(name, lines[i]);
    if (isMatch) {
      foundMatch = true;
      i++;
      break;
    }
  }
  if (!foundMatch) {
    return undefined;
  }

  // Set start of body
  const start = i;

  // Find section body indent
  let childIndent;
  for (; i < lines.length; i++) {
    childIndent = yamlLineIndent(lines[i]);
    if (childIndent !== undefined) {
      break; // Breaking here stops `i` increment
    }
  }
  // Did we find a child at the same or lower depth to the section title?
  if (childIndent !== undefined) {
    //assert (indent !== undefined)
    if (childIndent <= indent) {
      childIndent = undefined;
    }
  }

  // Otherwise, we have no children!
  if (childIndent === undefined) {
    return { start, stop: start, indent: undefined };
  }

  // Find section stop
  // By having a defined `childIdent`, we know that `i` is valid (== start):
  for (; i < lines.length; i++) {
    const thisIndent = yamlLineIndent(lines[i]);
    if (thisIndent !== undefined && thisIndent < childIndent) {
      break;
    }
  }
  const stop = i;

  return { start, stop, indent: childIndent };
}
