import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/app-icons', { recursive: true });
for (const size of [192, 512]) {
  await sharp('public/brand-icon.svg', { density: 384 }).resize(size, size).png().toFile(`public/app-icons/icon-${size}.png`);
}
// Entire foreground artwork fits inside the central 80% safe circle.
await sharp('public/brand-icon.svg', { density: 384 }).resize(256, 256).flatten({ background: '#003c39' })
  .extend({ top: 128, bottom: 128, left: 128, right: 128, background: '#003c39' }).png().toFile('public/app-icons/maskable-512.png');
await sharp('public/brand-icon.svg', { density: 384 }).resize(180, 180).flatten({ background: '#003c39' }).png().toFile('public/app-icons/apple-180.png');
console.log('App icons exported from the existing vector brand; no generated artwork.');
