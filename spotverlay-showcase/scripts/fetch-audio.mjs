import { mkdirSync, existsSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const outDir = resolve(root, "public", "audio", "downloaded");
const tmpDir = resolve(outDir, "_raw");
mkdirSync(tmpDir, { recursive: true });

const ffmpeg = [
  resolve(root, "node_modules", "@remotion", "compositor-win32-x64-msvc", "ffmpeg.exe"),
  "ffmpeg",
].find((p) => p === "ffmpeg" || existsSync(p));

const MIXKIT_SFX = (id) => `https://assets.mixkit.co/active_storage/sfx/${id}/${id}-preview.mp3`;
const MIXKIT_MUSIC = (id) => `https://assets.mixkit.co/music/${id}/${id}.mp3`;

// Mixkit Sound Effects / Stock Music Free License: https://mixkit.co/license/
const manifest = [
  { name: "whoosh-air.mp3", title: "Air woosh", url: MIXKIT_SFX(1489), trim: 1.6, lufs: -20 },
  { name: "whoosh-transition.mp3", title: "Fast whoosh transition", url: MIXKIT_SFX(1490), trim: 1.6, lufs: -20 },
  { name: "whoosh-short.mp3", title: "Arrow whoosh", url: MIXKIT_SFX(1491), trim: 1.2, lufs: -22 },
  { name: "music.mp3", title: "Relax Beat", url: MIXKIT_MUSIC(292), trim: 10.5, lufs: -18 },
];

for (const item of manifest) {
  const final = resolve(outDir, item.name);
  if (existsSync(final)) {
    console.log("skip", item.name);
    continue;
  }
  const raw = resolve(tmpDir, item.name);
  const res = await fetch(item.url, {
    headers: { "User-Agent": "Mozilla/5.0", Referer: "https://mixkit.co/" },
  });
  if (!res.ok) throw new Error(`${item.url} -> ${res.status}`);
  writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  const r = spawnSync(
    ffmpeg,
    [
      "-y", "-i", raw, "-t", String(item.trim),
      "-af", `loudnorm=I=${item.lufs}:TP=-2:LRA=11,aresample=44100`,
      "-ac", "2", "-b:a", "192k", final,
    ],
    { stdio: "inherit" },
  );
  if (r.status !== 0) throw new Error(`ffmpeg failed for ${item.name}`);
  console.log("ready", item.name, "-", item.title);
}

rmSync(tmpDir, { recursive: true, force: true });
