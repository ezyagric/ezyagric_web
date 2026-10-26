// Converts the originals in assets-src/ into small WebP files in public/images/.
// Run `npm run images` after adding or replacing an original; the output is
// committed, so the Docker build does not need to run this.
//
// Width is the largest size the image is shown at, doubled for sharp phone screens.

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "assets-src");
const OUT = path.join(ROOT, "public", "images");

/** [source, output (relative to public/images), max width, options] */
const IMAGES = [
  // App screenshots (App Store set, v4.8.x)
  ["screens/01-home.png", "screens/home.webp", 640],
  ["screens/02-agrishop.png", "screens/agrishop.webp", 640],
  ["screens/03-ka-ezy.png", "screens/ka-ezy.webp", 640],
  ["screens/04-garden-mapping.png", "screens/garden-mapping.webp", 640],
  ["screens/05-farm-plan.png", "screens/farm-plan.webp", 640],

  // Product artwork from the app
  ["app/ka-ezy-wave.png", "products/ka-ezy-wave.webp", 400],
  ["app/ka-ezy-phone.png", "products/ka-ezy-phone.webp", 520],
  ["app/agrishop.png", "products/agrishop.webp", 480],
  ["app/produce-market.png", "products/produce-market.webp", 480],

  // Photos
  ["photos/slide-1.jpg", "photos/farmers-with-phone.webp", 1200],
  ["photos/village-agent.jpg", "photos/village-agent.webp", 900],
  ["photos/offtaker-ui.png", "photos/web-portal.webp", 1200],
  ["photos/inputs.jpg", "photos/inputs.webp", 1200],
  ["photos/market.jpg", "photos/market.webp", 1200],
  ["photos/records.jpg", "photos/records.webp", 1200],
  ["photos/farm-profile.jpg", "photos/farm-profile.webp", 1200],

  // Payment marks
  ["brand/mtn.png", "brand/mtn.webp", 120],
  ["brand/airtel.png", "brand/airtel.webp", 120],

  // Partner logos are shown 48px tall
  ["partners/k+s.png", "partners/k-s.webp", 0, { height: 96 }],
  ["partners/bukoola.png", "partners/bukoola.webp", 0, { height: 96 }],
  ["partners/Grainpulse-Logo.png", "partners/grainpulse.webp", 0, { height: 96 }],
  ["partners/mfs.gif", "partners/mfs-africa.webp", 0, { height: 96 }],
  ["partners/naseco.png", "partners/naseco.webp", 0, { height: 96 }],
  ["partners/ankole.png", "partners/ankole-coffee.webp", 0, { height: 96 }],
  ["partners/simlaw.png", "partners/simlaw-seeds.webp", 0, { height: 96 }],
  ["partners/easeed.png", "partners/east-african-seed.webp", 0, { height: 96 }],
];

/** SVGs are copied as-is. */
const COPIES = [
  ["brand/ezyagric-logo.svg", "brand/ezyagric-logo.svg"],
  // Same logo without the tagline, for the header (viewBox cropped)
  ["brand/ezyagric-wordmark.svg", "brand/ezyagric-wordmark.svg"],
  ["brand/google-play-badge.svg", "brand/google-play-badge.svg"],
];

async function main() {
  const report = [];
  for (const [src, out, width, opts = {}] of IMAGES) {
    const dest = path.join(OUT, out);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const resize = opts.height
      ? { height: opts.height, withoutEnlargement: true }
      : { width, withoutEnlargement: true };
    const info = await sharp(path.join(SRC, src), { animated: false })
      .resize(resize)
      .webp({ quality: 78, effort: 6 })
      .toFile(dest);
    report.push({ out, w: info.width, h: info.height, kb: +(info.size / 1024).toFixed(1) });
  }
  for (const [src, out] of COPIES) {
    const dest = path.join(OUT, out);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(path.join(SRC, src), dest);
  }
  await writeVideoThumbs(report);
  await writeIcons();
  console.table(report);
}

// YouTube "hqdefault" thumbnails are 480x360 with black bars above and below
// a 16:9 picture; crop the bars off. Originals in assets-src/videos/<id>.jpg.
async function writeVideoThumbs(report) {
  const dir = path.join(SRC, "videos");
  await fs.mkdir(path.join(OUT, "videos"), { recursive: true });
  for (const file of (await fs.readdir(dir)).filter((f) => f.endsWith(".jpg"))) {
    const out = `videos/${path.basename(file, ".jpg")}.webp`;
    const info = await sharp(path.join(dir, file))
      .extract({ left: 0, top: 45, width: 480, height: 270 })
      .webp({ quality: 72, effort: 6 })
      .toFile(path.join(OUT, out));
    report.push({ out, w: info.width, h: info.height, kb: +(info.size / 1024).toFixed(1) });
  }
}

// Favicon set from the app icon: src/app/icon.png, apple-icon.png and a
// favicon.ico (PNG-in-ICO, 16/32/48) that Next serves at /favicon.ico.
async function writeIcons() {
  const icon = path.join(SRC, "brand/app-icon.png");
  const appDir = path.join(ROOT, "src", "app");
  await sharp(icon).resize(512, 512).png().toFile(path.join(appDir, "icon.png"));
  await sharp(icon)
    .resize(180, 180)
    .flatten({ background: "#ffffff" })
    .png()
    .toFile(path.join(appDir, "apple-icon.png"));

  const sizes = [16, 32, 48];
  const pngs = await Promise.all(
    sizes.map((s) => sharp(icon).resize(s, s).png().toBuffer()),
  );
  const header = Buffer.alloc(6 + 16 * sizes.length);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);
  let offset = header.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    header.writeUInt8(s, e); // width
    header.writeUInt8(s, e + 1); // height
    header.writeUInt8(0, e + 2); // palette
    header.writeUInt8(0, e + 3); // reserved
    header.writeUInt16LE(1, e + 4); // colour planes
    header.writeUInt16LE(32, e + 6); // bits per pixel
    header.writeUInt32LE(pngs[i].length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += pngs[i].length;
  });
  await fs.writeFile(path.join(appDir, "favicon.ico"), Buffer.concat([header, ...pngs]));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
