// Bun-compatible build script: bundles widget/src/index.ts → public/widget.js
// Run via: bun run build:widget  (package.json script)
//
// If you don't have Bun, you can run this with esbuild:
//   npx esbuild widget/src/index.ts --bundle --minify --format=iife --outfile=public/widget.js

import { build } from "bun";

const result = await build({
  entrypoints: ["./widget/src/index.ts"],
  outdir: "./public",
  naming: "widget.js",
  minify: true,
  target: "browser",
  format: "iife",
  sourcemap: "external",
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

console.log("✓ Widget built → public/widget.js");
