import { test, expect } from "@playwright/test";
import { setupPage, CalculatorHelpers, MemoryHelpers } from "../test-utils";

test.beforeEach(async ({ page }) => {
	await setupPage(page);
});

test.describe("Memory Operations", () => {
	test.describe("Memory In (Min)", () => {
		test("memory-in button forces calculation", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const memory = new MemoryHelpers(page);
			
			await page.getByRole("textbox").fill("5*5");
			await page.getByRole("button", { name: "Min" }).click();
			expect(await calc.getExpression()).toBe("5 × 5");
			await expect(calc.getResult()).toHaveText("25");
		});

		test("memory-in button sets memory", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const memory = new MemoryHelpers(page);
			
			await memory.storeInMemory("5*5");
			expect(await calc.getExpression()).toBe("5 × 5");
			await expect(calc.getResult()).toHaveText("25");

			await calc.clear();
			expect(await calc.getExpression()).toBe("");

			await memory.recallMemory();
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("M");
			await expect(calc.getResult()).toHaveText("25");
		});

		test("memory-in button does not re-calculate", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const memory = new MemoryHelpers(page);
			
			await memory.storeInMemory("5*5");
			expect(await calc.getExpression()).toBe("5 × 5");
			await expect(calc.getResult()).toHaveText("25");

			await calc.clear();
			expect(await calc.getExpression()).toBe("");

			await calc.calculate("5*5+M", "button");
			expect(await calc.getExpression()).toBe("5 × 5 + M");
			await expect(calc.getResult()).toHaveText("50");

			// Click Min multiple times
			await page.getByRole("button", { name: "Min" }).click();
			await page.getByRole("button", { name: "Min" }).click();
			await page.getByRole("button", { name: "Min" }).click();
			await page.getByRole("button", { name: "Min" }).click();
			await page.getByRole("button", { name: "Min" }).click();

			await calc.clear();
			expect(await calc.getExpression()).toBe("");

			await calc.calculate("M", "button");
			expect(await calc.getExpression()).toBe("M");
			await expect(calc.getResult()).toHaveText("50");
		});
	});

	test.describe("Answer Memory (ANS)", () => {
		test("answer-memory works", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const memory = new MemoryHelpers(page);
			
			await calc.calculate("5*5", "button");
			expect(await calc.getExpression()).toBe("5 × 5");
			await expect(calc.getResult()).toHaveText("25");

			await calc.clear();
			expect(await calc.getExpression()).toBe("");

			await page.getByRole("textbox").fill("5*5+");
			await memory.useAnswer();
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("5 × 5 + ANS");
			await expect(calc.getResult()).toHaveText("50");

			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("5 × 5 + ANS");
			await expect(calc.getResult()).toHaveText("75");

			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("5 × 5 + ANS");
			await expect(calc.getResult()).toHaveText("100");
		});

		test("ANS persists across calculations", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const memory = new MemoryHelpers(page);
			
			// First calculation
			await calc.calculate("10*2", "button");
			await expect(calc.getResult()).toHaveText("20");

			// Second calculation using ANS
			await calc.clear();
			await memory.useAnswer();
			await page.getByRole("textbox").fill("ANS+5");
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("ANS + 5");
			await expect(calc.getResult()).toHaveText("25");

			// Third calculation using updated ANS
			await calc.clear();
			await memory.useAnswer();
			await page.getByRole("textbox").fill("ANS*2");
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("ANS × 2");
			await expect(calc.getResult()).toHaveText("50");
		});
	});

	test.describe("Memory Clearing", () => {
		test("C button does not clear memory", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const memory = new MemoryHelpers(page);
			
			await memory.storeInMemory("42");
			await calc.clear(); // C button, not AC
			
			// Memory should still be available
			await memory.recallMemory();
			await page.getByRole("button", { name: "=" }).click();
			expect(await calc.getExpression()).toBe("M");
			await expect(calc.getResult()).toHaveText("42");
		});
	});

	test.describe("Memory and ANS Interaction", () => {
		test("can use both M and ANS in same expression", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const memory = new MemoryHelpers(page);
			
			// Store 10 in memory
			await memory.storeInMemory("10");
			
			// Create an ANS value of 5
			await calc.clear();
			await calc.calculate("5", "button");
			
			// Use both M and ANS
			await calc.clear();
			await calc.calculate("M + ANS", "button");
			expect(await calc.getExpression()).toBe("M + ANS");
			await expect(calc.getResult()).toHaveText("15");
		});

		test("memory operations work with complex expressions", async ({ page }) => {
			const calc = new CalculatorHelpers(page);
			const memory = new MemoryHelpers(page);
			
			// Store complex calculation result
			await memory.storeInMemory("(3+4)*5");
			expect(await calc.getExpression()).toBe("(3 + 4) × 5");
			await expect(calc.getResult()).toHaveText("35");
			
			// Use memory in another complex expression
			await calc.clear();
			await calc.calculate("M/7+2", "button");
			expect(await calc.getExpression()).toBe("M / 7 + 2");
			await expect(calc.getResult()).toHaveText("7"); // 35/7 + 2 = 5 + 2 = 7
		});
	});
});
