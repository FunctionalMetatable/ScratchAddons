import { defineConfig } from "rollup";

import pluginJSON from "@rollup/plugin-json";
import pluginDynamicImport from "@rollup/plugin-dynamic-import-vars";

export default defineConfig({
  input: {
    cs: "content-scripts/new-cs.js",
  },
  output: {
    dir: "dist",
  },
  plugins: [pluginJSON(), pluginDynamicImport()],
});
