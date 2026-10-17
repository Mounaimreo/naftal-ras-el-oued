import fs from "node:fs";
import zlib from "node:zlib";

function createPng(width, height, getPixel) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, "ascii");
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0))
  ]);
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Pixel drawer for Naftal logo: Dark navy (#08264D) background, vibrant golden/yellow (#F5D32E) emblem with fuel pump & clock hands
function drawNaftalIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.hypot(x - cx, y - cy);
  const maxR = w * 0.44;

  // Background
  const bgR = 8, bgG = 38, bgB = 77; // #08264D

  if (!isMaskable && r > maxR) {
    // transparent outer for normal rounded app icon
    if (r > maxR + 1) return [0, 0, 0, 0];
    const alpha = Math.max(0, Math.min(255, Math.floor((1 - (r - maxR)) * 255)));
    return [bgR, bgG, bgB, alpha];
  }

  // Ring around emblem
  const ringR = w * 0.36;
  const ringThick = Math.max(3, w * 0.035);
  if (Math.abs(r - ringR) < ringThick) {
    return [245, 211, 46, 255]; // Yellow #F5D32E
  }

  // Inner icon: Fuel pump stylized droplet and shift clock
  const dx = (x - cx) / (w * 0.28);
  const dy = (y - cy) / (h * 0.28);

  // Droplet / Fuel shape inside
  const inDroplet = (dx * dx + (dy - 0.15) * (dy - 0.15) < 0.48) || 
                    (Math.abs(dx) < (0.6 - dy) * 0.5 && dy >= -0.7 && dy <= 0.15);

  if (inDroplet) {
    // Yellow drop
    return [245, 211, 46, 255];
  }

  // Shift indicator dots (4 dots at 12, 3, 6, 9 o'clock)
  const angle = Math.atan2(y - cy, x - cx);
  const dotR = w * 0.30;
  const inDot1 = Math.hypot(x - (cx), y - (cy - dotR)) < (w * 0.04);
  const inDot2 = Math.hypot(x - (cx + dotR), y - (cy)) < (w * 0.04);
  const inDot3 = Math.hypot(x - (cx), y - (cy + dotR)) < (w * 0.04);
  const inDot4 = Math.hypot(x - (cx - dotR), y - (cy)) < (w * 0.04);

  if (inDot1 || inDot2 || inDot3 || inDot4) {
    return [255, 255, 255, 240];
  }

  return [bgR, bgG, bgB, 255];
}

fs.mkdirSync("public", { recursive: true });

// 192x192
fs.writeFileSync("public/pwa-192x192.png", createPng(192, 192, (x, y, w, h) => drawNaftalIcon(x, y, w, h, false)));
// 512x512
fs.writeFileSync("public/pwa-512x512.png", createPng(512, 512, (x, y, w, h) => drawNaftalIcon(x, y, w, h, false)));
// 512x512 maskable (has padding so nothing gets clipped)
fs.writeFileSync("public/pwa-maskable-512x512.png", createPng(512, 512, (x, y, w, h) => drawNaftalIcon(x, y, w, h, true)));
// apple-touch-icon 180x180
fs.writeFileSync("public/apple-touch-icon.png", createPng(180, 180, (x, y, w, h) => drawNaftalIcon(x, y, w, h, true)));
// favicon.ico
fs.writeFileSync("public/favicon.ico", createPng(64, 64, (x, y, w, h) => drawNaftalIcon(x, y, w, h, false)));

// SVG icon
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="110" fill="#08264D" />
  <circle cx="256" cy="256" r="185" fill="none" stroke="#F5D32E" stroke-width="18" stroke-dasharray="14 10" />
  <!-- Drop / Flame center -->
  <path d="M256 120 C230 190 170 230 170 300 C170 348 208 386 256 386 C304 386 342 348 342 300 C342 230 282 190 256 120 Z" fill="#F5D32E" />
  <circle cx="256" cy="310" r="35" fill="#08264D" />
  <!-- Clock hands inside -->
  <line x1="256" y1="310" x2="256" y2="290" stroke="#F5D32E" stroke-width="6" stroke-linecap="round" />
  <line x1="256" y1="310" x2="274" y2="310" stroke="#F5D32E" stroke-width="6" stroke-linecap="round" />
  <!-- 4 shift indicators -->
  <circle cx="256" cy="95" r="14" fill="#E4B420" />
  <circle cx="417" cy="256" r="14" fill="#5688D7" />
  <circle cx="256" cy="417" r="14" fill="#4F55AA" />
  <circle cx="95" cy="256" r="14" fill="#45A687" />
</svg>`;
fs.writeFileSync("public/icon.svg", svg);

console.log("PWA Icons generated successfully in /public");
