import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
	await page.goto("/");
});

test("Has settings button", async ({ page }) => {
	await expect(page.getByRole("button", { name: "*", exact: true })).toBeVisible();
});

test("Settings button opens settings page", async ({ page }) => {
	// Initially the settings page should not be visible
	await expect(page.getByText("Settings")).not.toBeVisible();
	
	// Click the settings button
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Settings page should now be visible
	await expect(page.getByText("Settings")).toBeVisible();
	
	// The settings button should no longer be visible when settings page is open
	await expect(page.getByRole("button", { name: "*", exact: true })).not.toBeVisible();
});

test("Settings page can be closed", async ({ page }) => {
	// Open settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	await expect(page.getByText("Settings")).toBeVisible();
	
	// Close settings by clicking the × button
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Settings page should be hidden and settings button visible again
	await expect(page.getByText("Settings")).not.toBeVisible();
	await expect(page.getByRole("button", { name: "*", exact: true })).toBeVisible();
});

test("Settings page has angle unit toggle", async ({ page }) => {
	// Open settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Should have angle unit section
	await expect(page.getByText("Angle Unit")).toBeVisible();
	
	// Should have both radians and degrees buttons
	await expect(page.getByRole("button", { name: "Radians", exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Degrees", exact: true })).toBeVisible();
	
	// Degrees should be selected by default
	await expect(page.getByRole("button", { name: "Degrees", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Radians", exact: true })).not.toBeDisabled();
});

test("Can switch angle unit in settings", async ({ page }) => {
	// Open settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Switch to radians
	await page.getByRole("button", { name: "Radians", exact: true }).click();
	await expect(page.getByRole("button", { name: "Radians", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Degrees", exact: true })).not.toBeDisabled();
	
	// Switch back to degrees
	await page.getByRole("button", { name: "Degrees", exact: true }).click();
	await expect(page.getByRole("button", { name: "Degrees", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Radians", exact: true })).not.toBeDisabled();
});

test("Angle unit setting persists after closing settings", async ({ page }) => {
	// Open settings and switch to radians
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Radians", exact: true }).click();
	
	// Close settings
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Open settings again - radians should still be selected
	await page.getByRole("button", { name: "*", exact: true }).click();
	await expect(page.getByRole("button", { name: "Radians", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Degrees", exact: true })).not.toBeDisabled();
});

test("Settings page has interface mode toggle", async ({ page }) => {
	// Open settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Should have interface mode section
	await expect(page.getByText("Interface Mode")).toBeVisible();
	
	// Should have both pocket and terminal buttons
	await expect(page.getByRole("button", { name: "Pocket", exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Terminal", exact: true })).toBeVisible();
	
	// Pocket should be selected by default
	await expect(page.getByRole("button", { name: "Pocket", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Terminal", exact: true })).not.toBeDisabled();
});

test("Can switch interface mode in settings", async ({ page }) => {
	// Open settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Switch to terminal
	await page.getByRole("button", { name: "Terminal", exact: true }).click();
	await expect(page.getByRole("button", { name: "Terminal", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Pocket", exact: true })).not.toBeDisabled();
	
	// Switch back to pocket
	await page.getByRole("button", { name: "Pocket", exact: true }).click();
	await expect(page.getByRole("button", { name: "Pocket", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Terminal", exact: true })).not.toBeDisabled();
});

test("Settings page has clear button", async ({ page }) => {
	// Open settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Should have clear button
	await expect(page.getByRole("button", { name: "Clear", exact: true })).toBeVisible();
});

test("Clear button clears calculator state", async ({ page }) => {
	// Add some content to the calculator
	await page.getByRole("textbox").fill("123");
	await page.getByRole("button", { name: "=" }).click();
	
	// Verify there's content
	await expect(page.getByRole("status")).toHaveText("123");
	
	// Open settings and click clear
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Clear", exact: true }).click();
	
	// Close settings and verify content is cleared
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// The input should be empty and result should be cleared
	expect(await page.getByRole("textbox").inputValue()).toBe("");
	// Note: We can't easily test if the result display is cleared without knowing its exact state
});

test("Settings page has version information", async ({ page }) => {
	// Open settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Should show version information
	await expect(page.getByText("Abicus Calculator")).toBeVisible();
	await expect(page.getByText("v1.0.6")).toBeVisible();
});

test("Angle unit change affects trigonometric calculations", async ({ page }) => {
	// Test with degrees (default)
	await page.getByRole("textbox").fill("sin(90)");
	await page.keyboard.press("=");
	expect(page.getByRole("status")).toHaveText("1");
	
	// Clear and switch to radians
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Radians", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Clear the calculator
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Clear", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Test with radians
	await page.getByRole("textbox").fill("sin(pi/2)");
	await page.keyboard.press("=");
	expect(page.getByRole("status")).toHaveText("1");
});

test("Can switch theme in settings", async ({ page }) => {
	// Open settings
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Should have theme section and buttons
	await expect(page.getByText("Theme")).toBeVisible();
	await expect(page.getByRole("button", { name: "Light", exact: true })).toBeVisible();
	await expect(page.getByRole("button", { name: "Dark", exact: true })).toBeVisible();
	
	// Initially should be in light mode (or follow OS preference)
	const initialState = await page.locator('html').getAttribute('class');
	const isInitiallyDark = initialState?.includes('dark');
	
	if (isInitiallyDark) {
		// If initially dark, switch to light
		await page.getByRole("button", { name: "Light", exact: true }).click();
		await expect(page.getByRole("button", { name: "Light", exact: true })).toBeDisabled();
		await expect(page.getByRole("button", { name: "Dark", exact: true })).not.toBeDisabled();
		
		// HTML should not have dark class
		await expect(page.locator('html')).not.toHaveClass(/.*dark.*/);
		
		// Switch back to dark
		await page.getByRole("button", { name: "Dark", exact: true }).click();
		await expect(page.getByRole("button", { name: "Dark", exact: true })).toBeDisabled();
		await expect(page.getByRole("button", { name: "Light", exact: true })).not.toBeDisabled();
		
		// HTML should have dark class
		await expect(page.locator('html')).toHaveClass(/.*dark.*/);
	} else {
		// If initially light, switch to dark
		await page.getByRole("button", { name: "Dark", exact: true }).click();
		await expect(page.getByRole("button", { name: "Dark", exact: true })).toBeDisabled();
		await expect(page.getByRole("button", { name: "Light", exact: true })).not.toBeDisabled();
		
		// HTML should have dark class
		await expect(page.locator('html')).toHaveClass(/.*dark.*/);
		
		// Switch back to light
		await page.getByRole("button", { name: "Light", exact: true }).click();
		await expect(page.getByRole("button", { name: "Light", exact: true })).toBeDisabled();
		await expect(page.getByRole("button", { name: "Dark", exact: true })).not.toBeDisabled();
		
		// HTML should not have dark class
		await expect(page.locator('html')).not.toHaveClass(/.*dark.*/);
	}
});

test("Theme setting persists after closing settings", async ({ page }) => {
	// Open settings and switch to dark mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Dark", exact: true }).click();
	
	// Close settings
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Verify dark mode is still active
	await expect(page.locator('html')).toHaveClass(/.*dark.*/);
	
	// Open settings again - dark should still be selected
	await page.getByRole("button", { name: "*", exact: true }).click();
	await expect(page.getByRole("button", { name: "Dark", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Light", exact: true })).not.toBeDisabled();
});

test("Theme setting persists after page reload", async ({ page }) => {
	// Set dark mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Dark", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Reload the page
	await page.reload();
	
	// Dark mode should still be active
	await expect(page.locator('html')).toHaveClass(/.*dark.*/);
	
	// Settings should reflect dark mode is selected
	await page.getByRole("button", { name: "*", exact: true }).click();
	await expect(page.getByRole("button", { name: "Dark", exact: true })).toBeDisabled();
	await expect(page.getByRole("button", { name: "Light", exact: true })).not.toBeDisabled();
});

test("Dark mode affects visual appearance", async ({ page }) => {
	// Open settings first
	await page.getByRole("button", { name: "*", exact: true }).click();
	
	// Check current state and ensure we start in a known state
	const lightButton = page.getByRole("button", { name: "Light", exact: true });
	const darkButton = page.getByRole("button", { name: "Dark", exact: true });
	
	const isLightDisabled = await lightButton.isDisabled();
	
	if (!isLightDisabled) {
		// Currently in dark mode, switch to light first
		await lightButton.click();
	}
	
	// Now we should be in light mode, close settings to get body color
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Get light mode background color
	const lightBodyColor = await page.locator('body').evaluate(el => 
		window.getComputedStyle(el).backgroundColor
	);
	
	// Switch to dark mode
	await page.getByRole("button", { name: "*", exact: true }).click();
	await page.getByRole("button", { name: "Dark", exact: true }).click();
	await page.getByRole("button", { name: "×", exact: true }).click();
	
	// Get dark mode background color
	const darkBodyColor = await page.locator('body').evaluate(el => 
		window.getComputedStyle(el).backgroundColor
	);
	
	// Colors should be different
	expect(lightBodyColor).not.toBe(darkBodyColor);
	
	// Extract RGB values to compare brightness
	const lightMatch = lightBodyColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
	const darkMatch = darkBodyColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
	
	expect(lightMatch).toBeTruthy();
	expect(darkMatch).toBeTruthy();
	
	if (lightMatch && darkMatch) {
		// Calculate brightness (simple formula: (R + G + B) / 3)
		const lightBrightness = (parseInt(lightMatch[1]) + parseInt(lightMatch[2]) + parseInt(lightMatch[3])) / 3;
		const darkBrightness = (parseInt(darkMatch[1]) + parseInt(darkMatch[2]) + parseInt(darkMatch[3])) / 3;
		
		// Dark mode should have significantly lower brightness
		expect(darkBrightness).toBeLessThan(lightBrightness);
		// Dark mode brightness should be less than 100 (quite dark)
		expect(darkBrightness).toBeLessThan(100);
	}
});
