/**
 * Builds the animated profile assets from the source video:
 *  - public/profile-animated.webp  animated WebP (all frames, loops forever) —
 *                                  played natively by browsers inside <img>
 *  - public/profile-static.webp    single calm hero frame (prefers-reduced-motion)
 *
 * Source: lib/data/img/profile-video.mp4 (copy of the user's original video).
 *
 * Pipeline (per frame):
 *  1. ffmpeg extracts frames at 12 fps (fast motion, small output).
 *  2. Person matte via @imgly/background-removal-node (local ONNX segmentation —
 *     keeps the black shirt that naive color keying would lose).
 *  3. Effect matte: temporal median background (camera is static) + difference
 *     key restricted to blue/cyan-bright pixels — recovers the lightning /
 *     particle-ring effects that the person segmentation would drop.
 *  4. Final alpha = max(person, effect); encoded as animated WebP.
 *
 * Run with: node scripts/build-profile-animation.mjs
 * After rebuilding, bump the ?v= cache-buster in components/ProfileOrbit.tsx.
 */
import { createRequire } from "module";
import { spawnSync } from "child_process";
import { mkdtempSync, rmSync, readdirSync, mkdirSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";

// IMPORTANT: sharp/imgly are loaded from imgly's OWN nested sharp copy (single
// libvips/GLib in the process). ffmpeg extraction ran before those imports —
// loading sharp's libvips first made the spawned ffmpeg.exe crash with GLib
// criticals on this machine.

const VIDEO = "lib/data/img/profile-video.mp4";
const FPS = 12;
const OUT_W = 480;
const OUT_H = 270; // 16:9

const require = createRequire(import.meta.url);
const ffmpegPath = require("ffmpeg-static");

// Load sharp exactly where @imgly/background-removal-node loads its own copy.
// Importing the repo's root sharp (0.35) would put TWO libvips/GLib copies in
// one process and crash the matting loop (GLib criticals / exit 1).
const sharpRequire = createRequire(
  path.join(process.cwd(), "node_modules/@imgly/background-removal-node/x.js"),
);
const sharp = sharpRequire("sharp");
const { removeBackground } = require("@imgly/background-removal-node");

const workDir = mkdtempSync(path.join(tmpdir(), "profile-build-"));
const framesDir = path.join(workDir, "frames");
const matteDir = path.join(workDir, "matte");

/** 1. Extract frames with ffmpeg. */
function extractFrames() {
  mkdirSync(framesDir, { recursive: true });
  const res = spawnSync(
    ffmpegPath,
    ["-y", "-i", VIDEO, "-vf", `fps=${FPS}`, "-start_number", "0", path.join(framesDir, "f%04d.png")],
    // Note: stderr must be piped (not ignored) — this ffmpeg build crashes
    // with GLib criticals if its stderr handle is closed.
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  if (res.status !== 0) {
    throw new Error(`ffmpeg frame extraction failed (status ${res.status}):\n${String(res.stderr).slice(-600)}`);
  }
}

/** Smoothstep between a and b (0→1). */
function smooth(x, a, b) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** 2+3. Person matte union effect matte for one frame. */
async function matteFrame(sharp, removeBackground, framePath, medianBg) {
  const [personBlob, orig] = await Promise.all([
    removeBackground(new Blob([await sharp(framePath).png().toBuffer()], { type: "image/png" }), {
      output: { format: "image/png" },
    }),
    sharp(framePath).raw().toBuffer(),
  ]);

  const person = await sharp(Buffer.from(await personBlob.arrayBuffer()))
    .ensureAlpha()
    .raw()
    .toBuffer();

  const w = OUT_SRC_W;
  const h = OUT_SRC_H;
  const out = Buffer.alloc(w * h * 4);
  const isMedian = Buffer.isBuffer(medianBg);

  for (let i = 0, px = 0; px < w * h; i += 4, px++) {
    const r = orig[px * 3];
    const g = orig[px * 3 + 1];
    const b = orig[px * 3 + 2];

    let a = person[i + 3];

    // Effect key: differs from static background AND adds blue/cyan light.
    if (isMedian) {
      const Br = medianBg[px * 3];
      const Bg = medianBg[px * 3 + 1];
      const Bb = medianBg[px * 3 + 2];
      const diff = Math.max(Math.abs(r - Br), Math.abs(g - Bg), Math.abs(b - Bb));
      const addsBlue = Math.max(b - Bb, g - Bg) >= 12;
      if (addsBlue) {
        const ea = Math.round(255 * smooth(diff, 15, 55));
        if (ea > a) a = ea;
      }
    }

    if (a === 0) {
      out[i + 3] = 0;
      continue;
    }
    // Color: person pixels keep the segmentation color; effect-only pixels
    // take the original (bright particle) color.
    if (a === person[i + 3]) {
      out[i] = person[i];
      out[i + 1] = person[i + 1];
      out[i + 2] = person[i + 2];
    } else {
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
    }
    out[i + 3] = a;
  }
  return out;
}

const OUT_SRC_W = 640;
const OUT_SRC_H = 360;

/** Temporal median background across all frames (per pixel, per channel). */
async function computeMedianBackground(sharp, framePaths) {
  const stack = await Promise.all(framePaths.map((f) => sharp(f).raw().toBuffer()));
  const n = stack.length;
  const median = Buffer.alloc(OUT_SRC_W * OUT_SRC_H * 3);
  const col = new Uint8Array(n);
  for (let px = 0; px < OUT_SRC_W * OUT_SRC_H; px++) {
    for (let c = 0; c < 3; c++) {
      for (let k = 0; k < n; k++) col[k] = stack[k][px * 3 + c];
      // Small insertion sort on a 96-element array.
      for (let i = 1; i < n; i++) {
        const v = col[i];
        let j = i - 1;
        while (j >= 0 && col[j] > v) {
          col[j + 1] = col[j];
          j--;
        }
        col[j + 1] = v;
      }
      median[px * 3 + c] = col[n >> 1];
    }
  }
  return median;
}

extractFrames();

const framePaths = readdirSync(framesDir)
  .filter((f) => f.endsWith(".png"))
  .sort()
  .map((f) => path.join(framesDir, f));

console.log(`Extracted ${framePaths.length} frames — computing median background…`);
const medianBg = await computeMedianBackground(sharp, framePaths);

console.log("Matting frames…");
mkdirSync(matteDir, { recursive: true });
let staticFrame;
for (let i = 0; i < framePaths.length; i++) {
  const raw = await matteFrame(sharp, removeBackground, framePaths[i], medianBg);
  const page = await sharp(raw, { raw: { width: OUT_SRC_W, height: OUT_SRC_H, channels: 4 } })
    .resize(OUT_W, OUT_H)
    .png()
    .toBuffer();
  writeFileSync(path.join(matteDir, `m${String(i).padStart(4, "0")}.png`), page);
  staticFrame = page;
  if ((i + 1) % 16 === 0) console.log(`  ${i + 1}/${framePaths.length}`);
}

console.log("Encoding animated WebP…");
const animationResult = spawnSync(
  ffmpegPath,
  [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    path.join(matteDir, "m%04d.png"),
    "-c:v",
    "libwebp_anim",
    "-lossless",
    "0",
    "-preset",
    "picture",
    "-quality",
    "80",
    "-loop",
    "0",
    "public/profile-animated.webp",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
if (animationResult.status !== 0) {
  throw new Error(
    `Animated WebP encoding failed (status ${animationResult.status}):\n${String(animationResult.stderr).slice(-600)}`,
  );
}

console.log("Encoding static frame (last)…");
await sharp(staticFrame)
  .webp({ quality: 88 })
  .toFile("public/profile-static.webp");

rmSync(workDir, { recursive: true, force: true });

const meta = await sharp("public/profile-animated.webp").metadata();
console.log(
  `Done: public/profile-animated.webp (${meta.pages} frames, ${meta.width}x${meta.height}) + public/profile-static.webp`,
);
