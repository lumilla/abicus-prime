import { options } from "preact";
import clsx from "clsx";

// Preserve any previous vnode hook
const prev = options.vnode;

options.vnode = (vnode: any) => {
	try {
		if (vnode && vnode.props && vnode.props.x != null) {
			const x = vnode.props.x;

			// Compute class string via clsx. Support arrays and primitives.
			const computed = Array.isArray(x) ? clsx(...x) : clsx(x);

			// Merge with existing class/className
			const existing = vnode.props.className || vnode.props.class;
			vnode.props.className = existing ? clsx(existing, computed) : computed;

			// Remove the x prop so it doesn't get passed through
			delete vnode.props.x;
		}
	} catch (e) {
		// Don't break rendering on unexpected values
		console.error("init-jsx: failed to process x attribute", e);
	}

	if (typeof prev === "function") prev(vnode);
};
