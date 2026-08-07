const fs = require('fs');
const path = require('path');

// Walk all .tsx files under src/
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) walkDir(full, callback);
    else if (f.endsWith('.tsx') || f.endsWith('.ts')) callback(full);
  });
}

let totalFixed = 0;

walkDir(path.join(__dirname, 'src'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix: bg-[#003366] ... text-[#1a1a2e]  →  ... text-white
  // This covers cases where the two classes are in the same className string
  content = content.replace(/bg-\[#003366\]([^"'\n`]*?)text-\[#1a1a2e\]/g, 'bg-[#003366]$1text-white');

  // Also fix the reverse order: text-[#1a1a2e] ... bg-[#003366]
  content = content.replace(/text-\[#1a1a2e\]([^"'\n`]*?)bg-\[#003366\]/g, 'text-white$1bg-[#003366]');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const count = (original.match(/bg-\[#003366\][^"'\n`]*?text-\[#1a1a2e\]/g) || []).length;
    console.log(`✅ Fixed ${filePath.replace(__dirname, '.')}`);
    totalFixed++;
  }
});

console.log(`\nDone! Fixed ${totalFixed} files.`);
