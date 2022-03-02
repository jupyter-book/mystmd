import test from './test.json';

const interactive: Record<string, any> = {
  test,
};

const ALL_PAGES = { interactive };

function toCamelCase(slug: string): string {
  const [first, ...rest] = slug.split('-');
  return (
    first + rest.map((s) => s.slice(0, 1).toUpperCase() + (s.slice(1) ?? '')).join('')
  );
}

export function getData(folderName: string, slug: string) {
  return ALL_PAGES[folderName as keyof typeof ALL_PAGES]?.[toCamelCase(slug)] ?? null;
}
