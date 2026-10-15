/* Genera los iconos del PWA desde los SVG fuente: npm.cmd run iconos
   Fuentes: public/icons/icono.svg y public/icons/maskable.svg */

import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const dir = path.join('public', 'icons');
await mkdir(dir, { recursive: true });

// El favicon es copia literal del SVG principal
await copyFile(path.join(dir, 'icono.svg'), path.join(dir, 'favicon.svg'));
console.log('  ✅ favicon.svg');

const tareas = [
  ['icono.svg', 'icono-192.png', 192],
  ['icono.svg', 'icono-512.png', 512],
  ['maskable.svg', 'maskable-512.png', 512],
];

for (const [origen, destino, tam] of tareas) {
  const svg = await readFile(path.join(dir, origen));
  await sharp(svg).resize(tam, tam).png().toFile(path.join(dir, destino));
  console.log(`  ✅ ${destino} (${tam}×${tam})`);
}

console.log('Iconos del PWA al día ✅');
