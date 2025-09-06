// Additional bundle optimization suggestions

// 1. Use smaller alternative to decimal.js if possible
// Consider: big.js (6kB vs 32kB) or implement precision math for your specific use cases

// 2. Tree-shake ts-pattern imports more aggressively
// Instead of: import { match, P } from "ts-pattern"
// Use: import match from "ts-pattern/match"

// 3. Consider replacing clsx with a smaller alternative
// clsx: ~1kB, consider writing a simple utility for your use case

// 4. Evaluate neverthrow usage
// If you're only using basic Result types, consider a lighter alternative

// 5. Font optimization
// Your Jost font is 17.8kB - consider using system fonts or a lighter subset
