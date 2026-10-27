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
  // Ka-Ezy waving, the farmer app's chat avatar (assets/ka-ezy.png), for the
  // website's "Ask Ka-Ezy" chat header.
  ["app/ka-ezy-avatar.png", "products/ka-ezy-avatar.webp", 200],
  ["app/agrishop.png", "products/agrishop.webp", 480],
  ["app/produce-market.png", "products/produce-market.webp", 480],

  // Photos
  ["photos/slide-1.jpg", "photos/farmers-with-phone.webp", 1200],
  ["photos/offtaker-ui.png", "photos/web-portal.webp", 1200],
  ["photos/inputs.jpg", "photos/inputs.webp", 1200],
  ["photos/market.jpg", "photos/market.webp", 1200],
  ["photos/records.jpg", "photos/records.webp", 1200],
  ["photos/farm-profile.jpg", "photos/farm-profile.webp", 1200],

  // From the EzyAgric Creative & Content Pack (Google Drive, Oct 2026)
  ["app/ka-ezy-full.png", "products/ka-ezy-full.webp", 640],
  ["photos-2026/farmer-with-phone.jpg", "photos/farmer-with-phone.webp", 720],
  ["photos-2026/kaezy-exhibition.jpg", "photos/kaezy-exhibition.webp", 800],
  ["photos-2026/farmer-in-garden.jpg", "photos/farmer-in-garden.webp", 720],
  ["photos-2026/ezyagric-bag-coffee.jpg", "photos/ezyagric-bag-coffee.webp", 1400],
  // Agrishop delivery, from the marketing team's Website folder (WhatsApp
  // images, 27 Oct 2026), each saved at its full size (no larger copies):
  // "WhatsApp Image 2026-10-27 at 22.32.27.jpeg", then 22.33.30, 22.43.16,
  // 22.45.19 and 22.47.04.
  ["photos-2026/agrishop-delivery-fleet.jpg", "photos/agrishop-delivery-fleet.webp", 1400],
  ["photos-2026/agrishop-delivery-handover.jpg", "photos/agrishop-delivery-handover.webp", 768],
  ["photos-2026/agrishop-delivery-unloading.jpg", "photos/agrishop-delivery-unloading.webp", 567],
  ["photos-2026/agrishop-delivery-team.jpg", "photos/agrishop-delivery-team.webp", 1280],
  ["photos-2026/agrishop-delivery-team-truck.jpg", "photos/agrishop-delivery-team-truck.webp", 720],
  // Same folder, later that evening: an agro-input shop "Powered by
  // EzyAgric" (22.59.06) and Agrishop's "Shop by category" on a phone
  // (23.00.18, 1500x2000).
  ["photos-2026/agrishop-merchant-shop.jpg", "photos/agrishop-merchant-shop.webp", 768],
  ["photos-2026/agrishop-app-shop-by-category.jpg", "photos/agrishop-app-shop-by-category.webp", 1200],

  // EzyAgric field photos (2015, 2016 and 2020) from the marketing team's
  // Website folder, saved at up to 2400px with no camera, owner or location
  // data. The source file and any credit are noted on each line.
  // Home "How the four tools work together": one per step.
  ["photos-field/agent-shows-farmers-phone.jpg", "photos/agent-shows-farmers-phone.webp", 1000], // "Manafwa 26th July 2016 (22).JPG"
  ["photos-field/agro-shop-product-check.jpg", "photos/agro-shop-product-check.webp", 1000], // "KKAMIKKA YOUTH 28th July 2016 (27).JPG"
  ["photos-field/agro-dealer-phone.jpg", "photos/agro-dealer-phone.webp", 1000], // IMG_2736.JPG, 2020, credit: Ronistar
  ["photos-field/farmer-produce-sacks.jpg", "photos/farmer-produce-sacks.webp", 1000], // DSCN8815.jpg, 2015
  // Home "Our impact" mosaic, beside farmer-with-phone (cells about 300px wide at most).
  ["photos-field/farmers-sorting-maize.jpg", "photos/farmers-sorting-maize.webp", 640], // "Manafwa 26th July 2016 (7).JPG"
  ["photos-field/farmer-coffee-cherries.jpg", "photos/farmer-coffee-cherries.webp", 600], // DSC_0196.JPG, July 2016
  // EzyCredits "How Pay Later works".
  ["photos-field/agent-helps-farmer-phone.jpg", "photos/agent-helps-farmer-phone.webp", 1400], // IMG_0398.JPG, 2020, credit: Ronistar
  // Ka-Ezy "Hire Ka-Ezy in 3 easy taps".
  ["photos-field/team-village-agent-maize.jpg", "photos/team-village-agent-maize.webp", 581], // "Akorion staff building capacity of VA to profile.jpg" (581px wide: no larger copy)

  // Stills from "EzyAgric Poultry Video.mp4" (marketing team's Website folder,
  // Oct 2026): Marvin Busulwa's poultry farm, for the home page's livestock
  // section. Frame times: app-among-hens 1:04 (the video's poster), eggs-tray
  // 1:23 (the inset panel, x 560-1360), feeding-time 0:46, kaezy-photo-check
  // 2:14, layers-feeder 0:16.
  ["photos-poultry/app-among-hens.jpg", "photos/poultry-app-among-hens.webp", 1400],
  ["photos-poultry/eggs-tray.jpg", "photos/poultry-eggs-tray.webp", 600],
  ["photos-poultry/feeding-time.jpg", "photos/poultry-feeding-time.webp", 800],
  ["photos-poultry/kaezy-photo-check.jpg", "photos/poultry-kaezy-photo-check.webp", 800],
  ["photos-poultry/layers-feeder.jpg", "photos/poultry-layers-feeder.webp", 800],
  ["video-posters/kaezy-expert-advice.png", "videos/kaezy-expert-advice.webp", 900],
  ["video-posters/kaezy-disease-diagnosis.png", "videos/kaezy-disease-diagnosis.webp", 900],
  ["video-posters/kaezy-garden-mapping.png", "videos/kaezy-garden-mapping.webp", 900],
  ["video-posters/kaezy-farm-records.png", "videos/kaezy-farm-records.webp", 900],
  // Portrait Ka-Ezy demo ("Demo Video For Ka-Ezy", Creative & Content Pack): frame at 0:40
  ["video-posters/kaezy-demo.png", "videos/kaezy-demo.webp", 540],

  // Payment marks
  ["brand/mtn.png", "brand/mtn.webp", 120],
  ["brand/airtel.png", "brand/airtel.webp", 120],

];

// Partner logos, cut from the partners slide of "EzyAgric - Business profile
// 2026.pptx" (assets-src/partners/<slug>.png). Shown inside 160x64 tiles, so
// each is fitted into a 320x128 box for sharp screens.
const PARTNER_BOX = { width: 320, height: 128 };

/** SVGs are copied as-is. */
const COPIES = [
  ["brand/ezyagric-logo.svg", "brand/ezyagric-logo.svg"],
  // Same logo without the tagline, for the header (viewBox cropped)
  ["brand/ezyagric-wordmark.svg", "brand/ezyagric-wordmark.svg"],
  // Reversed (white) lockup for navy, blue or green backgrounds
  ["brand/ezyagric-logo-white.svg", "brand/ezyagric-logo-white.svg"],
  ["brand/google-play-badge.svg", "brand/google-play-badge.svg"],
  // Apple's official black "Download on the App Store" badge (US-UK, 2017
  // artwork from developer.apple.com/app-store/marketing/guidelines)
  ["brand/app-store-badge.svg", "brand/app-store-badge.svg"],
];

async function main() {
  const report = [];
  for (const [src, out, width, opts = {}] of IMAGES) {
    const dest = path.join(OUT, out);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    const resize = opts.height
      ? { height: opts.height, withoutEnlargement: true }
      : { width, withoutEnlargement: true };
    // autoOrient: a camera photo held upright (EXIF orientation) stays upright.
    const info = await sharp(path.join(SRC, src), { animated: false, autoOrient: true })
      .resize(resize)
      .webp({ quality: 78, effort: 6 })
      .toFile(dest);
    report.push({ out, w: info.width, h: info.height, kb: +(info.size / 1024).toFixed(1) });
  }
  const partnersDir = path.join(SRC, "partners");
  await fs.mkdir(path.join(OUT, "partners"), { recursive: true });
  for (const file of (await fs.readdir(partnersDir)).filter((f) => f.endsWith(".png"))) {
    const out = `partners/${path.basename(file, ".png")}.webp`;
    const info = await sharp(path.join(partnersDir, file))
      .resize({ ...PARTNER_BOX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85, effort: 6 })
      .toFile(path.join(OUT, out));
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
