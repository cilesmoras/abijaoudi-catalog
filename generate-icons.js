// Generates every app icon from public/icon.svg (the single source of truth).
// Run: node generate-icons.js
//
// Produces:
//   public/icon-192x192.png, public/icon-512x512.png  (PWA manifest, maskable)
//   app/icon.svg                                       (scalable favicon)
//   app/apple-icon.png                                 (iOS home-screen icon)
//   app/favicon.ico                                    (legacy 16/32/48 favicon)
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const publicDir = path.join(__dirname, "public");
const appDir = path.join(__dirname, "app");
const svgPath = path.join(publicDir, "icon.svg");
const svg = fs.readFileSync(svgPath);

const render = (size) =>
  sharp(svg, { density: 300 }).resize(size, size).png();

function icoFromPngs(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  pngs.forEach((p, i) => {
    const e = i * 16;
    dir[e] = p.size >= 256 ? 0 : p.size; // width
    dir[e + 1] = p.size >= 256 ? 0 : p.size; // height
    dir.writeUInt16LE(1, e + 4); // color planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(p.buf.length, e + 8); // image size
    dir.writeUInt32LE(offset, e + 12); // image offset
    offset += p.buf.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.buf)]);
}

(async () => {
  // PWA manifest icons (maskable)
  await render(192).toFile(path.join(publicDir, "icon-192x192.png"));
  await render(512).toFile(path.join(publicDir, "icon-512x512.png"));

  // Scalable favicon for modern browsers (Next App Router file convention)
  fs.copyFileSync(svgPath, path.join(appDir, "icon.svg"));

  // Apple touch icon (opaque; iOS applies its own rounded mask)
  await render(180).toFile(path.join(appDir, "apple-icon.png"));

  // Legacy multi-size favicon.ico
  const pngs = [];
  for (const size of [16, 32, 48]) {
    pngs.push({ size, buf: await render(size).toBuffer() });
  }
  fs.writeFileSync(path.join(appDir, "favicon.ico"), icoFromPngs(pngs));

  console.log("Icons generated successfully.");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
