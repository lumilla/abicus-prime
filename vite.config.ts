/// <reference types="vite/client" />
/// <reference types="vitest" />

import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import * as child from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

const commitHash = process.env.GIT_HASH || child.execSync("git rev-parse HEAD").toString();
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf-8"));
const appVersion = packageJson.version;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [
		tsconfigPaths(),
		preact({
			babel: {
				plugins: [
					/** See `./src/_clsx-jsx.d.ts` for more details on these two plugins */
					["transform-jsx-classnames", { attributes: ["x"] }],
					["babel-plugin-rename-jsx-attribute", { attributes: { x: "className" } }],
				],
			},
		}),
	],

	define: {
		__GIT_HASH__: JSON.stringify(commitHash),
		__APP_VERSION__: JSON.stringify(appVersion),
	},

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ["**/src-tauri/**"],
		},
	},
	test: {
		globals: true,
		exclude: ["**/playwright/**", "**/node_modules/**"],
	},
}));
