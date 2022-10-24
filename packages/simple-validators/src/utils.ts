export function getDate(object: undefined | Date | string | { toDate: () => Date }): Date {
  if (object == null) {
    return new Date();
  }
  if (object instanceof Date) {
    return object;
  }
  if (typeof object === 'string') {
    return new Date(object);
  }
  if (object?.toDate !== undefined) {
    return object.toDate();
  }
  throw new Error(`Could not parse date: ${object}`);
}

export function formatDate(date: Date | { toDate: () => Date }): string {
  if (date instanceof Date) {
    return date.toISOString();
  }
  if (date?.toDate !== undefined) {
    return date.toDate().toISOString();
  }
  if (typeof date === 'string') {
    return formatDate(getDate(date));
  }
  return null as any; // This will parse in JS into a Date.now()
}
