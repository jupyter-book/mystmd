import fs from 'fs';

const filename = './app/utils/memory.loader.server.ts';
const template = fs.readFileSync(filename).toString().split('\n');
const config = JSON.parse(fs.readFileSync('./app/config.json').toString());

const lines = [];
config.site.sections.forEach(({ folder }) => {
  lines.push(`  CACHE.data['${folder}'] = {};`);
  const pages = [
    { slug: config.folders[folder].index },
    ...config.folders[folder].pages.filter(({ slug }) => !!slug),
  ];
  pages.forEach(({ slug }) => {
    lines.push(
      `  CACHE.data['${folder}']['${slug}'] = await import('~/content/${folder}/${slug}.json');`,
    );
  });
});

const lineStart = template.findIndex((line) => line.includes('// START LOAD'));
const lineEnd = template.findIndex((line) => line.includes('// END LOAD'));

const newFile = [
  ...template.slice(0, lineStart + 1),
  ...lines,
  ...template.slice(lineEnd),
];

fs.writeFileSync(filename, newFile.join('\n'));
