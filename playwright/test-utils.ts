import { Page, expect } from "@playwright/test";

/**
 * Sets up the page with English language for consistent test experience
 */
export async function setupPage(page: Page) {
	// Set language to English for consistent test experience
	await page.addInitScript(() => {
		localStorage.setItem("abicus-language", "en");
	});
	await page.goto("/");
}

/**
 * Global setup function (moved from global-setup.ts)
 */
export async function globalSetup() {
	// The global setup is now handled by the setupPage function
	// which is called in beforeEach blocks
}

/**
 * Calculator interaction helpers
 */
export class CalculatorHelpers {
	constructor(private page: Page) {}

	/**
	 * Clicks a sequence of calculator buttons
	 */
	async clickButtons(buttonNames: string[]) {
		for (const buttonName of buttonNames) {
			await this.page.getByRole("button", { name: buttonName, exact: true }).click();
		}
	}

	/**
	 * Enters an expression and calculates the result
	 */
	async calculate(expression: string, method: "enter" | "equals" | "button" = "button") {
		await this.page.getByRole("textbox").fill(expression);

		switch (method) {
			case "enter":
				await this.page.keyboard.press("Enter");
				break;
			case "equals":
				await this.page.keyboard.press("=");
				break;
			case "button":
				await this.page.getByRole("button", { name: "=" }).click();
				break;
		}
	}

	/**
	 * Gets the current expression in the input field
	 */
	async getExpression(): Promise<string> {
		return await this.page.getByRole("textbox").inputValue();
	}

	/**
	 * Gets the current result
	 */
	getResult() {
		return this.page.getByRole("status");
	}

	/**
	 * Clears the calculator
	 */
	async clear() {
		await this.page.getByRole("button", { name: "C", exact: true }).click();
	}

	/**
	 * Clears all (AC button) - requires multiple C presses then AC appears
	 */
	async clearAll() {
		// Two C presses to reveal AC button
		await this.clear();
		await this.page.getByRole("button", { name: "AC", exact: true }).click();
	}

	/**
	 * Verifies calculation result
	 */
	async expectCalculation(expression: string, expectedResult: string, expectedDisplay?: string) {
		await this.calculate(expression);
		const rawDisplay = await this.getExpression();
		const normalize = (s: string) =>
			s
				.replaceAll("−", "-")
				.replaceAll("⋅", "*")
				.replaceAll("\u00A0", " ")
				.replace(/\s+/g, "");
		expect(normalize(rawDisplay)).toBe(normalize(expectedDisplay || expression));
		await expect(this.getResult()).toHaveText(expectedResult);
	}
}

/**
 * Settings page helpers
 */
export class SettingsHelpers {
	constructor(private page: Page) {}

	/**
	 * Opens the settings page
	 */
	async open() {
		await this.page.getByRole("button", { name: "Settings", exact: true }).click();
	} /**
	 * Closes the settings page
	 */
	async close() {
		await this.page.getByRole("button", { name: "×", exact: true }).click();
	}

	/**
	 * Switches to degrees mode
	 */
	async setDegrees() {
		await this.page.getByRole("button", { name: "Degrees", exact: true }).click();
	}

	/**
	 * Switches to radians mode
	 */
	async setRadians() {
		await this.page.getByRole("button", { name: "Radians", exact: true }).click();
	}

	/**
	 * Switches to pocket mode
	 */
	async setPocketMode() {
		await this.page.getByRole("button", { name: "Pocket", exact: true }).click();
	}

	/**
	 * Switches to terminal mode
	 */
	async setTerminalMode() {
		await this.page.getByRole("button", { name: "Terminal", exact: true }).click();
	}

	/**
	 * Checks if degrees is selected
	 */
	async isDegreesSelected(): Promise<boolean> {
		const degreesButton = this.page.getByRole("button", { name: "Degrees", exact: true });
		const isDisabled = await degreesButton.isDisabled();
		return isDisabled;
	}

	/**
	 * Checks if radians is selected
	 */
	async isRadiansSelected(): Promise<boolean> {
		const radiansButton = this.page.getByRole("button", { name: "Radians", exact: true });
		const isDisabled = await radiansButton.isDisabled();
		return isDisabled;
	}
}

/**
 * Terminal mode helpers
 */
export class TerminalHelpers {
	constructor(private page: Page) {}

	/**
	 * Gets the terminal input element
	 */
	getInput() {
		return this.page.locator('input[placeholder*="calculation"]');
	}

	/**
	 * Submits a calculation in terminal mode
	 */
	async submitCalculation(expression: string) {
		const input = this.getInput();
		await input.fill(expression);
		await input.press("Enter");
	}

	/**
	 * Expects a calculation result in terminal history
	 */
	async expectCalculationInHistory(expression: string, expectedResult: string) {
		await expect(this.page.locator(`text=${expression}`).first()).toBeVisible();
		await expect(this.page.locator(`text=${expectedResult}`).first()).toBeVisible();
	}

	/**
	 * Switches to terminal mode from pocket mode
	 */
	async switchToTerminalMode() {
		await this.page.getByRole("button", { name: "Settings", exact: true }).click();
		await this.page.getByRole("button", { name: "Terminal", exact: true }).click();
		await this.page.getByRole("button", { name: "×", exact: true }).click();
	}
}

/**
 * Selection helpers for text selection operations
 */
export class SelectionHelpers {
	constructor(private page: Page) {}

	/**
	 * Selects a range of text in the input field
	 */
	async selectRange(start: number, end: number) {
		const handle = this.page.getByRole("textbox");
		await handle.focus();
		await handle.evaluate(
			(el: HTMLInputElement, { start, end }) => {
				el.setSelectionRange(start, end);
			},
			{ start, end },
		);
	}

	/**
	 * Tests operator shortcuts with selection
	 */
	async testOperatorShortcut(options: {
		initialText: string;
		selectionStart: number;
		selectionEnd: number;
		operator: string;
		expectedResult: string;
		method?: "keyboard" | "button";
	}) {
		const { initialText, selectionStart, selectionEnd, operator, expectedResult, method = "keyboard" } = options;

		await this.page.getByRole("textbox").fill(initialText);
		await this.selectRange(selectionStart, selectionEnd);

		if (method === "keyboard") {
			await this.page.keyboard.press(operator);
		} else {
			await this.page.getByRole("button", { name: operator, exact: true }).click();
		}

		expect(await this.page.getByRole("textbox").inputValue()).toBe(expectedResult);
	}

	/**
	 * Tests function application with selection
	 */
	async testFunctionWithSelection(
		initialText: string,
		selectionStart: number,
		selectionEnd: number,
		functionName: string,
		expectedResult: string,
	) {
		await this.page.getByRole("textbox").fill(initialText);
		await this.selectRange(selectionStart, selectionEnd);
		await this.page.getByRole("button", { name: functionName, exact: true }).click();
		expect(await this.page.getByRole("textbox").inputValue()).toBe(expectedResult);
	}
}

/**
 * Button visibility helper
 */
export async function expectButtonsVisible(page: Page, buttonNames: string[]) {
	await Promise.all(buttonNames.map(name => expect(page.getByRole("button", { name, exact: true })).toBeVisible()));
}

/**
 * Memory operation helpers
 */
export class MemoryHelpers {
	constructor(private page: Page) {}

	/**
	 * Stores value in memory
	 */
	async storeInMemory(expression: string) {
		await this.page.getByRole("textbox").fill(expression);
		await this.page.getByRole("button", { name: "Min" }).click();
	}

	/**
	 * Recalls memory value
	 */
	async recallMemory() {
		await this.page.getByRole("button", { name: "Mout" }).click();
	}

	/**
	 * Uses ANS (answer) button
	 */
	async useAnswer() {
		await this.page.getByRole("button", { name: "ANS" }).click();
	}
}
