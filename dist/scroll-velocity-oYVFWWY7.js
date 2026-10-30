// src/easing/easings.ts
function e(e) {
	return Number.isNaN(e) ? 0 : Math.min(Math.max(e, 0), 1);
}
var t = (t) => e(t), n = (t) => {
	let n = e(t);
	return n * n;
}, r = (t) => {
	let n = e(t);
	return 1 - (1 - n) * (1 - n);
}, i = (t) => {
	let n = e(t);
	return n < .5 ? 2 * n * n : 1 - (-2 * n + 2) ** 2 / 2;
}, a = (t) => {
	let n = e(t);
	return n * n * n;
}, o = (t) => 1 - (1 - e(t)) ** 3, s = (t) => {
	let n = e(t);
	return n < .5 ? 4 * n * n * n : 1 - (-2 * n + 2) ** 3 / 2;
}, c = (t) => {
	let n = e(t);
	return n === 1 ? 1 : 1 - Math.cos(n * Math.PI / 2);
}, l = (t) => {
	let n = e(t);
	return Math.sin(n * Math.PI / 2);
}, u = (t) => {
	let n = e(t);
	return n === 0 ? 0 : n === 1 ? 1 : -(Math.cos(Math.PI * n) - 1) / 2;
}, d = (t) => {
	let n = e(t);
	return n === 1 ? 1 : 1 - 2 ** (-10 * n);
}, f = (t) => {
	let n = e(t);
	if (n === 0) return 0;
	if (n === 1) return 1;
	let r = n - 1;
	return 1 + 2.70158 * r ** 3 + 1.70158 * r ** 2;
}, p = {
	linear: t,
	easeInQuad: n,
	easeOutQuad: r,
	easeInOutQuad: i,
	easeInCubic: a,
	easeOutCubic: o,
	easeInOutCubic: s,
	easeInSine: c,
	easeOutSine: l,
	easeInOutSine: u,
	easeOutExpo: d,
	easeOutBack: f
}, m = /* @__PURE__ */ new Map(), h = new Set(Object.keys(p));
function g(e) {
	if (typeof e != "string" || e.trim() === "" || e !== e.trim()) throw TypeError("Easing name must be a non-empty string without surrounding whitespace");
}
function _(e) {
	if (typeof e != "function") throw TypeError("Easing must be a function");
}
function v(e, t) {
	if (g(e), _(t), h.has(e)) throw TypeError(`Cannot replace built-in easing "${e}"`);
	m.set(e, t);
}
function y(e) {
	return g(e), Object.prototype.hasOwnProperty.call(p, e) ? p[e] : m.get(e);
}
function b(e) {
	return g(e), !h.has(e) && m.delete(e);
}
var x = Object.freeze({
	register: v,
	get: y,
	remove: b
});
function S(e) {
	if (e === void 0) return t;
	if (typeof e == "function") return e;
	if (typeof e != "string") throw TypeError("easing must be a function or a registered easing name");
	let n = y(e);
	if (!n) throw TypeError(`Unknown easing "${e}"`);
	return n;
}
// src/core/motion.ts
var C = "(prefers-reduced-motion: reduce)";
function w() {
	return typeof matchMedia == "function" && matchMedia(C)?.matches === !0;
}
function T(e) {
	if (typeof matchMedia != "function") return () => void 0;
	let t = matchMedia(C);
	if (!t) return () => void 0;
	let n = (t) => {
		e(t?.matches ?? w());
	};
	return typeof t.addEventListener == "function" ? (t.addEventListener("change", n), () => t.removeEventListener?.("change", n)) : typeof t.addListener == "function" ? (t.addListener(n), () => t.removeListener?.(n)) : () => void 0;
}
// src/core/animation.ts
var E = 1e3, D = 0, O = /* @__PURE__ */ new Set(), k = null, A = !1, j = null, M = null, N = null, P = 0, F = null, I = !1;
function L() {
	return typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now();
}
function R() {
	return typeof document < "u" && document.hidden;
}
function ee() {
	let e = L();
	return e - P - (N === null ? 0 : Math.max(0, e - N));
}
function z() {
	j && F && j.removeEventListener("visibilitychange", F), j = null, F = null, I = !1, N = null, P = 0;
}
function te() {
	R() ? (N === null && (N = L()), k !== null && (cancelAnimationFrame(k), k = null)) : (N !== null && (P += Math.max(0, L() - N), N = null), B());
}
function ne() {
	j || typeof document > "u" || (j = document, typeof document.addEventListener != "function" || typeof document.removeEventListener != "function" ? (j = null, R() && (N = L())) : (I = !0, F = te, document.addEventListener("visibilitychange", F), R() && (N = L())));
}
function B() {
	k !== null || A || O.size === 0 || I && R() || (k = requestAnimationFrame((e) => {
		if (k = null, R()) {
			I ? te() : (N === null && (N = L()), B());
			return;
		}
		!I && N !== null && (P += Math.max(0, L() - N), N = null), A = !0;
		let t = [];
		try {
			for (let n of [...O]) if (O.has(n)) try {
				n(e - P);
			} catch (e) {
				t.push(e);
			}
		} finally {
			A = !1, B();
		}
		if (t.length > 0) throw t[0];
	}));
}
function V(e) {
	return M !== null && typeof document < "u" && M !== document && (O.clear(), k !== null && (cancelAnimationFrame(k), k = null), z()), typeof document < "u" && (M = document), ne(), O.add(e), B(), () => {
		O.delete(e), O.size === 0 && k !== null && (cancelAnimationFrame(k), k = null), O.size === 0 && z();
	};
}
function re(e) {
	if (typeof e != "function") throw TypeError("Animation frame callback must be a function");
	return V(e);
}
function H(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t < 0) throw RangeError(`${e} must be a finite number >= 0, received ${String(t)}`);
}
function U(e = {}) {
	let { duration: t = E, delay: n = D, repeat: r = 0, yoyo: i = !1, playbackRate: a = 1, respectReducedMotion: o = !0, onStart: s, onUpdate: c, onComplete: l, onCancel: u } = e, d = S(e.easing);
	H("duration", t), H("delay", n), ie(r), ae(i), W(a);
	let f = null, p = null, m = null, h = n, g = 0, _ = 0, v = 1, y = a, b = !1, x = !0, C = !1, O = !1, k = !1, A = !1, j = o && w(), M = () => void 0, N = ee, P = (e) => {
		if (j) h = 0, g = +(v > 0);
		else {
			if (h > 0) {
				let t = Math.min(e, h);
				h -= t, e -= t;
			}
			h > 0 || (t === 0 ? g = +(v > 0) : e > 0 && (g = Math.max(0, Math.min(1, g + v * e * y / t))));
		}
	}, F = () => {
		if (p === null || m === null) return;
		let e = N() + m, t = Math.max(0, e - p);
		p = e, P(t);
	}, I = () => {
		x && !b && f === null && (f = V(z));
	}, L = () => {
		f?.(), f = null;
	}, R = () => {
		x = !1, M(), L();
	}, z = (e) => {
		if (!x || b) return;
		m === null && (m = e - N()), p === null && (p = e);
		let t = Math.max(0, e - p);
		if (p = e, P(t), !j && h > 0) {
			I();
			return;
		}
		if (!k) {
			k = !0;
			try {
				s?.();
			} catch (e) {
				throw R(), e;
			}
			if (!x || C || b) return;
		}
		let n = v > 0 ? g >= 1 : g <= 0;
		if (n && _ < r && !j) {
			_ += 1;
			try {
				c?.(d(g));
			} catch (e) {
				throw R(), e;
			}
			if (!x || C || b) return;
			i && (v *= -1), g = v > 0 ? 0 : 1, p = e, I();
		} else {
			n && (x = !1, L(), M(), O = !0);
			try {
				c?.(d(g));
			} catch (e) {
				throw R(), e;
			} finally {
				n && (O = !1);
			}
			if (n) {
				if (C) return;
				try {
					l?.();
				} catch (e) {
					throw R(), e;
				}
			} else I();
		}
	};
	return o && (M = T((e) => {
		e && x && (j = !0, h = 0, I());
	})), I(), {
		seek: (e) => {
			if (typeof e != "number" || !Number.isFinite(e) || e < 0 || e > 1) throw RangeError(`progress must be a finite number between 0 and 1, received ${String(e)}`);
			if (!C) {
				if (!k) {
					k = !0;
					try {
						s?.();
					} catch (e) {
						throw R(), e;
					}
				}
				h = 0, v = 1, g = e, _ = e >= 1 ? r : _, x = e < 1 || _ < r, p = x && m !== null ? N() + m : null, e >= 1 && _ >= r ? (x = !1, L(), M()) : I(), e >= 1 && _ >= r && (O = !0);
				try {
					c?.(d(g));
				} catch (e) {
					throw R(), e;
				} finally {
					e >= 1 && (O = !1);
				}
				if (e >= 1 && _ >= r && !C) try {
					l?.();
				} catch (e) {
					throw R(), e;
				}
			}
		},
		pause: () => {
			x && !b && (F(), b = !0, p = null, L());
		},
		resume: () => {
			x && b && (b = !1, p = m === null ? null : N() + m, I());
		},
		reverse: () => {
			x && (F(), v *= -1);
		},
		setPlaybackRate: (e) => {
			W(e), x && F(), y = e;
		},
		getPlaybackRate: () => y,
		cancel: () => {
			(x || O) && (C = !0, R(), !A && (A = !0, u?.()));
		}
	};
}
function W(e) {
	if (typeof e != "number" || !Number.isFinite(e) || e <= 0) throw RangeError(`playbackRate must be a finite number > 0, received ${String(e)}`);
}
function ie(e) {
	if (typeof e != "number" || e !== Infinity && (!Number.isInteger(e) || e < 0)) throw RangeError(`repeat must be a non-negative integer or Infinity, received ${String(e)}`);
}
function ae(e) {
	if (typeof e != "boolean") throw TypeError(`yoyo must be a boolean, received ${String(e)}`);
}
// src/core/animate.ts
var oe = /(?<![\w#.])(?<!\w-)-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi, G = "([+-]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?%?)", se = RegExp(`^(rgb|rgba)\\(\\s*${G}\\s*,\\s*${G}\\s*,\\s*${G}(?:\\s*,\\s*${G})?\\s*\\)$`, "i");
function K(e) {
	let t = [], n = [], r = 0;
	for (let i of e.matchAll(oe)) t.push(e.slice(r, i.index)), n.push(Number(i[0])), r = i.index + i[0].length;
	return t.push(e.slice(r)), {
		parts: t,
		numbers: n
	};
}
function q(e) {
	let t = e * 1e6;
	return String(Number.isFinite(t) ? Math.round(t) / 1e6 : e);
}
function J(e) {
	let t = se.exec(e);
	if (!t) return null;
	let n = t[1]?.toLowerCase(), r = [
		t[2],
		t[3],
		t[4]
	], i = t[5];
	if (n === "rgba" && i === void 0) return null;
	let a = r.map((e) => {
		if (e === void 0) return NaN;
		let t = e.endsWith("%"), n = Number(t ? e.slice(0, -1) : e);
		return Math.min(255, Math.max(0, t ? n * 2.55 : n));
	}), o = i === void 0 ? 1 : Number(i.endsWith("%") ? i.slice(0, -1) : i) / (i.endsWith("%") ? 100 : 1), s = Math.min(1, Math.max(0, o));
	return [...a, s].every(Number.isFinite) ? {
		channels: [
			a[0],
			a[1],
			a[2],
			s
		],
		hasAlpha: i !== void 0
	} : null;
}
function ce(e, t) {
	let n = K(e), r = K(t), i = n.numbers.length > 0 && n.numbers.length === r.numbers.length && n.numbers.every(Number.isFinite) && r.numbers.every(Number.isFinite) && n.parts.every((e, t) => e === r.parts[t]), a = J(e), o = J(t);
	if (a && o && !i) {
		let n = a.hasAlpha || o.hasAlpha;
		return (r) => {
			if (r === 0) return e;
			if (r === 1) return t;
			let i = a.channels.map((e, t) => e + (o.channels[t] - e) * r);
			if (!i.every(Number.isFinite)) return r >= 1 ? t : e;
			let [s, c, l, u] = i;
			return n ? `rgba(${q(s)}, ${q(c)}, ${q(l)}, ${q(u)})` : `rgb(${q(s)}, ${q(c)}, ${q(l)})`;
		};
	}
	return i ? (i) => {
		if (i === 0) return e;
		if (i === 1) return t;
		let a = n.parts[0], o = [];
		return n.numbers.forEach((e, t) => {
			let n = r.numbers[t];
			o.push(e + (n - e) * i);
		}), o.every(Number.isFinite) ? (o.forEach((e, t) => {
			a += q(e) + n.parts[t + 1];
		}), a) : i >= 1 ? t : e;
	} : (n) => n >= 1 ? t : e;
}
function Y(e) {
	if (e.startsWith("--")) return e;
	let t = e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
	return t.startsWith("ms-") ? `-${t}` : t;
}
function le(e, t) {
	if (typeof t == "number" && Number.isFinite(t)) return String(t);
	if (typeof t == "string" && t.trim() !== "") return t.trim();
	throw TypeError(`Invalid value for "${e}": expected a finite number or non-empty string, received ${String(t)}`);
}
function ue(e) {
	let t = Object.entries(e);
	if (t.length === 0) throw TypeError("animate() requires at least one property to animate");
	return t.map(([e, t]) => {
		if (!Array.isArray(t) || t.length !== 2) throw TypeError(`Property "${e}" must be a [from, to] pair`);
		let n = le(e, t[0]);
		return {
			name: e,
			from: n,
			valueAt: ce(n, le(e, t[1]))
		};
	});
}
function X(e) {
	return typeof HTMLElement < "u" && e instanceof HTMLElement;
}
function Z(e) {
	return typeof SVGElement < "u" && e instanceof SVGElement;
}
function de(e) {
	return X(e) || Z(e);
}
function fe(e, t) {
	if (typeof e != "string") {
		if (!X(e) && (!t || !Z(e))) throw TypeError("animate() target must be an HTMLElement, SVGElement, or a CSS selector string");
		return [e];
	}
	if (typeof document > "u") throw Error(`Cannot resolve selector "${e}": document is not available`);
	let n;
	try {
		n = document.querySelectorAll(e);
	} catch (t) {
		throw SyntaxError(`Invalid CSS selector "${e}"`, { cause: t });
	}
	return t ? Array.from(n).filter(de) : Array.from(n).filter(X);
}
function Q(e) {
	return fe(e, !1).filter(X);
}
function $(e, t, n = {}) {
	let { respectReducedMotion: r = !0, ...i } = n, a = i.onUpdate, o = fe(e, !0), s = ue(t);
	if (o.length === 0) {
		let e = U({
			...i,
			onStart: void 0,
			onUpdate: void 0,
			onComplete: void 0,
			onCancel: void 0
		});
		return e.cancel(), e;
	}
	let c = (e) => {
		for (let t of s) {
			let n = e(t);
			for (let e of o) Z(e) ? e.setAttribute(t.name, n) : e.style.setProperty(Y(t.name), n);
		}
	}, l = r && w(), u = U({
		...i,
		respectReducedMotion: r,
		...l ? {
			duration: 0,
			delay: 0,
			easing: (e) => e
		} : {},
		onUpdate: (e) => {
			Number.isFinite(e) && c((t) => t.valueAt(e)), a?.(e);
		}
	});
	return l || c((e) => e.from), u;
}
// src/effects/reveal.ts
var pe = {
	opacity: [0, 1],
	transform: ["translateY(24px)", "translateY(0px)"]
}, me = 600, he = .15;
function ge(e) {
	if ((Array.isArray(e) ? e : [e]).some((e) => typeof e != "number" || !Number.isFinite(e) || e < 0 || e > 1)) throw RangeError(`threshold must be a number (or numbers) between 0 and 1, received ${String(e)}`);
}
function _e(e, t = {}) {
	if (typeof IntersectionObserver > "u") throw Error("reveal() requires IntersectionObserver, which is not available in this environment");
	let { properties: n = pe, duration: r = me, delay: i, easing: a, threshold: o = he, rootMargin: s = "0px", once: c = !0 } = t, l = {
		duration: r,
		...i === void 0 ? {} : { delay: i },
		...a === void 0 ? {} : { easing: a }
	};
	ge(o);
	let u = Q(e), d = typeof n == "object" && n ? Object.keys(n).map(Y) : [], f = /* @__PURE__ */ new Map();
	for (let e of u) f.set(e, d.map((t) => [t, e.style.getPropertyValue(t)]));
	let p = (e) => {
		for (let [t, n] of f.get(e) ?? []) n === "" ? e.style.removeProperty(t) : e.style.setProperty(t, n);
	}, m = () => {
		for (let e of u) p(e);
	};
	try {
		$(e, n, l).cancel();
	} catch (e) {
		throw m(), e;
	}
	if (u.length === 0) return { destroy: () => void 0 };
	let h = /* @__PURE__ */ new Map(), g = /* @__PURE__ */ new Set(), _ = /* @__PURE__ */ new Set(), v = !1, y = (e) => {
		h.get(e)?.cancel();
		let t = $(e, n, {
			...l,
			onComplete: () => {
				h.get(e) === t && h.delete(e);
			}
		});
		h.set(e, t);
	}, b;
	try {
		b = new IntersectionObserver((e) => {
			if (!v) for (let t of e) {
				let e = t.target;
				t.isIntersecting ? g.has(e) || c && _.has(e) || (g.add(e), _.add(e), c && b.unobserve(e), y(e)) : g.delete(e);
			}
		}, {
			threshold: o,
			rootMargin: s
		});
	} catch (e) {
		throw m(), e;
	}
	for (let e of u) b.observe(e);
	return { destroy: () => {
		if (!v) {
			v = !0, b.disconnect();
			for (let e of h.values()) e.cancel();
			h.clear();
			for (let e of u) _.has(e) || p(e);
			g.clear(), _.clear();
		}
	} };
}
// src/effects/text-scramble.ts
var ve = 1e3, ye = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", be = 30;
function xe(e) {
	return e[Math.floor(Math.random() * e.length)] ?? e[0] ?? "";
}
function Se(e, t, n) {
	let r = 0;
	for (let { node: i, original: a } of e.nodes) i.data = a.map((e, i) => r + i < t || /^\s+$/u.test(e) ? e : xe(n)).join(""), r += a.length;
}
function Ce(e) {
	let t = [], n = (e) => {
		for (let r of Array.from(e.childNodes)) {
			if (r.nodeType === 3) {
				t.push(r);
				continue;
			}
			if (r.nodeType !== 1) continue;
			let e = r.tagName.toLowerCase();
			e !== "script" && e !== "style" && n(r);
		}
	};
	return n(e), t;
}
function we(e, t = {}) {
	let { duration: n = ve, characters: r = ye, speed: i = be } = t;
	if (typeof n != "number" || !Number.isFinite(n) || n < 0) throw RangeError(`duration must be a finite number >= 0, received ${String(n)}`);
	if (typeof r != "string" || Array.from(r).length === 0) throw TypeError("characters must be a non-empty string");
	if (typeof i != "number" || !Number.isFinite(i) || i <= 0) throw RangeError(`speed must be a finite number > 0, received ${String(i)}`);
	let a = Q(e);
	if (a.length === 0) return { destroy: () => void 0 };
	let o = a.map((e) => ({ nodes: Ce(e).map((e) => ({
		node: e,
		original: Array.from(e.data)
	})) })), s = Array.from(r), c = !1, l = null, u = null, d = null, f = () => {
		for (let e of o) for (let { node: t, original: n } of e.nodes) t.data = n.join("");
	}, p = () => {
		l !== null && (cancelAnimationFrame(l), l = null);
	};
	if (w() || n === 0) return f(), { destroy: () => void 0 };
	if (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function") throw Error("textScramble() requires requestAnimationFrame and cancelAnimationFrame");
	for (let e of o) Se(e, 0, s);
	let m = (e) => {
		if (l = null, c) return;
		u === null && (u = e, d = e);
		let t = Math.max(0, e - u), r = Math.min(t / n, 1);
		if (t - (d ?? e) >= i || r === 1) {
			for (let e of o) {
				let t = e.nodes.reduce((e, { original: t }) => e + t.length, 0);
				Se(e, Math.floor(r * t), s);
			}
			d = e;
		}
		r === 1 ? (f(), g()) : l = requestAnimationFrame(m);
	}, h = () => {
		!c && l === null && (l = requestAnimationFrame(m));
	}, g = () => void 0;
	return g = T((e) => {
		e && !c && (p(), f(), c = !0, g());
	}), h(), { destroy: () => {
		c || (c = !0, p(), g(), f());
	} };
}
// src/effects/typewriter.ts
var Te = 70, Ee = 35, De = 1200, Oe = "|";
function ke(e, t) {
	if (!t || typeof t != "object") throw TypeError("typewriter() options must be an object");
	let { phrases: n, typeSpeed: r = Te, deleteSpeed: i = Ee, pause: a = De, loop: o = !0, cursor: s = Oe } = t;
	if (!Array.isArray(n) || n.length === 0) throw TypeError("phrases must contain at least one non-empty string");
	if (n.some((e) => typeof e != "string" || Array.from(e).length === 0)) throw TypeError("each phrase must be a non-empty string");
	if (typeof r != "number" || !Number.isFinite(r) || r <= 0) throw RangeError(`typeSpeed must be a finite number > 0, received ${String(r)}`);
	if (typeof i != "number" || !Number.isFinite(i) || i <= 0) throw RangeError(`deleteSpeed must be a finite number > 0, received ${String(i)}`);
	if (typeof a != "number" || !Number.isFinite(a) || a < 0) throw RangeError(`pause must be a finite number >= 0, received ${String(a)}`);
	if (typeof o != "boolean") throw TypeError(`loop must be a boolean, received ${String(o)}`);
	if (typeof s != "string") throw TypeError(`cursor must be a string, received ${String(s)}`);
	let c = Q(e);
	if (c.length === 0) return { destroy: () => void 0 };
	let l = c.map((e) => ({
		element: e,
		original: e.textContent ?? ""
	})), u = n.map((e) => Array.from(e)), d = w(), f = !1, p = "typing", m = 0, h = 0, g = null, _ = () => void 0, v = () => {
		let e = u[m];
		if (!e) return;
		let t = e.slice(0, h).join("") + s;
		for (let e of l) e.element.textContent = t;
	}, y = () => {
		m = u.length - 1, h = u[m]?.length ?? 0, p = "complete", v();
	}, b = () => {
		g !== null && (clearTimeout(g), g = null);
	}, x = (e, t) => {
		b(), g = setTimeout(() => {
			g = null, f || e();
		}, t);
	}, S = () => {
		if (p === "typing") {
			let e = u[m];
			if (!e) return;
			if (h < e.length) {
				h++, v(), x(S, r);
				return;
			}
			if (!o && m === u.length - 1) {
				p = "complete";
				return;
			}
			p = "waiting", x(S, a);
		} else if (p === "waiting") p = "deleting", x(S, i);
		else if (p === "deleting") {
			if (h > 0 && (h--, v()), h > 0) {
				x(S, i);
				return;
			}
			m = (m + 1) % u.length, p = "typing", x(S, r);
		}
	};
	return d ? (y(), { destroy: () => {
		if (!f) {
			f = !0;
			for (let e of l) e.element.textContent = e.original;
		}
	} }) : (v(), x(S, r), _ = T((e) => {
		e && !f && (b(), y(), _());
	}), { destroy: () => {
		if (!f) {
			f = !0, b(), _();
			for (let e of l) e.element.textContent = e.original;
		}
	} });
}
// src/effects/gradient-text.ts
var Ae = ["#7c3aed", "#06b6d4"], je = 90, Me = 4e3, Ne = [
	"background-image",
	"background-clip",
	"-webkit-background-clip",
	"color",
	"-webkit-text-fill-color",
	"background-size",
	"background-position"
];
function Pe(e) {
	if (!Array.isArray(e) || e.length < 2) throw TypeError("colors must be an array containing at least two CSS colors");
	for (let t of e) {
		if (typeof t != "string" || t.trim() === "") throw TypeError("colors must contain non-empty CSS color strings");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t)) throw TypeError(`Invalid CSS color "${t}"`);
	}
}
function Fe(e) {
	return Ne.map((t) => ({
		property: t,
		value: e.style.getPropertyValue(t),
		priority: e.style.getPropertyPriority(t)
	}));
}
function Ie(e) {
	e.animation?.cancel(), e.animation = null;
	for (let { property: t, value: n, priority: r } of e.styles) n === "" ? e.element.style.removeProperty(t) : e.element.style.setProperty(t, n, r);
}
function Le(e, t, n) {
	let { style: r } = e.element;
	r.setProperty("background-image", t), r.setProperty("background-clip", "text"), r.setProperty("-webkit-background-clip", "text"), r.setProperty("color", "transparent"), r.setProperty("-webkit-text-fill-color", "transparent"), r.setProperty("background-size", n ? "200% 100%" : "100% 100%"), r.setProperty("background-position", "0% 50%");
}
function Re(e, t = {}) {
	let { colors: n = Ae, angle: r = je, duration: i = Me, animated: a = !1, loop: o = !0 } = t;
	if (Pe(n), typeof r != "number" || !Number.isFinite(r)) throw RangeError(`angle must be a finite number, received ${String(r)}`);
	if (typeof i != "number" || !Number.isFinite(i) || i <= 0) throw RangeError(`duration must be a finite number > 0, received ${String(i)}`);
	if (typeof a != "boolean") throw TypeError("animated must be a boolean");
	if (typeof o != "boolean") throw TypeError("loop must be a boolean");
	let s = Q(e);
	if (s.length === 0) return { destroy: () => void 0 };
	let c = w();
	if (a && !c && s.some((e) => typeof e.animate != "function")) throw Error("gradientText() requires the Web Animations API when animated motion is enabled");
	let l = `linear-gradient(${r}deg, ${n.join(", ")})`, u = s.map((e) => ({
		element: e,
		styles: Fe(e),
		animation: null
	})), d = !1, f = () => {
		for (let e of u) !a || c || d || e.animation || (e.animation = e.element.animate([{ backgroundPosition: "0% 50%" }, { backgroundPosition: "100% 50%" }], {
			duration: i,
			iterations: o ? Infinity : 1,
			fill: o ? "none" : "forwards",
			easing: "linear"
		}));
	};
	try {
		for (let e of u) Le(e, l, a && !c);
		f();
	} catch (e) {
		for (let e of u) Ie(e);
		throw e;
	}
	let p = T((e) => {
		if (!d && a) {
			if (e) for (let e of u) e.animation?.cancel(), e.animation = null, e.element.style.setProperty("background-size", "100% 100%"), e.element.style.setProperty("background-position", "50% 50%");
			else {
				for (let e of u) e.element.style.setProperty("background-size", "200% 100%"), e.element.style.setProperty("background-position", "0% 50%");
				f();
			}
		}
	});
	return { destroy: () => {
		if (!d) {
			d = !0, p();
			for (let e of u) Ie(e);
		}
	} };
}
// src/effects/scroll-progress.ts
var ze = "top", Be = "#8b5cf6", Ve = 3, He = .15;
function Ue(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function We(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t <= 0) throw RangeError(`${e} must be a finite number > 0, received ${String(t)}`);
}
function Ge(e) {
	if (typeof e != "number" || !Number.isFinite(e) || e < 0 || e > 2) throw RangeError(`smoothing must be a finite number between 0 and 2, received ${String(e)}`);
}
function Ke() {
	let e = document.documentElement, t = document.body, n = typeof window.scrollY == "number" ? window.scrollY : e.scrollTop || t?.scrollTop || 0, r = Math.max(e.scrollHeight, t?.scrollHeight ?? 0), i = window.innerHeight || e.clientHeight;
	return {
		position: n,
		maximum: Math.max(0, r - i)
	};
}
function qe(e) {
	return {
		position: e.scrollTop,
		maximum: Math.max(0, e.scrollHeight - e.clientHeight)
	};
}
function Je(e = {}) {
	let { position: t = ze, color: n = Be, height: r = Ve, smoothing: i, easing: a, target: o, onUpdate: s } = e, c = i ?? a ?? He;
	if (s !== void 0 && typeof s != "function") throw TypeError("onUpdate must be a function");
	if (t !== "top" && t !== "bottom") throw TypeError(`position must be "top" or "bottom", received ${String(t)}`);
	Ue(n), We("height", r), i !== void 0 && Ge(i), a !== void 0 && Ge(a);
	let l = null;
	if (o !== void 0) {
		let e = Q(o);
		if (e.length > 1) throw RangeError("scrollProgress() target must resolve to exactly one element");
		if (l = e[0] ?? null, !l) return {
			getProgress: () => 0,
			destroy: () => void 0
		};
	}
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("scrollProgress() requires document.createElement, which is not available in this environment");
	if (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function") throw Error("scrollProgress() requires requestAnimationFrame and cancelAnimationFrame");
	if (typeof window > "u" && !l) throw Error("scrollProgress() requires window when tracking page scroll");
	let u = document.createElement("div");
	u.setAttribute("aria-hidden", "true"), u.style.setProperty("position", "fixed"), u.style.setProperty(t, "0"), u.style.setProperty("left", "0"), u.style.setProperty("right", "0"), u.style.setProperty("height", `${r}px`), u.style.setProperty("z-index", "2147483647"), u.style.setProperty("pointer-events", "none"), u.style.setProperty("transform", "scaleX(0)"), u.style.setProperty("transform-origin", "left center"), u.style.setProperty("background-color", n);
	let d = w(), f = () => {
		u.style.setProperty("transition", d || c === 0 ? "none" : `transform ${c}s ease-out`);
	};
	f();
	let p = document.body ?? document.documentElement;
	if (!p) throw Error("scrollProgress() requires a document body or document element");
	let m = !1, h = null, g = 0, _ = 0, v = !1, y = () => {
		let e = l ? qe(l) : Ke();
		return e.maximum === 0 ? 0 : Math.min(Math.max(e.position / e.maximum, 0), 1);
	}, b = (e) => {
		m || u.style.setProperty("transform", `scaleX(${e})`);
	}, x = (e) => {
		g = e, !(v && e === _) && (_ = e, v = !0, b(e), s?.(e));
	}, S = () => {
		m || (h !== null && (cancelAnimationFrame(h), h = null), x(y()));
	}, C = () => {
		m || (d ? S() : (g = y(), h === null && (h = requestAnimationFrame(() => {
			h = null, x(g);
		}))));
	};
	p.appendChild(u);
	let E = l ?? window;
	E.addEventListener("scroll", C, { passive: !0 }), l || window.addEventListener("resize", C, { passive: !0 });
	let D = T((e) => {
		m || e === d || (d = e, f(), S());
	});
	try {
		S();
	} catch (e) {
		throw D(), E.removeEventListener("scroll", C), l || window.removeEventListener("resize", C), u.parentElement === p && p.removeChild(u), e;
	}
	return {
		getProgress: () => g,
		destroy: () => {
			m || (m = !0, D(), h !== null && cancelAnimationFrame(h), h = null, E.removeEventListener("scroll", C), l || window.removeEventListener("resize", C), u.parentElement === p && p.removeChild(u));
		}
	};
}
// src/effects/scroll-trigger.ts
function Ye(e) {
	if ((Array.isArray(e) ? e : [e]).some((e) => typeof e != "number" || !Number.isFinite(e) || e < 0 || e > 1)) throw RangeError("threshold must be a number (or non-empty list of numbers) between 0 and 1");
}
function Xe(e, t = {}) {
	if (typeof t != "object" || !t || Array.isArray(t)) throw TypeError("scrollTrigger() options must be an object");
	let { onEnter: n, onLeave: r, rootMargin: i = "0px", threshold: a = 0, once: o = !0 } = t;
	if (n !== void 0 && typeof n != "function") throw TypeError("onEnter must be a function");
	if (r !== void 0 && typeof r != "function") throw TypeError("onLeave must be a function");
	if (n === void 0 && r === void 0) throw TypeError("scrollTrigger() requires onEnter or onLeave");
	if (Ye(a), typeof i != "string" || i.trim() === "") throw TypeError("rootMargin must be a non-empty string");
	if (typeof o != "boolean") throw TypeError("once must be a boolean");
	if (typeof IntersectionObserver > "u") throw Error("scrollTrigger() requires IntersectionObserver, which is not available in this environment");
	let s = Q(e);
	if (s.length === 0) return { destroy: () => void 0 };
	let c = /* @__PURE__ */ new Set(), l = /* @__PURE__ */ new Set(), u = !1, d;
	try {
		d = new IntersectionObserver((e) => {
			if (!u) for (let t of e) {
				let e = t.target;
				if (l.has(e)) {
					if (t.isIntersecting) {
						if (c.has(e)) continue;
						c.add(e);
						try {
							n?.(e, t);
						} finally {
							o && r === void 0 && (d.unobserve(e), l.delete(e));
						}
					} else if (c.delete(e)) try {
						r?.(e, t);
					} finally {
						o && (d.unobserve(e), l.delete(e));
					}
				}
			}
		}, {
			rootMargin: i,
			threshold: a
		});
	} catch (e) {
		throw Error("scrollTrigger() could not create an IntersectionObserver", { cause: e });
	}
	for (let e of s) try {
		d.observe(e), l.add(e);
	} catch (e) {
		throw d.disconnect(), e;
	}
	return { destroy: () => {
		u || (u = !0, d.disconnect(), l.clear(), c.clear());
	} };
}
// src/effects/in-view.ts
function Ze(e, t, n = {}) {
	if (typeof t != "function") throw TypeError("inView() callback must be a function");
	let r = /* @__PURE__ */ new Map(), i = !1, a = Xe(e, {
		...n,
		onEnter: (e, n) => {
			if (i) return;
			let a = t(e, n);
			typeof a == "function" && r.set(e, a);
		},
		onLeave: (e) => {
			let t = r.get(e);
			r.delete(e), t?.();
		}
	});
	return { destroy: () => {
		if (i) return;
		i = !0, a.destroy();
		let e = [...r.values()];
		r.clear();
		for (let t of e) t();
	} };
}
// src/effects/scroll-velocity.ts
var Qe = .2, $e = 1e4;
function et(e) {
	if (typeof e != "number" || !Number.isFinite(e) || e < 0 || e > 1) throw RangeError(`smoothing must be a finite number between 0 and 1, received ${String(e)}`);
}
function tt() {
	let e = document.documentElement, t = document.body, n = window.scrollY ?? window.pageYOffset ?? e.scrollTop ?? t?.scrollTop ?? 0, r = Math.max(e.scrollHeight, t?.scrollHeight ?? 0), i = window.innerHeight || e.clientHeight;
	return {
		position: n,
		maximum: Math.max(0, r - i)
	};
}
function nt(e) {
	return {
		position: e.scrollTop,
		maximum: Math.max(0, e.scrollHeight - e.clientHeight)
	};
}
function rt(e) {
	return !Number.isFinite(e.position) || !Number.isFinite(e.maximum) || e.maximum <= 0 ? 0 : Math.min(Math.max(e.position / e.maximum, 0), 1);
}
function it(e) {
	if (typeof e != "object" || !e) throw TypeError("options must be an object");
	let { smoothing: t = Qe, target: n, onUpdate: r } = e;
	if (et(t), typeof r != "function") throw TypeError("onUpdate must be a function");
	let i = null, a;
	if (n === void 0) {
		if (typeof window > "u") throw Error("scrollVelocity() requires window when no target is provided");
		a = window;
	} else if (typeof Window < "u" && n instanceof Window) a = n;
	else {
		let e = Q(n);
		if (e.length > 1) throw RangeError("scrollVelocity() target must resolve to exactly one element");
		if (i = e[0] ?? null, !i) return { destroy: () => void 0 };
		a = typeof window > "u" ? {} : window;
	}
	if (!i && (typeof document > "u" || !document.documentElement)) throw Error("scrollVelocity() requires document scrolling metrics");
	if (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function") throw Error("scrollVelocity() requires requestAnimationFrame and cancelAnimationFrame");
	let o = w(), s = !1, c = null, l = null, u = null, d = 0, f = () => i ? nt(i) : tt(), p = (e) => {
		if (c = null, s) return;
		let n = f(), i = {
			position: Number.isFinite(n.position) ? n.position : l ?? 0,
			maximum: Number.isFinite(n.maximum) ? Math.max(0, n.maximum) : 0
		}, a = l === null || i.position === l ? "idle" : i.position > l ? "down" : "up", p = 0;
		l !== null && u !== null && Number.isFinite(e) && e > u && (p = (i.position - l) / (e - u) * 1e3, p = Math.min(Math.max(p, -1e4), $e));
		let m = t;
		d = p * (1 - m) + d * m, l = i.position, Number.isFinite(e) && (u === null || e > u) && (u = e), r({
			velocity: o ? 0 : d,
			direction: a,
			position: i.position,
			progress: rt(i)
		});
	}, m = () => {
		s || c !== null || (c = requestAnimationFrame(p));
	}, h = i ?? a;
	h.addEventListener("scroll", m, { passive: !0 });
	let g = T((e) => {
		s || e === o || (o = e, e && (d = 0), m());
	});
	try {
		p(typeof performance < "u" ? performance.now() : 0);
	} catch (e) {
		throw s = !0, g(), c !== null && cancelAnimationFrame(c), c = null, h.removeEventListener("scroll", m), e;
	}
	return { destroy: () => {
		s || (s = !0, g(), c !== null && cancelAnimationFrame(c), c = null, h.removeEventListener("scroll", m));
	} };
}
export { v as A, d as C, p as D, x as E, S as M, y as O, o as S, l as T, i as _, Re as a, c as b, _e as c, U as d, re as f, s as g, a as h, Je as i, b as j, t as k, $ as l, w as m, Ze as n, ke as o, T as p, Xe as r, we as s, it as t, Q as u, u as v, r as w, f as x, n as y };

//# sourceMappingURL=scroll-velocity-oYVFWWY7.js.map