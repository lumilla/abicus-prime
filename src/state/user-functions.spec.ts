import Decimal from "decimal.js";
import { calculate } from "#/calculator";
import {
	parseConstantDefinition,
	expandUserConstants,
	parseFunctionDefinition,
	UserConstantsMap,
	UserFunctionsMap,
} from "./user-functions";

// ---------------------------------------------------------------------------
// parseConstantDefinition
// ---------------------------------------------------------------------------

describe("parseConstantDefinition", () => {
	describe("Valid definitions", () => {
		test("simple constant", () => {
			expect(parseConstantDefinition("tau=2*pi")).toEqual({ name: "tau", body: "2*pi" });
		});
		test("strips whitespace", () => {
			expect(parseConstantDefinition("tau = 2 * pi")).toEqual({ name: "tau", body: "2*pi" });
		});
		test("single-letter constant", () => {
			expect(parseConstantDefinition("g=9.81")).toEqual({ name: "g", body: "9.81" });
		});
		test("underscore in name", () => {
			expect(parseConstantDefinition("my_const=42")).toEqual({ name: "my_const", body: "42" });
		});
		test("body can contain expressions", () => {
			expect(parseConstantDefinition("phi=(1+sqrt(5))/2")).toEqual({ name: "phi", body: "(1+sqrt(5))/2" });
		});
	});

	describe("Invalid / reserved", () => {
		test("returns null for function definition syntax", () => {
			// f(x)=2*x should not match (has parentheses before =)
			expect(parseConstantDefinition("f(x)=2*x")).toBeNull();
		});
		test("returns null for reserved name pi", () => {
			expect(parseConstantDefinition("pi=3")).toBeNull();
		});
		test("returns null for reserved name e", () => {
			expect(parseConstantDefinition("e=2.71")).toBeNull();
		});
		test("returns null for reserved name sin", () => {
			expect(parseConstantDefinition("sin=1")).toBeNull();
		});
		test("returns null for reserved name ans", () => {
			expect(parseConstantDefinition("ans=5")).toBeNull();
		});
		test("returns null for bare expression (no =)", () => {
			expect(parseConstantDefinition("2+3")).toBeNull();
		});
		test("returns null for empty body", () => {
			expect(parseConstantDefinition("tau=")).toBeNull();
		});
		test("returns null for name starting with digit", () => {
			expect(parseConstantDefinition("2x=5")).toBeNull();
		});
	});
});

// ---------------------------------------------------------------------------
// expandUserConstants
// ---------------------------------------------------------------------------

describe("expandUserConstants", () => {
	function makeConstants(entries: [string, string][]): UserConstantsMap {
		return new Map(entries.map(([name, body]) => [name, { name, body }]));
	}

	test("returns expression unchanged when map is empty", () => {
		expect(expandUserConstants("2+3", new Map())).toBe("2+3");
	});

	test("substitutes a simple constant", () => {
		const constants = makeConstants([["tau", "2*pi"]]);
		expect(expandUserConstants("tau*3", constants)).toBe("(2*pi)*3");
	});

	test("does not match as substring (word boundary)", () => {
		const constants = makeConstants([["a", "5"]]);
		// 'ans' should NOT be expanded even though it contains 'a'
		expect(expandUserConstants("ans", constants)).toBe("ans");
	});

	test("multi-pass: constant depending on another constant", () => {
		const constants = makeConstants([
			["a", "2"],
			["b", "3*a"],
		]);
		// b becomes 3*a, then a becomes 2 results in 3*(2)
		const result = expandUserConstants("b+1", constants);
		expect(result).toBe("(3*(2))+1");
	});

	test("returns null on circular reference", () => {
		const constants = makeConstants([
			["a", "b+1"],
			["b", "a+1"],
		]);
		expect(expandUserConstants("a", constants)).toBeNull();
	});

	test("multiple constants in one expression", () => {
		const constants = makeConstants([
			["tau", "2*pi"],
			["g", "9.81"],
		]);
		const result = expandUserConstants("tau+g", constants);
		expect(result).toBe("(2*pi)+(9.81)");
	});
});

// ---------------------------------------------------------------------------
// Integration: calculate() with user constants
// ---------------------------------------------------------------------------

describe("calculate() with user constants", () => {
	const ans = new Decimal(0);
	const ind = new Decimal(0);

	function makeConstants(entries: [string, string][]): UserConstantsMap {
		return new Map(entries.map(([name, body]) => [name, { name, body }]));
	}

	test("tau = 2*pi evaluates correctly", () => {
		const constants = makeConstants([["tau", "2*pi"]]);
		const result = calculate("tau", ans, ind, "rad", undefined, constants);
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.toNumber()).toBeCloseTo(2 * Math.PI);
		}
	});

	test("constant used in expression", () => {
		const constants = makeConstants([["g", "9.81"]]);
		const result = calculate("g*2", ans, ind, "rad", undefined, constants);
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.toNumber()).toBeCloseTo(19.62);
		}
	});

	test("constant referencing another constant", () => {
		const constants = makeConstants([
			["a", "3"],
			["b", "a*a"],
		]);
		const result = calculate("b", ans, ind, "rad", undefined, constants);
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.toNumber()).toBe(9);
		}
	});

	test("function body can use a user constant", () => {
		const constants = makeConstants([["tau", "2*pi"]]);
		const functions: UserFunctionsMap = new Map([["circum", { name: "circum", params: ["r"], body: "tau*r" }]]);
		const result = calculate("circum(5)", ans, ind, "rad", functions, constants);
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.toNumber()).toBeCloseTo(2 * Math.PI * 5);
		}
	});

	test("circular constants return an error", () => {
		const constants = makeConstants([
			["a", "b"],
			["b", "a"],
		]);
		const result = calculate("a", ans, ind, "rad", undefined, constants);
		expect(result.isErr()).toBe(true);
	});

	test("golden ratio constant", () => {
		const constants = makeConstants([["phi", "(1+sqrt(5))/2"]]);
		const result = calculate("phi", ans, ind, "rad", undefined, constants);
		expect(result.isOk()).toBe(true);
		if (result.isOk()) {
			expect(result.value.toNumber()).toBeCloseTo(1.6180339887);
		}
	});
});

// ---------------------------------------------------------------------------
// Interaction: constants + parseFunctionDefinition (should be independent)
// ---------------------------------------------------------------------------

describe("parseConstantDefinition vs parseFunctionDefinition", () => {
	test("f(x)=2*x is a function, not a constant", () => {
		expect(parseConstantDefinition("f(x)=2*x")).toBeNull();
		expect(parseFunctionDefinition("f(x)=2*x")).not.toBeNull();
	});

	test("tau=2*pi is a constant, not a function", () => {
		expect(parseConstantDefinition("tau=2*pi")).not.toBeNull();
		expect(parseFunctionDefinition("tau=2*pi")).toBeNull();
	});
});
