import Decimal from "decimal.js";
import prettify from "#/utils/prettify-expression";
import { T, t } from "#/utils/tokens";

import tokenise, { Token } from "./tokeniser";

const { litr } = T;

function d(n: Decimal.Value) {
	return new Decimal(n);
}

run("Whitespace", [
	["2 + 3", [litr(2), t.add, litr(3)]],
	[" 2 + 3 ", [litr(2), t.add, litr(3)]],
]);

run("Literals", [
	["1234567890", [litr(1234567890)]],
	["1.234567890", [litr(1.23456789)]],
	["0.1234567890", [litr(0.123456789)]],
	["0.1000000000", [litr(0.1)]],
	["0.0000000000", [litr(0)]],
	["0,0000000000", [litr(0)]],
]);

run("Arbitrary precision", [
	["9007199254740992", [litr(d("9007199254740992"))]],
	["19007199254740992", [litr(d("19007199254740992"))]],
	[
		"0.00000000000000002220446049250313080847263336181640625",
		[litr(d("0.00000000000000002220446049250313080847263336181640625"))],
	],
]);

run("Disregard trailing zeros", [
	["0.1000", [litr(d("0.1"))]],
	[
		"0.000000000000000222044604925031308084726333618164062500000",
		[litr(d("0.0000000000000002220446049250313080847263336181640625"))],
	],
]);

run("Operators", [["2+3", [litr(2), t.add, litr(3)]]]);
run("Brackets", [["2+(3+4)", [litr(2), t.add, t.lbrk, litr(3), t.add, litr(4), t.rbrk]]]);
run("Semicolons", [["(8;3;2;1)", [t.lbrk, litr(8), t.semi, litr(3), t.semi, litr(2), t.semi, litr(1), t.rbrk]]]);
run("Functions", [["sin cos tan root fact", [t.sin, t.cos, t.tan, t.root, t.factFunc]]]);
run("Function power notation", [
	["sin^(-1)(1)", [t.asin, t.lbrk, litr(1), t.rbrk]],
	["cos^(-1)(1)", [t.acos, t.lbrk, litr(1), t.rbrk]],
	["tan^(-1)(1)", [t.atan, t.lbrk, litr(1), t.rbrk]],
	["sin^(2)(1)", [t.sin, t.lbrk, litr(1), t.rbrk, t.pow, litr(2)]],
]);
run("Superscript exponents", [
	["3⁴", [litr(3), t.pow, litr(4)]],
	["12⁴⁵", [litr(12), t.pow, litr(45)]],
	["(2+3)⁵", [t.lbrk, litr(2), t.add, litr(3), t.rbrk, t.pow, litr(5)]],
	["2⁻³", [litr(2), t.pow, t.sub, litr(3)]],
]);
run("Superscript grouping", [["5⁵⁺⁵", [litr(5), t.pow, t.lbrk, litr(5), t.add, litr(5), t.rbrk]]]);

run("Superscript bases", [["pi⁴", [t.pi, t.pow, litr(4)]]]);

test("isolated sign-only superscript produces lexical error", () => {
	const res = tokenise("2⁻");
	expect(res.isErr()).toBe(true);
});
run("Factorial", [
	["5!", [litr(5), t.fact]],
	["3!+4!", [litr(3), t.fact, t.add, litr(4), t.fact]],
	["(2+3)!", [t.lbrk, litr(2), t.add, litr(3), t.rbrk, t.fact]],
]);
run("Memory", [["ans mem", [t.ans, t.ind]]]);

function run(title: string, cases: [input: string, expected: Token[]][]) {
	describe(title, () => {
		for (const [input, expected] of cases) {
			const title = `"${input}" => ${prettify(expected)}`;

			const tokens = tokenise(input);
			if (tokens.isErr()) expect.unreachable(`Test case could not be tokenised: ${title}`);

			const result = prettify(tokens.value);
			const wanted = prettify(expected);

			test(title, () => expect(result).toEqual(wanted));
		}
	});
}
