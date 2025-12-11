export function uniqueArray<T = any>(array: T[], transform?: (value: T) => T): T[] {
  if (transform) {
    const transformedArray = array.map(transform);
    return array.filter((v, i) => transformedArray.indexOf(transform(v)) === i);
  }
  return array.filter((v, i) => array.indexOf(v) === i);
}
