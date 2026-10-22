// Membuat ikon PWA (PNG 192 dan 512) tanpa dependensi tambahan.
// Latar hijau merek dengan huruf E putih. Huruf berada di tengah, jadi aman untuk ikon maskable.
// Jalankan: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
const BACKGROUND = [0x1f, 0x7a, 0x3a];
const FOREGROUND = [0xff, 0xff, 0xff];
const SUPERSAMPLE = 4;

// Kotak dalam koordinat 0-1: [x0, y0, x1, y1]. Ketiga batang membentuk huruf E.
const GLYPH = [
  [0.32, 0.26, 0.42, 0.74],
  [0.32, 0.26, 0.7, 0.35],
  [0.32, 0.455, 0.64, 0.545],
  [0.32, 0.65, 0.7, 0.74],
];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function insideGlyph(x, y) {
  return GLYPH.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
}

function renderPng(size) {
  const rows = Buffer.alloc((size * 4 + 1) * size);
  const samples = SUPERSAMPLE * SUPERSAMPLE;
  for (let py = 0; py < size; py += 1) {
    const rowStart = py * (size * 4 + 1);
    rows[rowStart] = 0; // filter: none
    for (let px = 0; px < size; px += 1) {
      let hits = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const x = (px + (sx + 0.5) / SUPERSAMPLE) / size;
          const y = (py + (sy + 0.5) / SUPERSAMPLE) / size;
          if (insideGlyph(x, y)) hits += 1;
        }
      }
      const coverage = hits / samples;
      const offset = rowStart + 1 + px * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        rows[offset + channel] = Math.round(BACKGROUND[channel] * (1 - coverage) + FOREGROUND[channel] * coverage);
      }
      rows[offset + 3] = 255;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // kedalaman bit
  header[9] = 6; // RGBA
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, renderPng(size));
  console.log(`ditulis ${file}`);
}
