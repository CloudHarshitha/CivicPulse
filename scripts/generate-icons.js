// Script to generate PWA icons — run with: node scripts/generate-icons.js
// Uses only built-in Node modules + canvas API

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function drawIcon(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const padding = maskable ? size * 0.15 : 0;
  const inner = size - padding * 2;

  // Background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#0a0f1e');
  grad.addColorStop(0.5, '#003366');
  grad.addColorStop(1, '#0056b3');
  ctx.fillStyle = grad;
  if (maskable) {
    ctx.fillRect(0, 0, size, size);
  } else {
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, size * 0.2);
    ctx.fill();
  }

  // Icon content — Activity wave
  const cx = padding + inner / 2;
  const cy = padding + inner / 2;
  const r = inner * 0.36;

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = size * 0.03;
  ctx.stroke();

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#06b6d4';
  ctx.fill();

  // EKG / pulse line
  const lw = size * 0.045;
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#06b6d4';
  ctx.shadowBlur = size * 0.05;

  ctx.beginPath();
  const startX = cx - r * 0.85;
  const endX = cx + r * 0.85;
  ctx.moveTo(startX, cy);
  ctx.lineTo(cx - r * 0.45, cy);
  ctx.lineTo(cx - r * 0.22, cy - r * 0.55);
  ctx.lineTo(cx, cy + r * 0.45);
  ctx.lineTo(cx + r * 0.22, cy - r * 0.35);
  ctx.lineTo(cx + r * 0.45, cy);
  ctx.lineTo(endX, cy);
  ctx.stroke();

  // "CP" text for smaller sizes, full text for larger
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = inner * 0.12;
  ctx.font = `bold ${fontSize}px -apple-system, sans-serif`;
  ctx.fillText('CIVICPULSE', cx, cy + r * 0.75);

  return canvas;
}

const sizes = [
  { size: 192, name: 'icon-192.png', maskable: false },
  { size: 192, name: 'icon-192-maskable.png', maskable: true },
  { size: 512, name: 'icon-512.png', maskable: false },
  { size: 512, name: 'icon-512-maskable.png', maskable: true },
];

sizes.forEach(({ size, name, maskable }) => {
  const canvas = drawIcon(size, maskable);
  const buffer = canvas.toBuffer('image/png');
  const outPath = path.join(iconsDir, name);
  fs.writeFileSync(outPath, buffer);
  console.log(`✓ Generated ${name} (${size}x${size})`);
});

console.log('\n✅ All PWA icons generated in public/icons/');
