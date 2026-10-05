import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "..", "public", "audio", "synth");
mkdirSync(outDir, { recursive: true });

const SR = 44100;

function writeWav(name, samples) {
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? 0.89 / peak : 1;
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => {
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * gain * 32767))), i * 2);
  });
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  writeFileSync(resolve(outDir, name), Buffer.concat([header, data]));
  console.log("wrote", name);
}

const make = (seconds, fn) =>
  Float32Array.from({ length: Math.floor(seconds * SR) }, (_, i) => fn(i / SR, i));

const env = (t, attack, decay) =>
  Math.min(1, t / attack) * Math.exp(-t / decay);

writeWav(
  "boom.wav",
  make(0.9, (t) => {
    const f = 40 + 25 * Math.exp(-t * 6);
    return Math.sin(2 * Math.PI * f * t) * env(t, 0.01, 0.28);
  }),
);

[523.25, 587.33, 659.25, 783.99, 880].forEach((f, i) => {
  writeWav(
    `pop-${i + 1}.wav`,
    make(0.35, (t) => {
      const body = Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t);
      return body * env(t, 0.003, 0.06);
    }),
  );
});

let seed = 7;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647 - 0.5;
};
writeWav(
  "tick.wav",
  make(0.12, (t) => {
    const click = Math.sin(2 * Math.PI * 1800 * t) * env(t, 0.001, 0.015);
    const noise = rand() * env(t, 0.0005, 0.004);
    return click + noise * 0.5;
  }),
);

{
  const dry = make(1.8, (t) => {
    const tone =
      Math.sin(2 * Math.PI * 880 * t) + 0.7 * Math.sin(2 * Math.PI * 1318.5 * t) +
      0.3 * Math.sin(2 * Math.PI * 1760 * t);
    return tone * env(t, 0.005, 0.35);
  });
  const delays = [0.11, 0.17, 0.23];
  const wet = Float32Array.from(dry);
  delays.forEach((d, k) => {
    const off = Math.floor(d * SR);
    for (let i = off; i < wet.length; i++) wet[i] += dry[i - off] * 0.35 / (k + 1);
  });
  writeWav("chime.wav", wet);
}
