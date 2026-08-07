const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedFiles = 0;

const replacements = [
  // Black/Dark backgrounds to Primary (Navy Blue)
  { regex: /bg-\\[#000000\\]/g, replacement: 'bg-[var(--primary)]' },
  { regex: /bg-\\[#1a1a1a\\]/g, replacement: 'bg-[var(--primary)]' },
  { regex: /text-\\[#000000\\]/g, replacement: 'text-[var(--primary)]' },
  { regex: /text-\\[#1a1a1a\\]/g, replacement: 'text-[var(--primary)]' },
  { regex: /border-\\[#000000\\]/g, replacement: 'border-[var(--primary)]' },
  { regex: /border-\\[#1a1a1a\\]/g, replacement: 'border-[var(--primary)]' },
  { regex: /ring-\\[#000000\\]/g, replacement: 'ring-[var(--primary)]' },
  
  // Very Dark Grey / Text Colors to Foreground (Slate)
  { regex: /text-\\[#111111\\]/g, replacement: 'text-[var(--foreground)]' },
  { regex: /bg-\\[#111111\\]/g, replacement: 'bg-[var(--foreground)]' },
  { regex: /text-\\[#2f2f2f\\]/g, replacement: 'text-[var(--foreground)]' },
  { regex: /bg-\\[#2f2f2f\\]/g, replacement: 'bg-[var(--dark-grey)]' },
  
  // Greys to Muted
  { regex: /text-\\[#555555\\]/g, replacement: 'text-[var(--muted-foreground)]' },
  { regex: /text-\\[#777777\\]/g, replacement: 'text-[var(--muted-foreground)]' },
  { regex: /bg-\\[#555555\\]/g, replacement: 'bg-[var(--muted-foreground)]' },
  { regex: /border-\\[#555555\\]/g, replacement: 'border-[var(--muted-foreground)]' },
  
  // Light Greys to Background / Border
  { regex: /bg-\\[#f5f5f5\\]/g, replacement: 'bg-[var(--background)]' },
  { regex: /bg-\\[#f8f9fa\\]/g, replacement: 'bg-[var(--card)]' },
  { regex: /border-\\[#cfcfcf\\]/g, replacement: 'border-[var(--border)]' },
  { regex: /border-\\[#e5e5e5\\]/g, replacement: 'border-[var(--border)]' },
  
  // Specific Gov Green/Red from old theme to semantic
  { regex: /bg-\\[#166534\\]/g, replacement: 'bg-[var(--success)]' },
  { regex: /text-\\[#166534\\]/g, replacement: 'text-[var(--success)]' },
  { regex: /bg-\\[#b91c1c\\]/g, replacement: 'bg-[var(--destructive)]' },
  { regex: /text-\\[#b91c1c\\]/g, replacement: 'text-[var(--destructive)]' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  // Actually, let's just use simple string replacement!
  content = content.replaceAll('bg-[#000000]', 'bg-[var(--primary)]');
  content = content.replaceAll('bg-[#1a1a1a]', 'bg-[var(--primary)]');
  content = content.replaceAll('text-[#000000]', 'text-[var(--primary)]');
  content = content.replaceAll('text-[#1a1a1a]', 'text-[var(--primary)]');
  content = content.replaceAll('border-[#000000]', 'border-[var(--primary)]');
  content = content.replaceAll('border-[#1a1a1a]', 'border-[var(--primary)]');
  content = content.replaceAll('ring-[#000000]', 'ring-[var(--primary)]');

  content = content.replaceAll('text-[#111111]', 'text-[var(--foreground)]');
  content = content.replaceAll('bg-[#111111]', 'bg-[var(--foreground)]');
  content = content.replaceAll('text-[#2f2f2f]', 'text-[var(--foreground)]');
  content = content.replaceAll('bg-[#2f2f2f]', 'bg-[var(--dark-grey)]');

  content = content.replaceAll('text-[#555555]', 'text-[var(--muted-foreground)]');
  content = content.replaceAll('text-[#777777]', 'text-[var(--muted-foreground)]');
  content = content.replaceAll('bg-[#555555]', 'bg-[var(--muted-foreground)]');
  content = content.replaceAll('border-[#555555]', 'border-[var(--muted-foreground)]');

  content = content.replaceAll('bg-[#f5f5f5]', 'bg-[var(--background)]');
  content = content.replaceAll('bg-[#f8f9fa]', 'bg-[var(--card)]');
  content = content.replaceAll('border-[#cfcfcf]', 'border-[var(--border)]');
  content = content.replaceAll('border-[#e5e5e5]', 'border-[var(--border)]');

  content = content.replaceAll('bg-[#166534]', 'bg-[var(--success)]');
  content = content.replaceAll('text-[#166534]', 'text-[var(--success)]');
  content = content.replaceAll('bg-[#b91c1c]', 'bg-[var(--destructive)]');
  content = content.replaceAll('text-[#b91c1c]', 'text-[var(--destructive)]');
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    changedFiles++;
    console.log('Updated', file);
  }
});

console.log('Total files changed:', changedFiles);
