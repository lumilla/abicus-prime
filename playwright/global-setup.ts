import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
	const browser = await chromium.launch();
	const page = await browser.newPage();

	// Set language to English for all tests
	await page.addInitScript(() => {
		localStorage.setItem("abicus-language", "en");
	});

	await browser.close();
}

export default globalSetup;
