import Decimal from "decimal.js";
import { useState } from "preact/hooks";
import { loadString, saveString } from "#/utils/local-storage";

const STORAGE_KEY_IND = "abicus-memory-ind";
const STORAGE_KEY_ANS = "abicus-memory-ans";

function zero() {
	return new Decimal(0);
}

function loadFromStorage(key: string): Decimal {
	const stored = loadString(key);
	if (stored !== null) {
		try {
			return new Decimal(stored);
		} catch {
			// Ignore parse errors
		}
	}
	return zero();
}

function saveToStorage(key: string, value: Decimal) {
	saveString(key, value.toString());
}

export type MemoryHandle = ReturnType<typeof useMemory>;

export default function useMemory() {
	const [ind, setIndState] = useState(() => loadFromStorage(STORAGE_KEY_IND));
	const [ans, setAnsState] = useState(() => loadFromStorage(STORAGE_KEY_ANS));

	function setInd(value: Decimal) {
		setIndState(value);
		saveToStorage(STORAGE_KEY_IND, value);
	}

	function setAns(value: Decimal) {
		setAnsState(value);
		saveToStorage(STORAGE_KEY_ANS, value);
	}

	function empty() {
		setInd(zero());
		setAns(zero());
	}

	return {
		/** Value of the independent memory register */
		ind,
		/** Value of the answer memory register */
		ans,
		/** Set the value of the independent memory register */
		setInd,
		/** Set the value of the answer memory register */
		setAns,
		/** Clear all memory registers */
		empty,
	} as const;
}
