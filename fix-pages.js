const fs = require('fs');

const files = process.argv.slice(2);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('const userId = session!.user!.id;')) {
    content = content.replace(/const userId = session!\.user!\.id;/g, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
}
