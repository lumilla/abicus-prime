/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				"abi-blue-3": "#EDF6FE",
				"abi-blue-2": "#CCDFFD",
				"abi-blue-1": "#365488",
				"abi-lgrey": "#E5EAF1",
				"abi-dgrey": "#C5C5C5",
				// Dark mode variants
				"abi-dark-blue-3": "#1a2332",
				"abi-dark-blue-2": "#2d3748",
				"abi-dark-blue-1": "#7c9cc7",
				"abi-dark-lgrey": "#374151",
				"abi-dark-dgrey": "#6b7280",
			},
		},
	},
	plugins: [],
};
