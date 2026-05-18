// Node/esbuild build: bundles widget/src/index.ts → public/widget.js
// Replaces the bun-based build.ts so it runs on Vercel's build image.
import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["./widget/src/index.ts"],
  outfile: "./public/widget.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019"],
  platform: "browser",
  sourcemap: "external",
});

console.log("✓ Widget built → public/widget.js");
