import { access, cp, mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Ship the pinned model and runtime with the app; audio never leaves the device.
const require = createRequire(import.meta.url);
const destination = fileURLToPath(new URL('../public/transcription-models/', import.meta.url));
const basicPitch = dirname(require.resolve('@spotify/basic-pitch/package.json'));
const wasm = dirname(require.resolve('@tensorflow/tfjs-backend-wasm/package.json'));
await mkdir(destination, { recursive: true });
async function copyIfMissing(source, target, recursive = false) {
  try {
    await access(target);
  } catch {
    await cp(source, target, { recursive, errorOnExist: false, force: false });
  }
}

const modelDestination = join(destination, 'basic-pitch');
await mkdir(modelDestination, { recursive: true });
const sourceManifest = JSON.parse(await readFile(join(basicPitch, 'model/model.json'), 'utf8'));
await copyIfMissing(join(basicPitch, 'model/model.json'), join(modelDestination, 'model.json'));
for (const group of sourceManifest.weightsManifest) {
  for (const asset of group.paths) await copyIfMissing(join(basicPitch, 'model', asset), join(modelDestination, asset));
}
await copyIfMissing(join(basicPitch, 'LICENSE'), join(destination, 'basic-pitch/LICENSE'));
await mkdir(join(destination, 'wasm'), { recursive: true });
for (const name of ['tfjs-backend-wasm.wasm', 'tfjs-backend-wasm-simd.wasm', 'tfjs-backend-wasm-threaded-simd.wasm']) {
  await copyIfMissing(join(wasm, 'dist', name), join(destination, 'wasm', name));
}
const manifest = JSON.parse(await readFile(join(modelDestination, 'model.json'), 'utf8'));
for (const group of manifest.weightsManifest) {
  for (const asset of group.paths) await readFile(join(destination, 'basic-pitch', asset));
}
console.log('Local transcription model and WASM assets prepared.');
