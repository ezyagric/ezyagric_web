// The visitor's own photo for Farm Expert's photo check. It is read in the
// browser once, when it is picked, and drawn smaller: a small copy shows in
// the conversation (and is kept with it on this device), and, with live
// answers only, a copy the size the app sends goes to Ka-Ezy with the
// question. Both are new JPEGs drawn on a canvas, so the original file and
// its metadata (location, camera) are never kept or sent.
//
import { MAX_PHOTO_LENGTH } from "./store";

// The photo is read as a data URL, not a blob: URL, because the site's
// Content-Security-Policy allows data: images only (nginx/nginx.conf).

/** The longest side of the copy kept in the conversation (shown up to about 210px wide). */
const KEPT_SIZE = 420;
/** As the app sends photos to Ka-Ezy: 1024px at most, JPEG quality 80. */
const SENT_SIZE = 1024;
/** Larger files are not opened (phone photos are well under this). */
const MAX_BYTES = 25 * 1024 * 1024;

export class PhotoError extends Error {}

function dataUrlOf(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new PhotoError()));
    reader.onerror = () => reject(new PhotoError());
    reader.readAsDataURL(file);
  });
}

async function open(file: File): Promise<HTMLImageElement> {
  // Some systems give no type for a photo: let the browser decide.
  if ((file.type && !file.type.startsWith("image/")) || file.size > MAX_BYTES) throw new PhotoError();
  const image = new Image();
  image.src = await dataUrlOf(file);
  // A format the browser can't show (HEIC on most Android phones, say) fails here.
  await image.decode().catch(() => {
    throw new PhotoError();
  });
  if (!image.naturalWidth || !image.naturalHeight) throw new PhotoError();
  return image;
}

/** The photo drawn with its longest side at most `size` px, on white (for transparent PNGs). */
function draw(image: HTMLImageElement, size: number): HTMLCanvasElement {
  const scale = Math.min(1, size / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new PhotoError();
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function jpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new PhotoError())), "image/jpeg", quality),
  );
}

/**
 * The visitor's photo, read once: `kept`, the small JPEG copy shown in the
 * conversation, as a data URL (the only kind of photo the demo's store
 * keeps, see store.ts) with its size; and `sent`, the copy for Ka-Ezy when
 * `forSending` (live answers), else null. Throws PhotoError.
 */
export async function readPhoto(
  file: File,
  forSending: boolean,
): Promise<{ kept: { src: string; width: number; height: number }; sent: Blob | null }> {
  const image = await open(file);
  const canvas = draw(image, KEPT_SIZE);
  const src = canvas.toDataURL("image/jpeg", 0.72);
  if (!src.startsWith("data:image/jpeg;base64,") || src.length > MAX_PHOTO_LENGTH) throw new PhotoError();
  const sent = forSending ? await jpeg(draw(image, SENT_SIZE), 0.8) : null;
  return { kept: { src, width: canvas.width, height: canvas.height }, sent };
}
