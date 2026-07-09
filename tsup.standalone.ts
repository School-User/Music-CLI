import { defineConfig } from "tsup";
import path from "node:path";
import { createRequire } from "node:module";

// Standalone build: bundle the app AND all its dependencies into one file that
// runs on Node with nothing else beside it (no node_modules, no npm). The
// release workflow publishes it to GitHub Releases so it can be installed with
// a single curl. The regular tsup.config.ts (external deps) still drives the
// npm package build.

const pkg = createRequire(import.meta.url)("./package.json") as {
  version: string;
};

export default defineConfig({
  entry: { "music-cli": "src/index.tsx" },
  format: ["esm"],
  target: "node22",
  platform: "node",
  // Pull every dependency into the single file.
  noExternal: [/.*/],
  // Node builtins are dynamically required by a few deps; ESM output has no
  // `require`, so give it a real one. Also bake in the version, since there is
  // no package.json next to the bundle to read at runtime.
  banner: {
    js: "#!/usr/bin/env node\nimport{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);",
  },
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  outDir: "dist-standalone",
  clean: true,
  sourcemap: false,
  dts: false,
  splitting: false,
  shims: false,
  minify: true,
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
    // Ink imports react-devtools-core only via a dev-only guarded dynamic
    // import; alias it to an empty stub so it never enters the bundle.
    options.alias = {
      "react-devtools-core": path.resolve("scripts/devtools-stub.js"),
    };
  },
});
