import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import tsconfigPaths from "vite-tsconfig-paths";
import * as child from "child_process";
import { readFileSync } from "fs";
import { resolve } from "path";

const commitHash = process.env.GIT_HASH || child.execSync("git rev-parse HEAD").toString().trim();
const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf-8"));
const appVersion = packageJson.version;

export default defineConfig({
	plugins: [tsconfigPaths(), preact()],

	resolve: {
		alias: {
			"@icons": resolve(__dirname, "src/assets/icons"),
		},
	},

	define: {
		"__GIT_HASH__": JSON.stringify(commitHash),
		"__APP_VERSION__": JSON.stringify(appVersion),
		// Define these as false to help tree-shaking
		"process.env.NODE_ENV": JSON.stringify("production"),
	},

	build: {
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				pure_funcs: ["console.log", "console.info", "console.debug"],
			},
			mangle: {
				toplevel: true,
			},
			format: {
				comments: false,
			},
		},
		rollupOptions: {
			output: {
				manualChunks: {
					decimal: ["decimal.js"],
					utils: ["clsx", "neverthrow", "ts-pattern"],
				},
			},
		},
		target: "es2020",
		chunkSizeWarningLimit: 1000,
		cssCodeSplit: true,
		cssMinify: true,
		reportCompressedSize: true,
		sourcemap: false,
	},

	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			ignored: ["**/src-tauri/**"],
		},
	},
});
