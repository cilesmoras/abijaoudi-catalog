const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const tb = Buffer.from(type, "ascii");
  const cr = Buffer.alloc(4);
  cr.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, cr]);
}

function createSolidPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB color type
  const row = Buffer.alloc(1 + size * 3);
  row[0] = 0; // None filter
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const rows = Array.from({ length: size }, () => Buffer.from(row));
  const raw = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const publicDir = path.join(__dirname, "public");
fs.writeFileSync(
  path.join(publicDir, "icon-192x192.png"),
  createSolidPNG(192, 30, 80, 200),
);
fs.writeFileSync(
  path.join(publicDir, "icon-512x512.png"),
  createSolidPNG(512, 30, 80, 200),
);
console.log("PWA icons created successfully.");
