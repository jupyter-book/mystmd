import fs from 'fs';

const filename = './app/utils/loader.memory.server.ts';
const template = fs.readFileSync(filename).toString().split('\n');
const config = JSON.parse(fs.readFileSync('./app/config.json').toString());

const lines = [];
config.projects.forEach((proj) => {
  lines.push(`  CACHE.data['${proj.slug}'] = {};`);
  lines.push(
    `  CACHE.data['${proj.slug}']['${proj.index}'] = await import('~/content/${proj.slug}/${proj.index}.json');`,
  );
  proj.pages.forEach(({ slug }) => {
    lines.push(
      `  CACHE.data['${proj.slug}']['${slug}'] = await import('~/content/${proj.slug}/${slug}.json');`,
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
