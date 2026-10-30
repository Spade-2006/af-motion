import { a as e, c as t, i as n, l as r, n as i, o as a, s as o, t as s } from "./scroll-velocity-oYVFWWY7.js";
import { createElement as c, useCallback as l, useEffect as u, useRef as d, useState as f } from "react";
// src/react.ts
var p = {
	velocity: 0,
	direction: "idle",
	position: 0,
	progress: 0
}, m = {
	up: {
		opacity: [0, 1],
		transform: ["translateY(24px)", "translateY(0px)"]
	},
	down: {
		opacity: [0, 1],
		transform: ["translateY(-24px)", "translateY(0px)"]
	},
	left: {
		opacity: [0, 1],
		transform: ["translateX(24px)", "translateX(0px)"]
	},
	right: {
		opacity: [0, 1],
		transform: ["translateX(-24px)", "translateX(0px)"]
	}
};
function h() {
	let e = d(null), t = d(/* @__PURE__ */ new Set()), n = l((n, i) => {
		let a = e.current;
		if (!a) return null;
		let o, s = !1, c = () => {
			o ? t.current.delete(o) : s = !0;
		}, l = r(a, n, {
			...i,
			onComplete: () => {
				try {
					i?.onComplete?.();
				} finally {
					c();
				}
			},
			onCancel: () => {
				try {
					i?.onCancel?.();
				} finally {
					c();
				}
			}
		});
		return o = l, s || t.current.add(l), l;
	}, []);
	return u(() => () => {
		let e = Array.from(t.current);
		t.current.clear();
		let n = [];
		for (let t of e) try {
			t.cancel();
		} catch (e) {
			n.push(e);
		}
		if (n.length > 0) throw n[0];
	}, []), {
		ref: e,
		animate: n
	};
}
function g(e = {}) {
	let t = d(null), [n, r] = f(!1), { rootMargin: a, threshold: o, once: s } = e;
	return u(() => {
		r(!1);
		let e = t.current;
		if (!e) return;
		let n = !0, c = i(e, () => (n && r(!0), () => {
			n && r(!1);
		}), {
			rootMargin: a,
			threshold: o,
			once: s
		});
		return () => {
			n = !1, c.destroy();
		};
	}, [
		a,
		o,
		s
	]), {
		ref: t,
		isInView: n
	};
}
function _(e = {}) {
	let t = d(null), [r, i] = f(0), { position: a, color: o, height: s, smoothing: c, easing: l, target: p, onUpdate: m } = e;
	return u(() => {
		i(0);
		let e = !0, r = n({
			position: a,
			color: o,
			height: s,
			smoothing: c,
			easing: l,
			target: p === "window" ? void 0 : p ?? t.current ?? void 0,
			onUpdate: (t) => {
				e && i(t), m?.(t);
			}
		});
		return () => {
			e = !1, r.destroy();
		};
	}, [
		a,
		o,
		s,
		c,
		l,
		p,
		m
	]), {
		ref: t,
		progress: r
	};
}
function v(e = {}) {
	let t = d(null), [n, r] = f(p), { smoothing: i, target: a, onUpdate: o } = e;
	return u(() => {
		r(p);
		let e = !0, n = s({
			smoothing: i,
			target: a === "window" ? void 0 : a ?? t.current ?? void 0,
			onUpdate: (t) => {
				e && r(t), o?.(t);
			}
		});
		return () => {
			e = !1, n.destroy();
		};
	}, [
		i,
		a,
		o
	]), {
		ref: t,
		data: n
	};
}
function y({ children: e, direction: n = "up", duration: r = 600, delay: i, once: a = !0, ...o }) {
	let s = d(null);
	return u(() => {
		let e = s.current;
		if (!e) return;
		let o = t(e, {
			properties: m[n],
			duration: r,
			delay: i,
			once: a
		});
		return () => o.destroy();
	}, [
		n,
		r,
		i,
		a
	]), c("div", {
		...o,
		ref: s
	}, e);
}
function b({ text: t, effect: n, effectOptions: r, ...i }) {
	let s = d(null);
	return u(() => {
		let i = s.current;
		if (i) switch (n) {
			case "typewriter": return a(i, {
				...r,
				phrases: [t],
				loop: r?.loop ?? !1,
				cursor: r?.cursor ?? ""
			}).destroy;
			case "scramble": return o(i, r).destroy;
			case "gradient": return e(i, r).destroy;
		}
	}, [
		t,
		n,
		r
	]), c("span", {
		...i,
		"aria-label": t
	}, c("span", {
		ref: s,
		"aria-hidden": !0
	}, t));
}
export { b as AnimatedText, y as Reveal, h as useAnimate, g as useInView, _ as useScrollProgress, v as useScrollVelocity };

//# sourceMappingURL=react.js.map