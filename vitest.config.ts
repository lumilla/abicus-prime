/// <reference types="vitest" />
import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths(), preact()],
	test: {
		globals: true,
		exclude: ["playwright/**", "**/node_modules/**"],
	},
});
