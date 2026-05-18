// Node/esbuild build: bundles widget/src/index.ts → public/widget.js
// Replaces the bun-based build.ts so it runs on Vercel's build image.
//
// Supabase URL + anon key are inlined at build time so the widget can open a
// Realtime WebSocket directly from the embed host (no extra round trip to
// fetch config). Both are public values — the anon key ships to every browser
// already; RLS guards data access.
import * as esbuild from "esbuild";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
// realtime-js wants a wss:// URL; supabase-js normally rewrites for you.
const realtimeUrl = supabaseUrl
  ? supabaseUrl.replace(/^http/, "ws") + "/realtime/v1"
  : "";

await esbuild.build({
  entryPoints: ["./widget/src/index.ts"],
  outfile: "./public/widget.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2019"],
  platform: "browser",
  sourcemap: "external",
  define: {
    __SUPABASE_REALTIME_URL__: JSON.stringify(realtimeUrl),
    __SUPABASE_ANON_KEY__: JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""),
  },
});

console.log("✓ Widget built → public/widget.js");
console.log(
  realtimeUrl
    ? `  realtime: ${realtimeUrl}`
    : "  realtime: DISABLED (no NEXT_PUBLIC_SUPABASE_URL at build time)",
);
