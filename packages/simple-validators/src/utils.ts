import moment from 'moment';

export function getDate(object: undefined | Date | string | { toDate: () => Date }): Date {
  if (object == null) {
    return new Date();
  }
  if (object instanceof Date) {
    return object;
  }
  if (typeof object === 'string') {
    const result = moment.parseZone(object);
    return result.toDate();
  }
  if (object?.toDate !== undefined) {
    return object.toDate();
  }
  throw new Error(`Could not parse date: ${object}`);
}

function formatISODateString(date: Date): string {
  // Format the date as a machine-readable date
  const isoString = date.toISOString();
  const match = isoString.match(/^\d+-\d+-\d+/);
  return match![0];
}

export function formatDate(date: Date | { toDate: () => Date }): string {
  if (date instanceof Date) {
    return formatISODateString(date);
  }
  if (date?.toDate !== undefined) {
    return formatISODateString(date.toDate());
  }
  if (typeof date === 'string') {
    return formatDate(getDate(date));
  }
  return null as any; // This will parse in JS into a Date.now()
}
