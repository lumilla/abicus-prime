import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./playwright",

	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : 2,
	reporter: "html",
	expect: {
		timeout: 5000,
	},

	use: {
		baseURL: "http://localhost:1420",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		actionTimeout: 5000,
		navigationTimeout: 10000,
	},

	webServer: {
		command: "npm run dev",
		port: 1420,
		reuseExistingServer: !process.env.CI,
	},

	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},

		{
			name: "firefox",
			use: { ...devices["Desktop Firefox"] },
		},

		{
			name: "webkit",
			use: { ...devices["Desktop Safari"] },
		},
	],
});
