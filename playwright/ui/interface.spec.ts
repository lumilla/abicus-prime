import { test, expect } from "@playwright/test";
import { setupPage, expectButtonsVisible, SettingsHelpers } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
});

test.describe("Calculator Interface", () => {
	test.describe("Button Visibility", () => {
		test("has trigonometric buttons", async ({ page }) => {
			await expectButtonsVisible(page, ["sin", "cos", "tan", "arcsin", "arccos", "arctan"]);
		});

		test("has digit buttons", async ({ page }) => {
			await expectButtonsVisible(page, [..."0123456789"]);
		});

		test("has constant buttons", async ({ page }) => {
			await expectButtonsVisible(page, ["π", "e"]);
		});

		test("has decimal, operator, and bracket buttons", async ({ page }) => {
			await expectButtonsVisible(page, [...",+−×/()"]);
		});

		test("has memory buttons", async ({ page }) => {
			await expectButtonsVisible(page, ["Min", "Mout", "ANS"]);
		});

		test("has logarithm buttons", async ({ page }) => {
			await expectButtonsVisible(page, ["log", "ln"]);
		});

		test("has exponent and root buttons", async ({ page }) => {
			await expectButtonsVisible(page, ["x2", "xy", "n√", "√"]);
		});

		test("has factorial button", async ({ page }) => {
			await expectButtonsVisible(page, ["!"]);
		});

		test("has del, clear, and calculate buttons", async ({ page }) => {
			await expectButtonsVisible(page, ["⌫", "AC", "="]);
		});
	});

	test.describe("Settings Page", () => {
		test("has settings button", async ({ page }) => {
			await expect(page.getByRole("button", { name: "*", exact: true })).toBeVisible();
		});

		test("settings button opens and closes settings page", async ({ page }) => {
			const settings = new SettingsHelpers(page);

			// Initially settings should not be visible
			await expect(page.getByText("Settings")).not.toBeVisible();

			// Open settings
			await settings.open();
			await expect(page.getByText("Settings")).toBeVisible();
			await expect(page.getByRole("button", { name: "*", exact: true })).not.toBeVisible();

			// Close settings
			await settings.close();
			await expect(page.getByText("Settings")).not.toBeVisible();
			await expect(page.getByRole("button", { name: "*", exact: true })).toBeVisible();
		});

		test.describe("Angle Unit Settings", () => {
			test("has angle unit toggle with degrees as default", async ({ page }) => {
				const settings = new SettingsHelpers(page);
				await settings.open();

				await expect(page.getByText("Angle Unit")).toBeVisible();
				await expect(page.getByRole("button", { name: "Radians", exact: true })).toBeVisible();
				await expect(page.getByRole("button", { name: "Degrees", exact: true })).toBeVisible();

				// Degrees should be selected by default
				expect(await settings.isDegreesSelected()).toBe(true);
				expect(await settings.isRadiansSelected()).toBe(false);
			});

			test("can switch angle unit in settings", async ({ page }) => {
				const settings = new SettingsHelpers(page);
				await settings.open();

				// Switch to radians
				await settings.setRadians();
				expect(await settings.isRadiansSelected()).toBe(true);
				expect(await settings.isDegreesSelected()).toBe(false);

				// Switch back to degrees
				await settings.setDegrees();
				expect(await settings.isDegreesSelected()).toBe(true);
				expect(await settings.isRadiansSelected()).toBe(false);
			});

			test("angle unit setting persists after closing settings", async ({ page }) => {
				const settings = new SettingsHelpers(page);
				
				// Open settings and switch to radians
				await settings.open();
				await settings.setRadians();
				await settings.close();

				// Open settings again - radians should still be selected
				await settings.open();
				expect(await settings.isRadiansSelected()).toBe(true);
				expect(await settings.isDegreesSelected()).toBe(false);
			});
		});

		test.describe("Interface Mode Settings", () => {
			test("has interface mode toggle with pocket as default", async ({ page }) => {
				const settings = new SettingsHelpers(page);
				await settings.open();

				await expect(page.getByText("Interface Mode")).toBeVisible();
				await expect(page.getByRole("button", { name: "Pocket", exact: true })).toBeVisible();
				await expect(page.getByRole("button", { name: "Terminal", exact: true })).toBeVisible();

				// Pocket should be selected by default
				await expect(page.getByRole("button", { name: "Pocket", exact: true })).toBeDisabled();
				await expect(page.getByRole("button", { name: "Terminal", exact: true })).not.toBeDisabled();
			});

			test("can switch interface mode in settings", async ({ page }) => {
				const settings = new SettingsHelpers(page);
				await settings.open();

				// Switch to terminal mode
				await settings.setTerminalMode();
				await expect(page.getByRole("button", { name: "Terminal", exact: true })).toBeDisabled();
				await expect(page.getByRole("button", { name: "Pocket", exact: true })).not.toBeDisabled();

				// Switch back to pocket mode
				await settings.setPocketMode();
				await expect(page.getByRole("button", { name: "Pocket", exact: true })).toBeDisabled();
				await expect(page.getByRole("button", { name: "Terminal", exact: true })).not.toBeDisabled();
			});

			test("interface mode setting persists after closing settings", async ({ page }) => {
				const settings = new SettingsHelpers(page);
				
				// Open settings and switch to terminal mode
				await settings.open();
				await settings.setTerminalMode();
				await settings.close();

				// Open settings again - terminal should still be selected
				await settings.open();
				await expect(page.getByRole("button", { name: "Terminal", exact: true })).toBeDisabled();
				await expect(page.getByRole("button", { name: "Pocket", exact: true })).not.toBeDisabled();
			});
		});
	});
});
