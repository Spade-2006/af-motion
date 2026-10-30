import { A as e, C as t, D as n, E as r, M as i, O as a, S as o, T as s, _ as c, a as l, b as u, c as d, d as f, f as p, g as m, h, i as g, j as _, k as v, l as y, m as b, n as x, o as S, p as C, r as w, s as T, t as E, u as D, v as O, w as k, x as A, y as ee } from "./scroll-velocity-oYVFWWY7.js";
// src/core/spring.ts
var te = {
	stiffness: 170,
	damping: 26,
	mass: 1,
	initialVelocity: 0,
	restDelta: .01,
	restSpeed: .01
}, ne = .064, re = 1 / 120;
function j(e, t) {
	if (typeof t != "number" || !Number.isFinite(t)) throw RangeError(`${e} must be a finite number, received ${String(t)}`);
}
function ie(e) {
	if (j("stiffness", e.stiffness), e.stiffness <= 0) throw RangeError("stiffness must be greater than zero");
	if (j("damping", e.damping), e.damping < 0) throw RangeError("damping must be non-negative");
	if (j("mass", e.mass), e.mass <= 0) throw RangeError("mass must be greater than zero");
	if (j("initialVelocity", e.initialVelocity), j("restDelta", e.restDelta), e.restDelta <= 0) throw RangeError("restDelta must be greater than zero");
	if (j("restSpeed", e.restSpeed), e.restSpeed <= 0) throw RangeError("restSpeed must be greater than zero");
}
function ae(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("animateSpring() options must be an object");
	if (typeof e.onUpdate != "function") throw TypeError("onUpdate must be a function");
	if (e.onComplete !== void 0 && typeof e.onComplete != "function") throw TypeError("onComplete must be a function");
	if (e.respectReducedMotion !== void 0 && typeof e.respectReducedMotion != "boolean") throw TypeError("respectReducedMotion must be a boolean");
	let t = e.from ?? 0, n = e.to ?? 1;
	if (j("from", t), j("to", n), e.config !== void 0 && (e.config === null || typeof e.config != "object")) throw TypeError("config must be an object");
	let r = {
		...te,
		...e.config
	};
	ie(r);
	let i = e.respectReducedMotion ?? !0, a = t, o = r.initialVelocity, s = null, c = !0, l = i && b(), u = null, d = () => void 0, f = () => {
		u?.(), u = null, d(), d = () => void 0;
	}, m = () => {
		if (c) {
			a = n, o = 0, f();
			try {
				e.onUpdate({
					position: a,
					velocity: o
				});
			} catch (e) {
				throw c = !1, e;
			}
			c && (c = !1, e.onComplete?.());
		}
	}, h = () => {
		try {
			e.onUpdate({
				position: a,
				velocity: o
			});
		} catch (e) {
			throw c = !1, f(), e;
		}
	};
	return d = i ? C((e) => {
		c && (l = e);
	}) : () => void 0, u = p((e) => {
		if (!c) return;
		if (l) {
			m();
			return;
		}
		if (!Number.isFinite(e)) return;
		if (s === null) {
			if (s = e, Math.abs(n - a) <= r.restDelta && Math.abs(o) <= r.restSpeed) {
				m();
				return;
			}
			h();
			return;
		}
		let t = Math.min(Math.max((e - s) / 1e3, 0), ne);
		s = e;
		let i = t;
		for (; i > 0;) {
			let e = Math.min(i, re), t = (r.stiffness * (n - a) - r.damping * o) / r.mass;
			o += t * e, a += o * e, i -= e;
		}
		Math.abs(n - a) <= r.restDelta && Math.abs(o) <= r.restSpeed ? m() : h();
	}), { cancel: () => {
		c && (c = !1, f());
	} };
}
// src/core/inertia.ts
var oe = 1e3, se = 8, ce = 10, le = .064;
function ue(e, t) {
	if (typeof t != "number" || !Number.isFinite(t)) throw RangeError(`${e} must be a finite number, received ${String(t)}`);
}
function de(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("animateInertia() options must be an object");
	if (typeof e.onUpdate != "function") throw TypeError("onUpdate must be a function");
	if (e.onComplete !== void 0 && typeof e.onComplete != "function") throw TypeError("onComplete must be a function");
	if (e.respectReducedMotion !== void 0 && typeof e.respectReducedMotion != "boolean") throw TypeError("respectReducedMotion must be a boolean");
	let t = e.from ?? 0, n = e.initialVelocity ?? oe, r = e.friction ?? se, i = e.minVelocity ?? ce, a = e.min, o = e.max;
	if (ue("from", t), ue("initialVelocity", n), ue("friction", r), r <= 0) throw RangeError("friction must be greater than zero");
	if (ue("minVelocity", i), i < 0) throw RangeError("minVelocity must be non-negative");
	if (a !== void 0 && ue("min", a), o !== void 0 && ue("max", o), a !== void 0 && o !== void 0 && a > o) throw RangeError("min must be less than or equal to max");
	a !== void 0 && (t = Math.max(a, t)), o !== void 0 && (t = Math.min(o, t));
	let s = e.respectReducedMotion ?? !0, c = s && b(), l = !0, u = null, d = null, f = () => void 0, m = () => {
		d?.(), d = null, f(), f = () => void 0;
	}, h = () => {
		try {
			e.onUpdate({
				position: t,
				velocity: n
			});
		} catch (e) {
			throw l = !1, m(), e;
		}
	}, g = (t = !1) => {
		l && (t && (n = 0), m(), h(), l && (l = !1, e.onComplete?.()));
	};
	return f = s ? C((e) => {
		l && (c = e);
	}) : () => void 0, d = p((e) => {
		if (!l || !Number.isFinite(e)) return;
		if (c) {
			g(!0);
			return;
		}
		if (u === null) {
			u = e, Math.abs(n) <= i ? g(!0) : h();
			return;
		}
		let s = Math.min(Math.max((e - u) / 1e3, 0), le);
		u = e;
		let d = Math.exp(-r * s), f = n * (1 - d) / r, p = t + f, m = a !== void 0 && p <= a && n < 0;
		if (m || o !== void 0 && p >= o && n > 0) {
			let e = m ? a : o;
			if (e === void 0) return;
			t = e, n = 0, g();
		} else t = p, n *= d, Math.abs(n) <= i ? g(!0) : h();
	}), { cancel: () => {
		l && (l = !1, m());
	} };
}
// src/core/animation-timeline.ts
var fe = /* @__PURE__ */ new WeakMap();
function pe() {
	let e = /* @__PURE__ */ Error("Animation timeline was cancelled");
	return e.name = "AbortError", e;
}
function me(e) {
	if (typeof e != "string" || !/^[A-Za-z_][A-Za-z0-9_-]*$/.test(e)) throw TypeError(`Invalid timeline label "${String(e)}"; use letters, numbers, "_" or "-"`);
}
function he(e) {
	if (e !== void 0 && (typeof e != "number" || !Number.isFinite(e))) throw RangeError(`Timeline position offset must be a finite number, received ${String(e)}`);
}
function ge(e) {
	if (typeof e == "number") {
		if (!Number.isFinite(e) || e < 0) throw RangeError(`Timeline step position must be a finite number >= 0, received ${String(e)}`);
	} else if (typeof e == "string") me(e);
	else if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Timeline step position must be a number, label, or relative position");
	else if ("label" in e) me(e.label), he(e.offset);
	else if ("previous" in e) {
		if (e.previous !== "start" && e.previous !== "end") throw TypeError("Relative timeline position \"previous\" must be \"start\" or \"end\"");
		he(e.offset);
	} else throw TypeError("Timeline step position must specify a label or previous step");
}
function _e(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Animation timeline step must be an object");
	if (ge(e.at), e.options !== void 0 && (e.options === null || typeof e.options != "object")) throw TypeError("Timeline step options must be an object");
}
function ve(e) {
	let t = Object.fromEntries(Object.entries(e.properties).map(([e, t]) => [e, [t[0], t[1]]]));
	return {
		target: e.target,
		properties: t,
		at: typeof e.at == "object" ? { ...e.at } : e.at,
		...e.options ? { options: { ...e.options } } : {}
	};
}
function ye(e) {
	if (e.child) return e.child.duration;
	let t = e.step?.options, n = t?.duration ?? 1e3;
	return (t?.delay ?? 0) + n / (t?.playbackRate ?? 1);
}
function be(e, t, n) {
	let r;
	if (typeof e == "number") r = e;
	else if (typeof e == "string") {
		let n = t.get(e);
		if (n === void 0) throw ReferenceError(`Unresolved timeline label "${e}"`);
		r = n;
	} else if ("label" in e) {
		let n = t.get(e.label);
		if (n === void 0) throw ReferenceError(`Unresolved timeline label "${e.label}"`);
		r = n + (e.offset ?? 0);
	} else {
		if (!n) throw RangeError("The first timeline entry cannot be positioned relative to a previous entry");
		r = (e.previous === "start" ? n.startAt : n.startAt + ye(n)) + (e.offset ?? 0);
	}
	if (!Number.isFinite(r) || r < 0) throw RangeError(`Resolved timeline position must be finite and >= 0, received ${String(r)}`);
	return r;
}
function xe(e, t, n = /* @__PURE__ */ new Set()) {
	return e === t || !n.has(e) && (n.add(e), e.entries.some((e) => e.child !== void 0 && xe(e.child, t, n)));
}
function Se() {
	let e = [], t = /* @__PURE__ */ new Map(), n = /* @__PURE__ */ new Set(), r = /* @__PURE__ */ new Set(), i = () => void 0, a = () => void 0, o, s = !1, c = !1, l = !1, u = !1, d = 0, f = 0, p = 0, m = 0, h = 1, g = 0, _ = 0, v = () => {
		o = new Promise((e, t) => {
			i = e, a = t;
		});
	};
	v();
	let b = () => typeof performance < "u" && typeof performance.now == "function" ? performance.now() : Date.now(), x = () => d + (u ? 0 : Math.max(0, b() - f) * h), S = () => {
		for (let t of e) t.timer !== null && (clearTimeout(t.timer), t.timer = null);
	}, C, w, T = (e, t = !0, i = !0) => {
		if (e.control) {
			e.suppressCancel = i, n.delete(e.control);
			let t = e.control;
			e.control = null, t.cancel();
		}
		e.child && t && (e.child.played || e.child.settled) ? (r.delete(e.child.controls), e.child.resetNested()) : e.child && !t && e.child.played && !e.child.settled && (r.delete(e.child.controls), e.child.controls.cancel()), e.started = !1, e.done && (e.done = !1, p--);
	}, E = (t = !1) => {
		let i = [];
		for (let n of e) try {
			n.control || n.child?.played && !n.child.settled ? T(n, t, t) : n.child && t && n.child.settled && n.child.resetNested();
		} catch (e) {
			i.push(e);
		}
		if (n.clear(), r.clear(), i.length > 0) throw AggregateError(i, "Animation timeline cleanup failed");
	}, D = (e, t = g) => {
		if (!(s || t !== g)) {
			s = !0, w.settled = !0, S();
			try {
				E(!1), a(e);
			} catch (t) {
				a(AggregateError([e, t], "Animation timeline failed during cleanup"));
			}
		}
	}, O = (t) => {
		s || t.done || (t.done = !0, p++, p === e.length && (s = !0, w.settled = !0, i()));
	}, k = (e, t = 0, i = !1) => {
		if (e.timer = null, s || c || u && !i || e.started) return;
		e.started = !0;
		let a = g;
		if (e.child) {
			let n = e.child.controls;
			e.child.settled && e.child.resetNested(), n.setPlaybackRate(h), r.add(n);
			let i = e.child.generation;
			n.finished.then(() => {
				r.delete(n), a === g && i === e.child?.generation && O(e);
			}, (t) => {
				r.delete(n), i === e.child?.generation && D(t, a);
			});
			try {
				t > 0 && n.seek(t), e.child.startNested(), u && n.pause();
			} catch (e) {
				D(e, a);
			}
			return;
		}
		let o = e.step;
		if (!o) {
			D(/* @__PURE__ */ Error("Timeline entry has no animation step"), a);
			return;
		}
		let l = o.options?.delay ?? 0, d = o.options?.duration ?? 1e3, f = o.options?.playbackRate ?? 1, p = Math.max(0, t - l), m = d === 0 ? +(t >= l) : Math.min(1, p * f / d), _ = {
			...o.options,
			delay: Math.max(0, l - t) / h,
			playbackRate: f * h,
			onStart: () => {
				try {
					o.options?.onStart?.();
				} catch (e) {
					throw D(e, a), e;
				}
			},
			onUpdate: (e) => {
				try {
					o.options?.onUpdate?.(e);
				} catch (e) {
					throw D(e, a), e;
				}
			},
			onComplete: () => {
				try {
					if (o.options?.onComplete?.(), a !== g) return;
					e.control && n.delete(e.control), O(e);
				} catch (e) {
					throw D(e, a), e;
				}
			},
			onCancel: () => {
				e.suppressCancel || o.options?.onCancel?.(), e.suppressCancel = !1;
			}
		};
		try {
			e.control = y(o.target, o.properties, _), (m > 0 || d === 0 && t >= l) && e.control.seek(m), n.add(e.control), u && e.control.pause();
		} catch (e) {
			D(e, a);
		}
	}, A = () => {
		if (!l || u || s) return;
		let t = x();
		for (let n of e) {
			if (n.started || n.timer !== null) continue;
			let e = Math.max(0, n.startAt - t);
			n.timer = setTimeout(() => k(n, Math.max(0, x() - n.startAt)), e / h);
		}
	}, ee = () => {
		m = 0;
		for (let n = 0; n < e.length; n++) {
			let r = e[n];
			r && (r.child && r.child.resolvePositions(), r.startAt = be(r.position, t, e[n - 1]), m = Math.max(m, r.startAt + ye(r)));
		}
		return m;
	}, te = (t) => {
		let n = a;
		g++, S(), E(!0), s = !1, c = !1, l = !1, u = !1, p = 0, d = 0, _ = 0;
		for (let t of e) t.started = !1, t.done = !1, t.control = null, t.suppressCancel = !1;
		v(), w.played = !1, w.settled = !1, w.cancelled = !1, w.generation = g, t && n(pe());
	}, ne = (t) => {
		if (!t && w.parent) throw Error("A nested timeline can only be played by its parent");
		if (!(l || s || c)) {
			if (l = !0, w.played = !0, e.length === 0) s = !0, w.settled = !0, i();
			else {
				try {
					w.resolvePositions();
				} catch (e) {
					D(e);
					return;
				}
				d = _, f = b(), A();
			}
		}
	};
	return C = {
		get finished() {
			return o;
		},
		add: (t) => {
			if (l || s || c || w.parent) throw Error("Cannot add steps after timeline playback has started or nesting");
			return _e(t), e.push({
				position: typeof t.at == "object" ? { ...t.at } : t.at,
				step: ve(t),
				startAt: 0,
				timer: null,
				started: !1,
				done: !1,
				control: null,
				suppressCancel: !1
			}), C;
		},
		addTimeline: (t, n) => {
			if (l || s || c) throw Error("Cannot add timelines after timeline playback has started");
			ge(n);
			let r = fe.get(t);
			if (!r) throw TypeError("Nested timeline must be created by createTimeline()");
			if (r === w || xe(r, w)) throw TypeError("Circular timeline nesting is not allowed");
			if (w.parent) throw Error("Cannot add timelines after timeline playback has started or nesting");
			if (r.played || r.settled || r.cancelled || r.parent) throw TypeError("A timeline can only be nested once, before playback starts");
			return r.parent = w, e.push({
				position: typeof n == "object" ? { ...n } : n,
				child: r,
				startAt: 0,
				timer: null,
				started: !1,
				done: !1,
				control: null,
				suppressCancel: !1
			}), C;
		},
		addLabel: (e, n) => {
			if (l || s || c || w.parent) throw Error("Cannot add labels after timeline playback has started or nesting");
			if (me(e), typeof n != "number" || !Number.isFinite(n) || n < 0) throw RangeError(`Timeline label position must be a finite number >= 0, received ${String(n)}`);
			if (t.has(e)) throw TypeError(`Timeline label "${e}" is already defined`);
			return t.set(e, n), C;
		},
		play: () => ne(!1),
		pause: () => {
			if (!(!l || s || u)) {
				d = x(), u = !0, S();
				for (let e of n) e.pause();
				for (let e of r) e.pause();
			}
		},
		resume: () => {
			if (u && !s) {
				u = !1, f = b();
				for (let e of n) e.resume();
				for (let e of r) e.resume();
				A();
			}
		},
		seek: (t) => {
			if (typeof t != "number" || !Number.isFinite(t) || t < 0) throw RangeError(`Timeline seek time must be a finite number >= 0, received ${String(t)}`);
			if (s) throw Error("Cannot seek a completed timeline; call restart() first");
			if (c) throw Error("Cannot seek a cancelled timeline; call restart() first");
			if (_ = t, !l) {
				d = t;
				return;
			}
			let i = u;
			u || C.pause(), d = t, f = b();
			for (let r of e) {
				r.timer !== null && (clearTimeout(r.timer), r.timer = null);
				let e = t - r.startAt;
				if (r.child) {
					e < 0 ? T(r) : (r.started = !1, r.done && (r.done = !1, p--), r.child.settled && r.child.resetNested(), r.child.controls.seek(e), k(r, e, !0));
					continue;
				}
				let i = r.step;
				if (!i || e < 0) {
					T(r);
					continue;
				}
				let a = i.options?.delay ?? 0;
				if (e < a && r.control && T(r), r.done && (r.done = !1, p--), r.control && e >= a) {
					let t = i.options?.duration ?? 1e3, o = i.options?.playbackRate ?? 1, s = t === 0 ? 1 : Math.min(1, (e - a) * o / t);
					r.control.seek(s), s < 1 && n.add(r.control);
				} else r.started = !1, k(r, e, !0);
			}
			if (!i) {
				u = !1, f = b();
				for (let e of n) e.resume();
				for (let e of r) e.resume();
				A();
			}
		},
		restart: () => {
			if (w.parent) throw Error("A nested timeline can only be restarted by its parent");
			te(!0), ne(!1);
		},
		setPlaybackRate: (t) => {
			if (typeof t != "number" || !Number.isFinite(t) || t <= 0) throw RangeError(`playbackRate must be a finite number > 0, received ${String(t)}`);
			l && !u && (d = x(), f = b()), h = t;
			for (let t of e) t.control && !t.done && t.control.setPlaybackRate((t.step?.options?.playbackRate ?? 1) * h), t.child && t.started && t.child.controls.setPlaybackRate(h);
			l && !u && (S(), A());
		},
		getPlaybackRate: () => h,
		cancel: () => {
			s || c || (c = !0, w.cancelled = !0, S(), D(pe()));
		}
	}, w = {
		controls: C,
		entries: e,
		labels: t,
		parent: null,
		played: !1,
		settled: !1,
		cancelled: !1,
		generation: g,
		duration: m,
		resolvePositions: () => {
			let e = ee();
			return w.duration = e, e;
		},
		startNested: () => ne(!0),
		pause: () => C.pause(),
		resume: () => C.resume(),
		cancel: () => C.cancel(),
		resetNested: () => te(!0),
		setPlaybackRate: (e) => C.setPlaybackRate(e)
	}, fe.set(C, w), C;
}
// src/core/animation-sequence.ts
function Ce() {
	let e = /* @__PURE__ */ Error("Animation sequence was cancelled");
	return e.name = "AbortError", e;
}
function we(e, t = {}) {
	if (!Array.isArray(e)) throw TypeError("steps must be an array");
	if (typeof t != "object" || !t) throw TypeError("options must be an object");
	if (t.onComplete !== void 0 && typeof t.onComplete != "function") throw TypeError("onComplete must be a function");
	if (t.onStart !== void 0 && typeof t.onStart != "function") throw TypeError("onStart must be a function");
	if (t.onCancel !== void 0 && typeof t.onCancel != "function") throw TypeError("onCancel must be a function");
	let n = () => void 0, r = () => void 0, i = new Promise((e, t) => {
		n = e, r = t;
	}), a = null, o = 0, s = !1, c = !1, l = !1, u = null, d = !1, f = (e) => {
		s || (s = !0, a = null, r(e));
	}, p = () => {
		if (c || s) return;
		if (o >= e.length) {
			try {
				if (t.onComplete?.(), c || s) return;
				s = !0, n();
			} catch (e) {
				f(e);
			}
			return;
		}
		let r = e[o++];
		if (!r || typeof r != "object") f(/* @__PURE__ */ TypeError(`Animation sequence step ${o - 1} must be an object`));
		else try {
			a = y(r.target, r.properties, {
				...r.options,
				...u === null ? {} : { playbackRate: u },
				onStart: () => {
					try {
						d || (d = !0, t.onStart?.()), r.options?.onStart?.();
					} catch (e) {
						throw f(e), e;
					}
				},
				onUpdate: (e) => {
					try {
						r.options?.onUpdate?.(e);
					} catch (e) {
						throw f(e), e;
					}
				},
				onComplete: () => {
					a = null;
					try {
						r.options?.onComplete?.(), !c && !s && p();
					} catch (e) {
						f(e);
					}
				}
			}), l && a.pause();
		} catch (e) {
			f(e);
		}
	};
	return p(), {
		finished: i,
		pause: () => {
			s || l || (l = !0, a?.pause());
		},
		resume: () => {
			!s && l && (l = !1, a?.resume());
		},
		reverse: () => {
			s || a?.reverse();
		},
		setPlaybackRate: (e) => {
			Te(e), u = e, a?.setPlaybackRate(e);
		},
		getPlaybackRate: () => a?.getPlaybackRate() ?? u ?? 1,
		cancel: () => {
			if (s || c) return;
			c = !0;
			let e = a;
			f(Ce());
			try {
				e?.cancel();
			} finally {
				a = null, t.onCancel?.();
			}
		}
	};
}
function Te(e) {
	if (typeof e != "number" || !Number.isFinite(e) || e <= 0) throw RangeError(`playbackRate must be a finite number > 0, received ${String(e)}`);
}
// src/core/animation-presets.ts
var Ee = Object.freeze({
	fadeIn: N({
		properties: { opacity: [0, 1] },
		options: {
			duration: 400,
			easing: k
		}
	}),
	fadeOut: N({
		properties: { opacity: [1, 0] },
		options: {
			duration: 300,
			easing: k
		}
	}),
	slideUp: N({
		properties: {
			opacity: [0, 1],
			transform: ["translateY(24px)", "translateY(0px)"]
		},
		options: {
			duration: 500,
			easing: o
		}
	}),
	slideDown: N({
		properties: {
			opacity: [0, 1],
			transform: ["translateY(-24px)", "translateY(0px)"]
		},
		options: {
			duration: 500,
			easing: o
		}
	}),
	scaleIn: N({
		properties: {
			opacity: [0, 1],
			transform: ["scale(0.9)", "scale(1)"]
		},
		options: {
			duration: 400,
			easing: o
		}
	}),
	scaleOut: N({
		properties: {
			opacity: [1, 0],
			transform: ["scale(1)", "scale(0.9)"]
		},
		options: {
			duration: 300,
			easing: k
		}
	})
}), De = new Set(Object.keys(Ee)), Oe = /* @__PURE__ */ new Map(), ke = /* @__PURE__ */ new Map();
function M(e) {
	if (typeof e != "string" || e.trim() === "" || e !== e.trim()) throw TypeError("Animation preset name must be a non-empty string without surrounding whitespace");
}
function Ae(e) {
	let t = Object.create(null);
	for (let [n, r] of Object.entries(e.properties)) t[n] = Object.freeze([r[0], r[1]]);
	let n = e.options ? { ...e.options } : void 0;
	return Object.freeze({
		properties: Object.freeze(t),
		...n ? { options: Object.freeze(n) } : {}
	});
}
function N(e) {
	let t = Object.create(null);
	for (let [n, r] of Object.entries(e.properties)) t[n] = Object.freeze([r[0], r[1]]);
	return Object.freeze({
		properties: Object.freeze(t),
		...e.options ? { options: Object.freeze({ ...e.options }) } : {}
	});
}
function je(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Animation preset must be an object");
	if (e.properties === null || typeof e.properties != "object" || Array.isArray(e.properties) || Object.keys(e.properties).length === 0) throw TypeError("Animation preset properties must be a non-empty object");
	for (let [t, n] of Object.entries(e.properties)) {
		if (!Array.isArray(n) || n.length !== 2) throw TypeError(`Animation preset property "${t}" must be a [from, to] pair`);
		for (let e of n) if ((typeof e != "string" || e.trim() === "") && (typeof e != "number" || !Number.isFinite(e))) throw TypeError(`Animation preset property "${t}" contains an invalid value`);
	}
	if (e.options !== void 0 && (e.options === null || typeof e.options != "object" || Array.isArray(e.options))) throw TypeError("Animation preset options must be an object");
}
function Me(e) {
	return Object.freeze({
		steps: Object.freeze(e.steps.map((e) => Object.freeze({
			preset: e.preset,
			...e.overrides ? { overrides: Object.freeze({ ...e.overrides }) } : {}
		}))),
		...e.options ? { options: Object.freeze({ ...e.options }) } : {}
	});
}
function Ne(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Animation sequence preset must be an object");
	if (!Array.isArray(e.steps) || e.steps.length === 0) throw TypeError("Animation sequence preset steps must be a non-empty array");
	for (let [t, n] of e.steps.entries()) {
		if (typeof n != "object" || !n || Array.isArray(n)) throw TypeError(`Animation sequence preset step ${t} must be an object`);
		if (M(n.preset), !Pe(n.preset)) throw TypeError(`Unknown animation preset "${n.preset}" in sequence preset`);
		if (n.overrides !== void 0 && (n.overrides === null || typeof n.overrides != "object" || Array.isArray(n.overrides))) throw TypeError(`Animation sequence preset step ${t} overrides must be an object`);
	}
	if (e.options !== void 0 && (e.options === null || typeof e.options != "object" || Array.isArray(e.options))) throw TypeError("Animation sequence preset options must be an object");
}
function Pe(e) {
	M(e);
	let t = Object.prototype.hasOwnProperty.call(Ee, e) ? Ee[e] : Oe.get(e);
	return t ? Ae(t) : void 0;
}
function Fe(e) {
	M(e);
	let t = ke.get(e);
	return t ? Me(t) : void 0;
}
function Ie(e, t) {
	if (M(e), je(t), De.has(e)) throw TypeError(`Cannot replace built-in animation preset "${e}"`);
	Oe.set(e, N(t));
}
function Le(e, t) {
	M(e), Ne(t), ke.set(e, Me(t));
}
function Re(e) {
	return M(e), !De.has(e) && Oe.delete(e);
}
function ze(e) {
	return M(e), ke.delete(e);
}
var Be = Object.freeze({
	get: Pe,
	register: Ie,
	remove: Re
}), Ve = Object.freeze({
	get: Fe,
	register: Le,
	remove: ze
});
function He(e, t, n = {}) {
	if (typeof n != "object" || !n || Array.isArray(n)) throw TypeError("Animation preset overrides must be an object");
	let r = Pe(t);
	if (!r) throw TypeError(`Unknown animation preset "${t}"`);
	let i = {};
	for (let [e, t] of Object.entries(r.properties)) i[e] = [t[0], t[1]];
	return y(e, i, {
		...r.options,
		...n
	});
}
function Ue(e, t, n = {}) {
	if (typeof n != "object" || !n || Array.isArray(n)) throw TypeError("Animation sequence preset overrides must be an object");
	let r = Fe(t);
	if (!r) throw TypeError(`Unknown animation sequence preset "${t}"`);
	if (n.steps !== void 0 && !Array.isArray(n.steps)) throw TypeError("Animation sequence preset step overrides must be an array");
	if ((n.steps?.length ?? 0) > r.steps.length) throw RangeError("Animation sequence preset has more step overrides than steps");
	let i = r.steps.map((r, i) => {
		let a = Pe(r.preset);
		if (!a) throw TypeError(`Unknown animation preset "${r.preset}" in sequence preset "${t}"`);
		let o = {};
		for (let [e, t] of Object.entries(a.properties)) o[e] = [t[0], t[1]];
		return {
			target: e,
			properties: o,
			options: {
				...a.options,
				...r.overrides,
				...n.steps?.[i]
			}
		};
	}), { steps: a, ...o } = n;
	return we(i, {
		...r.options,
		...o
	});
}
// src/core/motion-dna.ts
var We = /* @__PURE__ */ new Map();
function Ge(e) {
	if (typeof e != "string" || e.trim() === "" || e !== e.trim()) throw TypeError("Motion DNA name must be a non-empty string without surrounding whitespace");
}
function Ke(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Motion DNA must be an object");
	for (let [t, n] of Object.entries(e)) {
		if (![
			"duration",
			"delay",
			"playbackRate",
			"respectReducedMotion",
			"easing"
		].includes(t)) throw TypeError(`Unknown Motion DNA option "${t}"`);
		if (t === "duration" || t === "delay") {
			if (typeof n != "number" || !Number.isFinite(n) || n < 0) throw RangeError(`${t} must be a finite number >= 0, received ${String(n)}`);
		} else if (t === "playbackRate") {
			if (typeof n != "number" || !Number.isFinite(n) || n <= 0) throw RangeError(`playbackRate must be a finite number > 0, received ${String(n)}`);
		} else if (t === "respectReducedMotion") {
			if (typeof n != "boolean") throw TypeError(`respectReducedMotion must be a boolean, received ${String(n)}`);
		} else if (t === "easing") {
			if (typeof n != "string" && typeof n != "function") throw TypeError("easing must be a function or a registered easing name");
			i(n);
		}
	}
}
function qe(e) {
	return Object.freeze({ ...e });
}
function Je(e) {
	Ge(e);
	let t = We.get(e);
	return t ? qe(t) : void 0;
}
function Ye(e, t) {
	Ge(e), Ke(t), We.set(e, qe(t));
}
function Xe(e) {
	return Ge(e), We.delete(e);
}
function P(e, t = {}) {
	if (typeof t != "object" || !t || Array.isArray(t)) throw TypeError("Motion DNA overrides must be an object");
	Ke(t);
	let n = Je(e);
	if (!n) throw TypeError(`Unknown Motion DNA "${e}"`);
	return {
		...n,
		...t
	};
}
var Ze = Object.freeze({
	get: Je,
	register: Ye,
	remove: Xe
});
// src/core/adaptive-motion.ts
function Qe(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t <= 0 || t > 1) throw RangeError(`${e} must be a finite number > 0 and <= 1, received ${String(t)}`);
}
function $e(e) {
	for (let [t, n] of Object.entries(e)) {
		if (![
			"duration",
			"delay",
			"playbackRate",
			"respectReducedMotion",
			"easing"
		].includes(t)) throw TypeError(`Unknown animation option "${t}"`);
		if (t === "duration" || t === "delay") {
			if (typeof n != "number" || !Number.isFinite(n) || n < 0) throw RangeError(`${t} must be a finite number >= 0, received ${String(n)}`);
		} else if (t === "playbackRate") {
			if (typeof n != "number" || !Number.isFinite(n) || n <= 0) throw RangeError(`playbackRate must be a finite number > 0, received ${String(n)}`);
		} else if (t === "respectReducedMotion") {
			if (typeof n != "boolean") throw TypeError("respectReducedMotion must be a boolean");
		} else if (t === "easing") {
			if (typeof n != "string" && typeof n != "function") throw TypeError("easing must be a function or a registered easing name");
			i(n);
		}
	}
}
function et(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Adaptive motion profile must be an object");
	if (e.intensity !== void 0 && Qe("intensity", e.intensity), e.lowPowerIntensity !== void 0 && Qe("lowPowerIntensity", e.lowPowerIntensity), e.reducedMotion !== void 0 && e.reducedMotion !== "respect" && e.reducedMotion !== "ignore") throw TypeError("reducedMotion must be \"respect\" or \"ignore\"");
	let { motionDNA: t, intensity: n, lowPowerIntensity: r, reducedMotion: i, ...a } = e;
	$e(a), e.motionDNA !== void 0 && P(e.motionDNA, a);
}
function tt(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Adaptive motion conditions must be an object");
	for (let t of ["reducedMotion", "lowPower"]) if (e[t] !== void 0 && typeof e[t] != "boolean") throw TypeError(`${t} condition must be a boolean`);
	e.intensity !== void 0 && Qe("condition intensity", e.intensity);
}
function nt(e, t = {}, n = {}) {
	if (et(e), tt(t), typeof n != "object" || !n || Array.isArray(n)) throw TypeError("Adaptive motion overrides must be an object");
	$e(n);
	let { motionDNA: r, intensity: i, lowPowerIntensity: a, reducedMotion: o, ...s } = e, c = r ? P(r, s) : s, l = t.intensity ?? (t.lowPower ? a ?? i : i) ?? 1;
	return {
		...c,
		...l === 1 && c.duration === void 0 ? {} : { duration: (c.duration ?? 1e3) / l },
		...t.reducedMotion === !0 ? { respectReducedMotion: (o ?? "respect") === "respect" } : {},
		...n
	};
}
// src/core/effect-composer.ts
function rt(e) {
	if (typeof e != "object" || !e) return !1;
	let t = e;
	return typeof t.destroy == "function" || typeof t.cancel == "function";
}
function it(e) {
	"destroy" in e ? e.destroy() : e.cancel();
}
function at(e) {
	if (!Array.isArray(e)) throw TypeError("Effect composition entries must be an array");
	let t = [], n = !1, r = !1, i = (e) => {
		if (n || (e === "pause" ? r : !r)) return;
		r = e === "pause";
		let i = [];
		for (let n of t) try {
			n[e]?.();
		} catch (e) {
			i.push(e);
		}
		if (i.length > 0) throw AggregateError(i, `One or more composed effects failed to ${e}`);
	}, a = () => {
		if (n) return;
		n = !0;
		let e = [];
		for (let n of t.reverse()) try {
			it(n);
		} catch (t) {
			e.push(t);
		}
		if (t.length = 0, e.length > 0) throw AggregateError(e, "One or more composed effects failed to clean up");
	};
	try {
		for (let [n, r] of e.entries()) {
			if (typeof r != "object" || !r || typeof r.start != "function") throw TypeError(`Effect composition entry ${n} must provide a start function`);
			let e = "motionDNA" in r && r.motionDNA !== void 0 ? r.start(P(r.motionDNA.name, r.motionDNA.overrides)) : r.start();
			if (!rt(e)) throw TypeError(`Effect composition entry ${n} must return destroy() or cancel() controls`);
			t.push(e);
		}
	} catch (e) {
		try {
			a();
		} catch (t) {
			throw AggregateError([e, t], "Effect composition failed to start and clean up");
		}
		throw e;
	}
	return {
		destroy: a,
		cancel: a,
		pause: () => i("pause"),
		resume: () => i("resume")
	};
}
// src/core/motion-choreography.ts
function ot(e) {
	let t = {};
	for (let [n, r] of Object.entries(e.properties)) t[n] = [r[0], r[1]];
	return {
		type: "animation",
		target: e.target,
		properties: t,
		...e.options ? { options: { ...e.options } } : {},
		...e.motionDNA ? { motionDNA: {
			name: e.motionDNA.name,
			...e.motionDNA.overrides ? { overrides: { ...e.motionDNA.overrides } } : {}
		} } : {}
	};
}
function st(e) {
	return "motionDNA" in e && e.motionDNA !== void 0 ? {
		start: e.start,
		motionDNA: {
			name: e.motionDNA.name,
			...e.motionDNA.overrides ? { overrides: { ...e.motionDNA.overrides } } : {}
		}
	} : { start: e.start };
}
function ct(e, t = !1) {
	if (!Array.isArray(e)) throw TypeError("Choreography actions must be an array");
	if (!t && e.length === 0) throw TypeError("Choreography actions must not be empty");
	return e.map((e, t) => {
		if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError(`Choreography action ${t} must be an object`);
		if (e.type === "animation") return ot(e);
		if (e.type === "branch") {
			if (typeof e.condition != "function") throw TypeError(`Choreography branch ${t} condition must be a function`);
			if (!Array.isArray(e.then) || e.else !== void 0 && !Array.isArray(e.else)) throw TypeError(`Choreography branch ${t} paths must be arrays`);
			return {
				type: "branch",
				condition: e.condition,
				then: ct(e.then, !0),
				...e.else === void 0 ? {} : { else: ct(e.else, !0) }
			};
		}
		if (e.type !== "parallel" || !Array.isArray(e.actions) || e.actions.length === 0) throw TypeError(`Choreography action ${t} must be an animation or non-empty parallel group`);
		let n = e.actions.map((e, t) => {
			if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError(`Parallel action ${t} must be an object`);
			if (e.type === "animation") return ot(e);
			if (e.type === "effect" && e.effect && typeof e.effect == "object") return {
				type: "effect",
				effect: st(e.effect)
			};
			throw TypeError(`Parallel action ${t} must be an animation or effect`);
		});
		if (!n.some((e) => e.type === "animation")) throw TypeError("A parallel group must include at least one animation to define its duration");
		return {
			type: "parallel",
			actions: n
		};
	});
}
function lt(e) {
	let t = e.motionDNA ? P(e.motionDNA.name, e.motionDNA.overrides) : {};
	return {
		target: e.target,
		properties: e.properties,
		options: {
			...t,
			...e.options
		}
	};
}
function ut() {
	let e = /* @__PURE__ */ Error("Motion choreography was cancelled");
	return e.name = "AbortError", e;
}
function dt(e) {
	let t = ct(e), n = () => void 0, r = () => void 0, i = new Promise((e, t) => {
		n = e, r = t;
	}), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = !1, c = !1, l = !1, u = () => {
		let e = [];
		for (let t of a) try {
			t.cancel();
		} catch (t) {
			e.push(t);
		}
		a.clear();
		for (let t of o) try {
			t.destroy();
		} catch (t) {
			e.push(t);
		}
		if (o.clear(), e.length > 0) throw AggregateError(e, "Motion choreography cleanup failed");
	}, d = async (e) => {
		let t = we([lt(e)]);
		a.add(t), l && t.pause();
		try {
			await t.finished;
		} finally {
			a.delete(t);
		}
	}, f = async (e) => {
		let t = e.actions.filter((e) => e.type === "effect").map((e) => e.effect), n = t.length > 0 ? at(t) : null;
		n && o.add(n);
		let r = [], i, s = !1;
		try {
			for (let t of e.actions) {
				if (t.type !== "animation") continue;
				let e = we([lt(t)]);
				r.push(e), a.add(e), l && e.pause();
			}
			await Promise.all(r.map((e) => e.finished));
		} catch (e) {
			s = !0, i = e;
		}
		let c = [];
		for (let e of r) try {
			e.cancel();
		} catch (e) {
			c.push(e);
		} finally {
			a.delete(e);
		}
		if (n) {
			o.delete(n);
			try {
				n.destroy();
			} catch (e) {
				c.push(e);
			}
		}
		if (s) throw c.length > 0 ? AggregateError([i, ...c], "Parallel choreography action failed") : i;
		if (c.length > 0) throw AggregateError(c, "Parallel choreography cleanup failed");
	}, p = async (e) => {
		for (let t of e) {
			if (s) return;
			if (t.type === "animation") await d(t);
			else if (t.type === "parallel") await f(t);
			else {
				let e = t.condition();
				if (typeof e != "boolean") throw TypeError("Motion choreography branch condition must return a boolean");
				await p(e ? t.then : t.else ?? []);
			}
		}
	};
	return (async () => {
		try {
			if (await p(t), s) return;
			c = !0, n();
		} catch (e) {
			if (s) return;
			c = !0;
			try {
				u();
			} catch (t) {
				r(AggregateError([e, t], "Motion choreography failed"));
				return;
			}
			r(e);
		}
	})(), {
		finished: i,
		pause: () => {
			if (!(s || c || l)) {
				l = !0;
				for (let e of a) e.pause();
				for (let e of o) e.pause();
			}
		},
		resume: () => {
			if (!(s || c || !l)) {
				l = !1;
				for (let e of a) e.resume();
				for (let e of o) e.resume();
			}
		},
		cancel: () => {
			if (s || c) return;
			s = !0;
			let e = (() => {
				try {
					u();
					return;
				} catch (e) {
					return e;
				}
			})();
			r(e ? AggregateError([ut(), e], "Motion choreography was cancelled with cleanup errors") : ut());
		}
	};
}
// src/core/motion-recipe.ts
function ft(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Motion recipe definition must be an object");
	if (e.effects !== void 0 && typeof e.effects != "function") throw TypeError("Motion recipe effects must be a function");
	if (e.choreography !== void 0 && typeof e.choreography != "function") throw TypeError("Motion recipe choreography must be a function");
	if (e.effects === void 0 && e.choreography === void 0) throw TypeError("Motion recipe must define effects or choreography");
	if (e.motionDNA !== void 0 && !Array.isArray(e.motionDNA)) throw TypeError("Motion recipe motionDNA must be an array of names");
	let t = /* @__PURE__ */ new Set();
	for (let n of e.motionDNA ?? []) {
		if (typeof n != "string" || n.trim() === "" || n !== n.trim()) throw TypeError("Motion recipe DNA names must be non-empty strings without surrounding whitespace");
		if (t.has(n)) throw TypeError(`Motion recipe declares duplicate DNA "${n}"`);
		t.add(n);
	}
}
function pt(e) {
	return Object.freeze({
		...e.motionDNA ? { motionDNA: Object.freeze([...e.motionDNA]) } : {},
		...e.effects ? { effects: e.effects } : {},
		...e.choreography ? { choreography: e.choreography } : {}
	});
}
function mt(e) {
	return ft(e), Object.freeze({ definition: pt(e) });
}
function ht(e, t) {
	if (typeof e != "object" || !e || e.definition === void 0) throw TypeError("recipe must be created with createMotionRecipe()");
	if (typeof t != "object" || !t || Array.isArray(t)) throw TypeError("Motion recipe parameters must be an object");
	let n = e.definition, r = new Set(n.motionDNA ?? []), i = Object.freeze({ motionDNA: (e, t = {}) => {
		if (!r.has(e)) throw TypeError(`Motion DNA "${e}" is not declared by this recipe`);
		return P(e, t);
	} }), a = Object.freeze({ ...t }), o = null, s = null, c = !1;
	try {
		let e = n.effects?.(a, i);
		e !== void 0 && (o = at(e));
		let t = n.choreography?.(a, i);
		t !== void 0 && (s = dt(t));
	} catch (e) {
		try {
			o?.destroy();
		} catch (t) {
			throw AggregateError([e, t], "Motion recipe failed to start and clean up");
		}
		throw e;
	}
	let l = () => {
		if (c) return;
		c = !0;
		let e = [];
		try {
			s?.cancel();
		} catch (t) {
			e.push(t);
		}
		try {
			o?.destroy();
		} catch (t) {
			e.push(t);
		}
		if (e.length > 0) throw AggregateError(e, "Motion recipe cleanup failed");
	}, u = () => {
		if (c) return;
		let e = [];
		try {
			s?.pause();
		} catch (t) {
			e.push(t);
		}
		try {
			o?.pause();
		} catch (t) {
			e.push(t);
		}
		if (e.length > 0) throw AggregateError(e, "Motion recipe pause failed");
	}, d = () => {
		if (c) return;
		let e = [];
		try {
			s?.resume();
		} catch (t) {
			e.push(t);
		}
		try {
			o?.resume();
		} catch (t) {
			e.push(t);
		}
		if (e.length > 0) throw AggregateError(e, "Motion recipe resume failed");
	}, f = s ? s.finished.catch((e) => {
		try {
			o?.destroy();
		} catch (t) {
			throw AggregateError([e, t], "Motion recipe choreography failed to clean up");
		}
		throw e;
	}) : void 0;
	return {
		...f ? { finished: f } : {},
		pause: u,
		resume: d,
		destroy: l,
		cancel: l
	};
}
// src/core/motion-states.ts
function gt(e) {
	return e.startsWith("--") ? e : e.replace(/[A-Z]/g, (e) => `-${e.toLowerCase()}`);
}
function _t(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Motion states must be an object");
	let t = /* @__PURE__ */ new Map();
	for (let [n, r] of Object.entries(e)) {
		if (n.trim() === "" || n !== n.trim()) throw TypeError("Motion state names must be non-empty strings without surrounding whitespace");
		if (typeof r != "object" || !r || Array.isArray(r)) throw TypeError(`Motion state "${n}" must be an object`);
		if (r.values === null || typeof r.values != "object" || Array.isArray(r.values) || Object.keys(r.values).length === 0) throw TypeError(`Motion state "${n}" values must be a non-empty object`);
		let e = {};
		for (let [t, i] of Object.entries(r.values)) {
			if (t.trim() === "") throw TypeError(`Motion state "${n}" has an empty property name`);
			if ((typeof i != "string" || i.trim() === "") && (typeof i != "number" || !Number.isFinite(i))) throw TypeError(`Motion state "${n}" property "${t}" has an invalid value`);
			e[t] = i;
		}
		t.set(n, Object.freeze({
			values: Object.freeze(e),
			...r.options ? { options: Object.freeze({ ...r.options }) } : {},
			...r.motionDNA ? { motionDNA: {
				name: r.motionDNA.name,
				...r.motionDNA.overrides ? { overrides: Object.freeze({ ...r.motionDNA.overrides }) } : {}
			} } : {}
		}));
	}
	if (t.size === 0) throw TypeError("At least one motion state is required");
	return t;
}
function vt() {
	let e = /* @__PURE__ */ Error("Motion state transition was cancelled");
	return e.name = "AbortError", e;
}
function yt(e, t, n = {}) {
	if (typeof n != "object" || !n || Array.isArray(n)) throw TypeError("Motion state controller options must be an object");
	let r = _t(t), i = D(e), a = n.initialState;
	if (a !== void 0 && !r.has(a)) throw TypeError(`Unknown motion state "${a}"`);
	let o = n.motionDNA ? P(n.motionDNA.name, n.motionDNA.overrides) : {}, s = /* @__PURE__ */ new Map();
	for (let e of i) {
		let t = /* @__PURE__ */ new Map();
		for (let n of r.values()) for (let r of Object.keys(n.values)) {
			let n = gt(r);
			t.has(n) || t.set(n, {
				value: e.style.getPropertyValue(n),
				priority: e.style.getPropertyPriority(n)
			});
		}
		s.set(e, t);
	}
	let c = () => {
		for (let [e, t] of s) for (let [n, r] of t) r.value === "" ? e.style.removeProperty(n) : e.style.setProperty(n, r.value, r.priority);
	}, l = (e) => {
		let t = r.get(e);
		if (t) for (let e of i) for (let [n, r] of Object.entries(t.values)) e.style.setProperty(gt(n), String(r));
	}, u = a, d = null, f = !1;
	a !== void 0 && l(a);
	let p = (e) => {
		let t = d;
		if (!t) return;
		d = null;
		let n = [];
		for (let e of t.controls) try {
			e.cancel();
		} catch (e) {
			n.push(e);
		}
		if (t.reject(e), n.length > 0) throw AggregateError(n, "Motion state transition cancellation failed");
	};
	return {
		get currentState() {
			return u;
		},
		transitionTo: (e, t = {}) => {
			if (f) throw Error("Motion state controller has been destroyed");
			let n = r.get(e);
			if (!n) throw TypeError(`Unknown motion state "${e}"`);
			p(vt());
			let { motionDNA: a, onComplete: s, onCancel: c, ...l } = t, m = a ? P(a.name, a.overrides) : {}, h = n.motionDNA ? P(n.motionDNA.name, n.motionDNA.overrides) : {}, g = Object.entries(n.values), _ = () => void 0, v = () => void 0, b = new Promise((e, t) => {
				_ = e, v = t;
			}), x = !1, S = [], C = i.length, w = () => {
				if (!(x || --C > 0)) {
					x = !0, d = null, u = e;
					try {
						s?.(), _();
					} catch (e) {
						v(e);
					}
				}
			}, T = () => {
				if (!x) {
					x = !0, d = null;
					try {
						c?.();
					} finally {
						v(vt());
					}
				}
			};
			try {
				for (let [e, r] of i.entries()) {
					let i = {};
					for (let [e, t] of g) {
						let n = gt(e);
						i[e] = [r.style.getPropertyValue(n) || (typeof getComputedStyle == "function" ? getComputedStyle(r).getPropertyValue(n) : "") || String(t), t];
					}
					let a = y(r, i, {
						...o,
						...h,
						...m,
						...n.options,
						...l,
						onStart: e === 0 ? t.onStart : void 0,
						onUpdate: e === 0 ? t.onUpdate : void 0,
						onComplete: w,
						onCancel: T
					});
					S.push(a);
				}
			} catch (e) {
				x = !0;
				let t = [];
				for (let e of S) try {
					e.cancel();
				} catch (e) {
					t.push(e);
				}
				throw t.length > 0 ? AggregateError([e, ...t], "Motion state transition failed to start cleanly") : e;
			}
			return i.length > 0 ? d = {
				controls: S,
				reject: v
			} : (x = !0, u = e, _()), {
				finished: b,
				cancel: () => {
					if (!x) {
						if (d?.controls === S) p(vt());
						else {
							x = !0, S.forEach((e) => e.cancel());
							try {
								t.onCancel?.();
							} finally {
								v(vt());
							}
						}
					}
				}
			};
		},
		destroy: () => {
			f || (f = !0, p(vt()), c(), u = void 0);
		}
	};
}
// src/core/animation-parallel.ts
function bt() {
	let e = /* @__PURE__ */ Error("Parallel animations were cancelled");
	return e.name = "AbortError", e;
}
function xt(e, t = {}) {
	if (!Array.isArray(e)) throw TypeError("steps must be an array");
	if (typeof t != "object" || !t) throw TypeError("options must be an object");
	if (t.onComplete !== void 0 && typeof t.onComplete != "function") throw TypeError("onComplete must be a function");
	if (t.onStart !== void 0 && typeof t.onStart != "function") throw TypeError("onStart must be a function");
	if (t.onCancel !== void 0 && typeof t.onCancel != "function") throw TypeError("onCancel must be a function");
	let n = () => void 0, r = () => void 0, i = new Promise((e, t) => {
		n = e, r = t;
	}), a = /* @__PURE__ */ new Set(), o = /* @__PURE__ */ new Set(), s = !1, c = !1, l = !1, u = null, d = !1, f = () => {
		let e, t = !1;
		for (let n of a) try {
			n.cancel();
		} catch (n) {
			t || (e = n), t = !0;
		}
		if (a.clear(), t) throw e;
	}, p = (e) => {
		if (!s) {
			s = !0;
			try {
				f();
			} finally {
				r(e);
			}
		}
	}, m = () => {
		if (!(s || o.size !== e.length)) try {
			if (t.onComplete?.(), c || s) return;
			s = !0, n();
		} catch (e) {
			p(e);
		}
	};
	return e.length === 0 ? m() : e.forEach((e, n) => {
		if (s || c) return;
		if (!e || typeof e != "object") {
			p(/* @__PURE__ */ TypeError(`Animation parallel step ${n} must be an object`));
			return;
		}
		let r;
		try {
			r = y(e.target, e.properties, {
				...e.options,
				...u === null ? {} : { playbackRate: u },
				onStart: () => {
					try {
						d || (d = !0, t.onStart?.()), e.options?.onStart?.();
					} catch (e) {
						throw p(e), e;
					}
				},
				onUpdate: (t) => {
					try {
						e.options?.onUpdate?.(t);
					} catch (e) {
						throw p(e), e;
					}
				},
				onComplete: () => {
					if (!(s || c || o.has(n))) try {
						e.options?.onComplete?.(), o.add(n), a.delete(r), m();
					} catch (e) {
						p(e);
					}
				}
			});
		} catch (e) {
			p(e);
			return;
		}
		a.add(r), l && r.pause();
	}), {
		finished: i,
		pause: () => {
			if (!(s || l)) {
				l = !0;
				for (let e of a) e.pause();
			}
		},
		resume: () => {
			if (!s && l) {
				l = !1;
				for (let e of a) e.resume();
			}
		},
		reverse: () => {
			if (!s) for (let e of a) e.reverse();
		},
		setPlaybackRate: (e) => {
			St(e), u = e;
			for (let t of a) t.setPlaybackRate(e);
		},
		getPlaybackRate: () => a.values().next().value?.getPlaybackRate() ?? u ?? 1,
		cancel: () => {
			if (!(s || c)) {
				c = !0;
				try {
					p(bt());
				} finally {
					t.onCancel?.();
				}
			}
		}
	};
}
function St(e) {
	if (typeof e != "number" || !Number.isFinite(e) || e <= 0) throw RangeError(`playbackRate must be a finite number > 0, received ${String(e)}`);
}
// src/effects/stagger.ts
var Ct = {
	opacity: [0, 1],
	transform: ["translateY(24px)", "translateY(0px)"]
}, wt = 600, Tt = 100;
function Et(e, t = {}) {
	let { properties: n = Ct, duration: r = wt, delay: i = 0, stagger: a = Tt, from: o = "first", configure: s, easing: c, playbackRate: l, onComplete: u, respectReducedMotion: d } = t;
	if (typeof a != "number" || !Number.isFinite(a) || a < 0) throw RangeError(`stagger must be a finite number >= 0, received ${String(a)}`);
	if (o !== "first" && o !== "last") throw TypeError(`from must be "first" or "last", received ${String(o)}`);
	if (s !== void 0 && typeof s != "function") throw TypeError("configure must be a function");
	let f = {
		duration: r,
		delay: i,
		...c === void 0 ? {} : { easing: c },
		...l === void 0 ? {} : { playbackRate: l },
		...d === void 0 ? {} : { respectReducedMotion: d }
	}, p = D(e);
	if (p.length === 0) return y(e, n, f);
	if (!Number.isFinite(i + (p.length - 1) * a)) throw RangeError("delay plus stagger offsets must be finite");
	let m = p.length, h = () => {
		--m, m === 0 && u?.();
	}, g = [];
	try {
		p.forEach((e, t) => {
			let r = o === "first" ? t : p.length - 1 - t, c = s?.(e, t, r);
			if (c !== void 0 && (typeof c != "object" || !c || Array.isArray(c))) throw TypeError(`Stagger configuration for element ${t} must be an object`);
			let l = c?.options;
			if (l !== void 0 && (typeof l != "object" || !l || Array.isArray(l))) throw TypeError(`Stagger options for element ${t} must be an object`);
			let u = l?.delay ?? 0, d = i + r * a + u;
			if (typeof u != "number" || !Number.isFinite(u) || u < 0 || !Number.isFinite(d)) throw RangeError(`Delay for staggered element ${t} must be finite and >= 0`);
			let m = c?.properties ?? n, _ = l?.onComplete;
			g.push(y(e, m, {
				...f,
				...l,
				delay: d,
				onComplete: () => {
					try {
						_?.();
					} finally {
						h();
					}
				}
			}));
		});
	} catch (e) {
		for (let e of g) e.cancel();
		throw e;
	}
	return {
		seek: (e) => {
			for (let t of g) t.seek(e);
		},
		pause: () => {
			for (let e of g) e.pause();
		},
		resume: () => {
			for (let e of g) e.resume();
		},
		reverse: () => {
			for (let e of g) e.reverse();
		},
		setPlaybackRate: (e) => {
			for (let t of g) t.setPlaybackRate(e);
		},
		getPlaybackRate: () => g[0]?.getPlaybackRate() ?? l ?? 1,
		cancel: () => {
			for (let e of g) e.cancel();
		}
	};
}
// src/effects/draw-svg.ts
var Dt = "path";
function Ot(e) {
	return typeof SVGPathElement < "u" && e instanceof SVGPathElement || e.tagName.toLowerCase() === "path";
}
function kt(e) {
	if (typeof e == "string") {
		if (typeof document > "u") throw Error(`Cannot resolve selector "${e}": document is not available`);
		let t;
		try {
			t = document.querySelectorAll(e);
		} catch (t) {
			throw SyntaxError(`Invalid CSS selector "${e}"`, { cause: t });
		}
		return Array.from(t).flatMap((e) => Ot(e) ? [e] : Array.from(e.querySelectorAll(Dt)).filter(Ot));
	}
	if (typeof SVGElement < "u" && !(e instanceof SVGElement)) throw TypeError("drawSVG() target must be an SVGElement or a CSS selector string");
	return Ot(e) ? [e] : Array.from(e.querySelectorAll(Dt)).filter(Ot);
}
function At(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t < 0) throw RangeError(`${e} must be a finite number >= 0, received ${String(t)}`);
}
function jt(e, t) {
	return typeof e.style?.getPropertyValue == "function" ? e.style.getPropertyValue(t) : "";
}
function Mt(e, t, n) {
	n === "" ? e.style.removeProperty(t) : e.style.setProperty(t, n);
}
function Nt(e, t, n) {
	n === null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function Pt(e, t = {}) {
	let { duration: n = 1e3, delay: r = 0, stagger: i = 0, easing: a, reverse: o = !1, playbackRate: s, respectReducedMotion: c, onStart: l, onUpdate: u, onComplete: d, onCancel: p } = t;
	if (At("duration", n), At("delay", r), At("stagger", i), typeof o != "boolean") throw TypeError(`reverse must be a boolean, received ${String(o)}`);
	let m = kt(e), h = /* @__PURE__ */ new Map(), g = [], _ = !1, v = !1, b = !1, x = 0;
	for (let e of m) {
		let t = e.getTotalLength();
		if (!Number.isFinite(t) || t < 0) throw RangeError(`SVG path length must be a finite number >= 0, received ${String(t)}`);
		h.set(e, {
			dasharray: e.getAttribute("stroke-dasharray"),
			dashoffset: e.getAttribute("stroke-dashoffset"),
			styleDasharray: jt(e, "stroke-dasharray"),
			styleDashoffset: jt(e, "stroke-dashoffset")
		});
		let n = o ? 0 : t;
		e.setAttribute("stroke-dasharray", String(t)), e.setAttribute("stroke-dashoffset", String(n));
	}
	let S = () => {
		for (let [e, t] of h) Nt(e, "stroke-dasharray", t.dasharray), Nt(e, "stroke-dashoffset", t.dashoffset), Mt(e, "stroke-dasharray", t.styleDasharray), Mt(e, "stroke-dashoffset", t.styleDashoffset);
	};
	return m.length === 0 ? (f({
		duration: n,
		delay: r,
		easing: a,
		playbackRate: s,
		respectReducedMotion: c
	}).cancel(), {
		seek: () => void 0,
		pause: () => void 0,
		resume: () => void 0,
		reverse: () => void 0,
		setPlaybackRate: () => void 0,
		getPlaybackRate: () => s ?? 1,
		cancel: () => void 0,
		destroy: () => void 0
	}) : (m.forEach((e, t) => {
		let f = r + t * i;
		if (!Number.isFinite(f)) throw RangeError("delay plus stagger offsets must be finite");
		g.push(y(e, { "stroke-dashoffset": [o ? 0 : e.getTotalLength(), o ? e.getTotalLength() : 0] }, {
			duration: n,
			delay: f,
			...a === void 0 ? {} : { easing: a },
			...s === void 0 ? {} : { playbackRate: s },
			...c === void 0 ? {} : { respectReducedMotion: c },
			onStart: () => {
				b || (b = !0, l?.());
			},
			onUpdate: u,
			onComplete: () => {
				x += 1, x === m.length && !v && !_ && d?.();
			}
		}));
	}), {
		seek: (e) => {
			for (let t of g) t.seek(e);
		},
		pause: () => {
			for (let e of g) e.pause();
		},
		resume: () => {
			for (let e of g) e.resume();
		},
		reverse: () => {
			for (let e of g) e.reverse();
		},
		setPlaybackRate: (e) => {
			for (let t of g) t.setPlaybackRate(e);
		},
		getPlaybackRate: () => g[0]?.getPlaybackRate() ?? s ?? 1,
		cancel: () => {
			if (!(v || _)) {
				v = !0;
				for (let e of g) e.cancel();
				p?.();
			}
		},
		destroy: () => {
			if (!_) {
				_ = !0, v = !0;
				for (let e of g) e.cancel();
				S();
			}
		}
	});
}
// src/effects/morph-svg.ts
var Ft = /[a-zA-Z]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?/g, It = new Set("MmZzLlHhVvCcSsQqTtAa".split(""));
function Lt(e) {
	return typeof SVGPathElement < "u" && e instanceof SVGPathElement || e.tagName.toLowerCase() === "path";
}
function Rt(e) {
	if (typeof e == "string") {
		if (typeof document > "u") throw Error(`Cannot resolve selector "${e}": document is not available`);
		let t;
		try {
			t = document.querySelectorAll(e);
		} catch (t) {
			throw SyntaxError(`Invalid CSS selector "${e}"`, { cause: t });
		}
		return Array.from(t).flatMap((e) => Lt(e) ? [e] : Array.from(e.querySelectorAll("path")).filter(Lt));
	}
	if (typeof SVGElement < "u" && !(e instanceof SVGElement)) throw TypeError("morphSVG() target must be an SVGElement or a CSS selector string");
	return Lt(e) ? [e] : Array.from(e.querySelectorAll("path")).filter(Lt);
}
function zt(e, t) {
	let n = [], r = 0;
	for (let i of e.matchAll(Ft)) {
		let a = i.index ?? 0;
		if (!/^[\s,]*$/.test(e.slice(r, a))) throw TypeError(`Invalid SVG path data in ${t}`);
		let o = i[0];
		if (It.has(o)) n.push({
			kind: "command",
			raw: o,
			start: a,
			end: a + o.length
		});
		else {
			let e = Number(o);
			if (!Number.isFinite(e)) throw TypeError(`Invalid SVG path number in ${t}`);
			n.push({
				kind: "number",
				raw: o,
				start: a,
				end: a + o.length,
				value: e
			});
		}
		r = a + o.length;
	}
	if (!n.length || !/^[\s,]*$/.test(e.slice(r))) throw TypeError(`Invalid SVG path data in ${t}`);
	if (n[0]?.kind !== "command") throw TypeError(`SVG path data in ${t} must start with a command`);
	return n;
}
function Bt(e) {
	let t = e * 1e6;
	return String(Number.isFinite(t) ? Math.round(t) / 1e6 : e);
}
function Vt(e, t) {
	let n = zt(e, "source"), r = zt(t, "target");
	if (n.length !== r.length || n.some((e, t) => e.kind !== r[t]?.kind || e.kind === "command" && e.raw !== r[t]?.raw)) throw TypeError("Incompatible SVG path data: command structure and numeric token positions must match");
	return (i) => {
		if (i === 0) return e;
		if (i === 1) return t;
		let a = "", o = 0;
		for (let [t, s] of n.entries()) {
			if (a += e.slice(o, s.start), s.kind === "command") a += s.raw;
			else {
				let e = r[t]?.value, n = s.value;
				a += Bt(n + (e - n) * i);
			}
			o = s.end;
		}
		return a + e.slice(o);
	};
}
function Ht(e) {
	return {
		seek: () => void 0,
		pause: () => void 0,
		resume: () => void 0,
		reverse: () => void 0,
		setPlaybackRate: () => void 0,
		getPlaybackRate: () => e ?? 1,
		cancel: () => void 0,
		destroy: () => void 0
	};
}
function Ut(e, t, n = {}) {
	if (typeof t != "string" || t.trim() === "") throw TypeError("toPath must be a non-empty SVG path data string");
	let r = Array.from(new Set(Rt(e)));
	if (r.length === 0) return f({
		...n,
		onStart: void 0,
		onUpdate: void 0,
		onComplete: void 0,
		onCancel: void 0
	}).cancel(), Ht(n.playbackRate);
	let i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new Map();
	for (let e of r) {
		let n = e.getAttribute("d");
		if (n === null || n.trim() === "") throw TypeError("SVG path target must have a non-empty d attribute");
		a.set(e, n), i.set(e, Vt(n, t));
	}
	let o = [], s = !1, c = !1, l = !1, u = 0, { onStart: d, onUpdate: p, onComplete: m, onCancel: h, ...g } = n;
	for (let [e, t] of i) {
		e.setAttribute("d", a.get(e));
		try {
			o.push(f({
				...g,
				onStart: () => {
					l || (l = !0, d?.());
				},
				onUpdate: (n) => {
					Number.isFinite(n) && e.setAttribute("d", t(n)), p?.(n);
				},
				onComplete: () => {
					u += 1, u === i.size && !s && !c && m?.();
				}
			}));
		} catch (e) {
			for (let e of o) e.cancel();
			for (let [e, t] of a) e.setAttribute("d", t);
			throw e;
		}
	}
	return {
		seek: (e) => o.forEach((t) => t.seek(e)),
		pause: () => o.forEach((e) => e.pause()),
		resume: () => o.forEach((e) => e.resume()),
		reverse: () => o.forEach((e) => e.reverse()),
		setPlaybackRate: (e) => o.forEach((t) => t.setPlaybackRate(e)),
		getPlaybackRate: () => o[0]?.getPlaybackRate() ?? n.playbackRate ?? 1,
		cancel: () => {
			s || c || u === i.size || (s = !0, o.forEach((e) => e.cancel()), h?.());
		},
		destroy: () => {
			if (!c) {
				c = !0, s = !0;
				for (let e of o) e.cancel();
				for (let [e, t] of a) e.setAttribute("d", t);
			}
		}
	};
}
// src/core/transform.ts
var Wt = /* @__PURE__ */ new WeakMap();
function Gt(e) {
	let t = e.style.transform ?? "", n = typeof e.style.getPropertyPriority == "function" ? e.style.getPropertyPriority("transform") : "", r = t;
	if (r === "" && typeof getComputedStyle == "function") {
		let t = getComputedStyle(e).transform;
		t && t !== "none" && (r = t);
	}
	return {
		original: t,
		originalPriority: n,
		base: r,
		layers: /* @__PURE__ */ new Map()
	};
}
function Kt(e, t) {
	let n = [t.base, ...t.layers.values()].filter((e) => e !== "");
	n.length === 0 ? e.style.removeProperty("transform") : e.style.setProperty("transform", n.join(" "));
}
function F(e, t, n) {
	let r = Wt.get(e);
	r || (r = Gt(e), Wt.set(e, r)), r.layers.set(t, n), Kt(e, r);
}
function I(e, t) {
	let n = Wt.get(e);
	n?.layers.delete(t) && (n.layers.size > 0 ? Kt(e, n) : (Wt.delete(e), n.original === "" ? e.style.removeProperty("transform") : e.style.setProperty("transform", n.original, n.originalPriority)));
}
// src/effects/magnetic.ts
var qt = .25, Jt = 12, Yt = 200;
function Xt(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t < 0) throw RangeError(`${e} must be a finite number >= 0, received ${String(t)}`);
}
function Zt(e, t) {
	return Math.min(Math.max(e, -t), t);
}
function Qt(e, t = {}) {
	let { strength: n = qt, maxTranslate: r = Jt, duration: i = Yt, easing: a = o } = t, s = t.distance ?? Infinity;
	if (Xt("strength", n), Xt("maxTranslate", r), t.distance !== void 0 && Xt("distance", s), Xt("duration", i), typeof a != "function") throw TypeError("easing must be a function");
	let c = D(e);
	if (c.length === 0) return { destroy: () => void 0 };
	let l = /* @__PURE__ */ new Map(), u = [], d = !1, p = (e, t) => {
		t.applied = !0, F(e, t, `translate(${t.x}px, ${t.y}px)`);
	}, m = (e, t) => {
		t.applied && (I(e, t), t.applied = !1, t.x = 0, t.y = 0);
	}, h = (e, t, n, r, o) => {
		if (t.tween?.cancel(), t.tween = null, t.x === n && t.y === r) {
			o && m(e, t);
			return;
		}
		let s = t.x, c = t.y, l = f({
			duration: i,
			easing: a,
			onUpdate: (i) => {
				t.x = s + (n - s) * i, t.y = c + (r - c) * i, p(e, t);
			},
			onComplete: () => {
				t.tween === l && (t.tween = null), o && m(e, t);
			}
		});
		t.tween = l;
	}, g = (e, t) => {
		let n = e.getBoundingClientRect();
		t.centerX = n.left + n.width / 2 - t.x, t.centerY = n.top + n.height / 2 - t.y, t.engaged = !0;
	}, _ = (e, t) => {
		t.engaged && (t.engaged = !1, h(e, t, 0, 0, !0));
	}, v = (e, t) => {
		t.tween?.cancel(), t.tween = null, t.engaged = !1, m(e, t);
	}, y = (e) => e.pointerType === "touch";
	for (let e of c) {
		let t = {
			engaged: !1,
			applied: !1,
			x: 0,
			y: 0,
			centerX: 0,
			centerY: 0,
			tween: null
		};
		l.set(e, t);
		let i = (n) => {
			d || y(n) || b() || g(e, t);
		}, a = (i) => {
			let a = i;
			if (d || y(a)) return;
			if (b()) {
				v(e, t);
				return;
			}
			t.engaged || g(e, t);
			let o = a.clientX - t.centerX, c = a.clientY - t.centerY;
			Math.hypot(o, c) > s ? (t.engaged = !1, h(e, t, 0, 0, !0)) : h(e, t, Zt(o * n, r), Zt(c * n, r), !1);
		}, o = () => {
			d || _(e, t);
		};
		e.addEventListener("pointerenter", i), e.addEventListener("pointermove", a), e.addEventListener("pointerleave", o), e.addEventListener("pointercancel", o), u.push(() => {
			e.removeEventListener("pointerenter", i), e.removeEventListener("pointermove", a), e.removeEventListener("pointerleave", o), e.removeEventListener("pointercancel", o);
		});
	}
	return u.push(C((e) => {
		if (!d && e) for (let [e, t] of l) v(e, t);
	})), { destroy: () => {
		if (!d) {
			d = !0;
			for (let e of u) e();
			for (let [e, t] of l) v(e, t);
			l.clear();
		}
	} };
}
var $t = Qt, L = {
	x: 0,
	y: 0,
	scale: 1,
	rotate: 0
}, en = 220;
function tn(e, t) {
	let n = {
		x: e?.x ?? 0,
		y: e?.y ?? 0,
		scale: e?.scale ?? 1,
		rotate: e?.rotate ?? 0
	};
	for (let [e, r] of Object.entries(n)) if (typeof r != "number" || !Number.isFinite(r)) throw RangeError(`${t}.${e} must be a finite number, received ${String(r)}`);
	if (n.scale <= 0) throw RangeError(`${t}.scale must be greater than 0`);
	return n;
}
function nn(e, t) {
	return e.x === t.x && e.y === t.y && e.scale === t.scale && e.rotate === t.rotate;
}
function rn(e) {
	return `translate(${e.x}px, ${e.y}px) scale(${e.scale}) rotate(${e.rotate}deg)`;
}
function an(e, t = {}) {
	let { duration: n = en, easing: r = o } = t;
	if (typeof n != "number" || !Number.isFinite(n) || n < 0) throw RangeError(`duration must be a finite number >= 0, received ${String(n)}`);
	if (typeof r != "function") throw TypeError("easing must be a function");
	let i = tn(t.enter, "enter"), a = tn(t.leave, "leave"), s = D(e);
	if (s.length === 0) return { destroy: () => void 0 };
	let c = /* @__PURE__ */ new Map(), l = [], u = !1, d = b(), p = (e, t) => {
		nn(t.current, L) ? (t.applied && I(e, t), t.applied = !1) : (t.applied = !0, F(e, t, rn(t.current)));
	}, m = (e, t, i) => {
		if (nn(t.target, i)) return;
		if (t.target = { ...i }, t.tween?.cancel(), t.tween = null, d || n === 0 || nn(t.current, i)) {
			t.current = { ...i }, p(e, t);
			return;
		}
		let a = { ...t.current }, o;
		o = f({
			duration: n,
			easing: r,
			respectReducedMotion: !1,
			onUpdate: (n) => {
				t.current = {
					x: a.x + (i.x - a.x) * n,
					y: a.y + (i.y - a.y) * n,
					scale: a.scale + (i.scale - a.scale) * n,
					rotate: a.rotate + (i.rotate - a.rotate) * n
				}, p(e, t);
			},
			onComplete: () => {
				t.tween === o && (t.tween = null);
			}
		}), t.tween = o;
	};
	for (let e of s) {
		let t = {
			current: { ...L },
			target: { ...L },
			applied: !1,
			pointerActive: !1,
			focusActive: !1,
			tween: null
		};
		c.set(e, t);
		let n = () => {
			let n = t.pointerActive || t.focusActive;
			m(e, t, d ? L : n ? i : a);
		}, r = (e) => {
			u || e.pointerType === "touch" || (t.pointerActive = !0, n());
		}, o = (e) => {
			u || e.pointerType === "touch" || (t.pointerActive = !1, n());
		}, s = () => {
			u || (t.focusActive = !0, n());
		}, f = () => {
			u || (t.focusActive = !1, n());
		};
		e.addEventListener("pointerenter", r), e.addEventListener("pointerleave", o), e.addEventListener("pointercancel", o), e.addEventListener("focus", s), e.addEventListener("blur", f), l.push(() => {
			e.removeEventListener("pointerenter", r), e.removeEventListener("pointerleave", o), e.removeEventListener("pointercancel", o), e.removeEventListener("focus", s), e.removeEventListener("blur", f);
		});
	}
	return l.push(C((e) => {
		if (e !== d && (d = e, !u)) for (let [t, n] of c) {
			let r = n.pointerActive || n.focusActive;
			m(t, n, e ? L : r ? i : a);
		}
	})), { destroy: () => {
		if (!u) {
			u = !0;
			for (let e of l) e();
			for (let [e, t] of c) t.tween?.cancel(), t.tween = null, t.current = { ...L }, t.target = { ...L }, p(e, t);
			c.clear();
		}
	} };
}
// src/effects/follow-pointer.ts
var on = .12;
function sn(e, t, n) {
	return Math.min(Math.max(e, t), n);
}
function cn(e, t) {
	if (!t || typeof t != "object") throw TypeError("options must include a container");
	let { container: n, smoothing: r = on, easing: i = o } = t;
	if (n === void 0) throw TypeError("container is required");
	if (typeof r != "number" || !Number.isFinite(r) || r < 0 || r > 1) throw RangeError(`smoothing must be a finite number between 0 and 1, received ${String(r)}`);
	if (typeof i != "function") throw TypeError("easing must be a function");
	let a = D(e);
	if (a.length === 0) return { destroy: () => void 0 };
	let s = D(n);
	if (s.length !== 1) throw RangeError(`container must resolve to exactly one HTMLElement, received ${s.length}`);
	let c = s[0], l = b(), u = /* @__PURE__ */ new Map();
	if (l) for (let e of a) u.set(e, {
		centerX: 0,
		centerY: 0,
		width: 0,
		height: 0,
		x: 0,
		y: 0,
		applied: !1,
		tween: null
	});
	else {
		let e = c.getBoundingClientRect();
		for (let t of a) {
			let n = t.getBoundingClientRect();
			u.set(t, {
				centerX: n.left + n.width / 2 - e.left,
				centerY: n.top + n.height / 2 - e.top,
				width: n.width,
				height: n.height,
				x: 0,
				y: 0,
				applied: !1,
				tween: null
			});
		}
	}
	let d = l, p = !1, m = (e, t) => {
		t.x === 0 && t.y === 0 ? (t.applied && I(e, t), t.applied = !1) : (t.applied = !0, F(e, t, `translate(${t.x}px, ${t.y}px)`));
	}, h = (e, t, n, a) => {
		t.tween?.cancel(), t.tween = null;
		let o = r * 1e3;
		if (d || o === 0 || t.x === n && t.y === a) {
			t.x = n, t.y = a, m(e, t);
			return;
		}
		let s = t.x, c = t.y, l;
		l = f({
			duration: o,
			easing: i,
			respectReducedMotion: !1,
			onUpdate: (r) => {
				t.x = s + (n - s) * r, t.y = c + (a - c) * r, m(e, t);
			},
			onComplete: () => {
				t.tween === l && (t.tween = null);
			}
		}), t.tween = l;
	}, g = (e) => {
		if (p || d || e.pointerType === "touch") return;
		let t = c.getBoundingClientRect();
		for (let [n, r] of u) {
			let i = sn(e.clientX - t.left, r.width / 2, Math.max(r.width / 2, t.width - r.width / 2)), a = sn(e.clientY - t.top, r.height / 2, Math.max(r.height / 2, t.height - r.height / 2));
			h(n, r, i - r.centerX, a - r.centerY);
		}
	}, _ = (e) => {
		if (e.pointerType !== "touch") for (let [e, t] of u) h(e, t, 0, 0);
	};
	c.addEventListener("pointermove", g), c.addEventListener("pointerleave", _), c.addEventListener("pointercancel", _);
	let v = C((e) => {
		if (p || e === d) return;
		if (d = e, e) {
			for (let [e, t] of u) t.tween?.cancel(), t.tween = null, t.x = 0, t.y = 0, m(e, t);
			return;
		}
		let t = c.getBoundingClientRect();
		for (let [e, n] of u) {
			let r = e.getBoundingClientRect();
			n.centerX = r.left + r.width / 2 - t.left, n.centerY = r.top + r.height / 2 - t.top, n.width = r.width, n.height = r.height;
		}
	});
	return { destroy: () => {
		if (!p) {
			p = !0, c.removeEventListener("pointermove", g), c.removeEventListener("pointerleave", _), c.removeEventListener("pointercancel", _), v();
			for (let [e, t] of u) t.tween?.cancel(), t.tween = null, t.x = 0, t.y = 0, m(e, t);
			u.clear();
		}
	} };
}
// src/effects/drag.ts
function ln(e) {
	if (e !== void 0) {
		if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("bounds must be an object");
		for (let [t, n] of Object.entries(e)) {
			if (![
				"minX",
				"maxX",
				"minY",
				"maxY"
			].includes(t)) throw TypeError(`Unknown drag bound "${t}"`);
			if (typeof n != "number" || !Number.isFinite(n)) throw RangeError(`${t} must be a finite number, received ${String(n)}`);
		}
		if (e.minX !== void 0 && e.maxX !== void 0 && e.minX > e.maxX) throw RangeError("minX must be less than or equal to maxX");
		if (e.minY !== void 0 && e.maxY !== void 0 && e.minY > e.maxY) throw RangeError("minY must be less than or equal to maxY");
	}
}
function un(e, t, n) {
	return t !== void 0 && (e = Math.max(t, e)), n !== void 0 && (e = Math.min(n, e)), e;
}
function dn(e, t = {}) {
	if (typeof t != "object" || !t || Array.isArray(t)) throw TypeError("options must be an object");
	let n = t.axis ?? "both", r = t.inertia ?? !0, i = t.friction ?? 8;
	if (n !== "x" && n !== "y" && n !== "both") throw TypeError(`axis must be "x", "y", or "both", received ${String(n)}`);
	if (typeof r != "boolean") throw TypeError("inertia must be a boolean");
	if (typeof i != "number" || !Number.isFinite(i) || i <= 0) throw RangeError(`friction must be a finite number > 0, received ${String(i)}`);
	for (let [e, n] of [
		["onDragStart", t.onDragStart],
		["onDrag", t.onDrag],
		["onDragEnd", t.onDragEnd]
	]) if (n !== void 0 && typeof n != "function") throw TypeError(`${e} must be a function`);
	ln(t.bounds);
	let a = D(e);
	if (a.length === 0) return { destroy: () => void 0 };
	let o = /* @__PURE__ */ new Map(), s = [], c = !1, l = (e, t) => {
		t.x === 0 && t.y === 0 ? I(e, t) : F(e, t, `translate(${t.x}px, ${t.y}px)`);
	}, u = (e, n) => {
		l(e, n), t.onDrag?.({
			x: n.x,
			y: n.y
		});
	};
	for (let e of a) {
		let a = {
			x: 0,
			y: 0,
			pointerId: null,
			startX: 0,
			startY: 0,
			startOffsetX: 0,
			startOffsetY: 0,
			pointerX: 0,
			pointerY: 0,
			sampleTime: 0,
			velocityX: 0,
			velocityY: 0,
			inertiaX: null,
			inertiaY: null,
			touchAction: e.style.getPropertyValue("touch-action"),
			touchActionPriority: e.style.getPropertyPriority("touch-action")
		};
		o.set(e, a), e.style.setProperty("touch-action", "none");
		let l = () => {
			a.inertiaX?.cancel(), a.inertiaY?.cancel(), a.inertiaX = null, a.inertiaY = null;
		}, d = () => {
			a.pointerId !== null && e.hasPointerCapture(a.pointerId) && e.releasePointerCapture(a.pointerId), a.pointerId = null;
		}, f = (n) => {
			c || a.pointerId !== null || n.isPrimary === !1 || n.button !== void 0 && n.button !== 0 || (n.preventDefault(), l(), a.pointerId = n.pointerId, a.startX = n.clientX, a.startY = n.clientY, a.startOffsetX = a.x, a.startOffsetY = a.y, a.pointerX = n.clientX, a.pointerY = n.clientY, a.sampleTime = n.timeStamp, a.velocityX = 0, a.velocityY = 0, e.setPointerCapture(n.pointerId), t.onDragStart?.({
				x: a.x,
				y: a.y
			}));
		}, p = (r) => {
			if (c || a.pointerId !== r.pointerId) return;
			let i = r.timeStamp - a.sampleTime;
			i > 0 && (a.velocityX = (r.clientX - a.pointerX) / i * 1e3, a.velocityY = (r.clientY - a.pointerY) / i * 1e3), a.pointerX = r.clientX, a.pointerY = r.clientY, a.sampleTime = r.timeStamp;
			let o = t.bounds;
			a.x = n === "y" ? a.x : un(a.startOffsetX + r.clientX - a.startX, o?.minX, o?.maxX), a.y = n === "x" ? a.y : un(a.startOffsetY + r.clientY - a.startY, o?.minY, o?.maxY), u(e, a);
		}, m = (o, s) => {
			if (!(c || a.pointerId !== o.pointerId) && (d(), t.onDragEnd?.({
				x: a.x,
				y: a.y
			}, s), !(c || s || !r))) {
				if (n !== "y" && a.velocityX !== 0) {
					let n;
					n = de({
						from: a.x,
						initialVelocity: a.velocityX,
						friction: i,
						min: t.bounds?.minX,
						max: t.bounds?.maxX,
						onUpdate: ({ position: t }) => {
							a.x = t, u(e, a);
						},
						onComplete: () => {
							a.inertiaX === n && (a.inertiaX = null);
						}
					}), a.inertiaX = n;
				}
				if (n !== "x" && a.velocityY !== 0) {
					let n;
					n = de({
						from: a.y,
						initialVelocity: a.velocityY,
						friction: i,
						min: t.bounds?.minY,
						max: t.bounds?.maxY,
						onUpdate: ({ position: t }) => {
							a.y = t, u(e, a);
						},
						onComplete: () => {
							a.inertiaY === n && (a.inertiaY = null);
						}
					}), a.inertiaY = n;
				}
			}
		}, h = (e) => m(e, !1), g = (e) => m(e, !0), _ = (e) => m(e, !0);
		e.addEventListener("pointerdown", f), e.addEventListener("pointermove", p), e.addEventListener("pointerup", h), e.addEventListener("pointercancel", g), e.addEventListener("lostpointercapture", _), s.push(() => {
			e.removeEventListener("pointerdown", f), e.removeEventListener("pointermove", p), e.removeEventListener("pointerup", h), e.removeEventListener("pointercancel", g), e.removeEventListener("lostpointercapture", _), l(), d();
		});
	}
	return { destroy: () => {
		if (!c) {
			c = !0;
			for (let e of s) e();
			for (let [e, t] of o) I(e, t), t.touchAction === "" ? e.style.removeProperty("touch-action") : e.style.setProperty("touch-action", t.touchAction, t.touchActionPriority);
			o.clear();
		}
	} };
}
// src/effects/tilt.ts
var fn = 10, pn = 800, mn = 1.02, hn = 300;
function gn(e, t, { allowZero: n }) {
	if (!(typeof t == "number" && Number.isFinite(t) && (n ? t >= 0 : t > 0))) throw RangeError(`${e} must be a finite number ${n ? ">= 0" : "> 0"}, received ${String(t)}`);
}
function _n(e) {
	return Math.min(Math.max(e, -1), 1);
}
function vn(e) {
	return Math.round(e * 1e3) / 1e3;
}
function yn(e, t = {}) {
	let { maxTilt: n = fn, perspective: r = pn, scale: i = mn, speed: a = hn, easing: s = o } = t;
	if (gn("maxTilt", n, { allowZero: !0 }), gn("perspective", r, { allowZero: !1 }), gn("scale", i, { allowZero: !1 }), gn("speed", a, { allowZero: !0 }), typeof s != "function") throw TypeError("easing must be a function");
	let c = D(e);
	if (c.length === 0) return { destroy: () => void 0 };
	let l = /* @__PURE__ */ new Map(), u = [], d = !1, p = (e, t) => {
		F(e, t, `perspective(${r}px) rotateX(${vn(t.rotateX)}deg) rotateY(${vn(t.rotateY)}deg) scale(${vn(t.scale)})`);
	}, m = (e, t) => {
		t.captured && (I(e, t), t.captured = !1, t.rotateX = 0, t.rotateY = 0, t.scale = 1);
	}, h = (e, t) => {
		t.tween?.cancel(), t.tween = null, t.targetKey = "", t.engaged = !1, m(e, t);
	}, g = (e, t, n, r, i, o) => {
		let c = `${n}|${r}|${i}|${o}`;
		if (t.tween !== null && t.targetKey === c) return;
		if (t.tween?.cancel(), t.tween = null, t.targetKey = "", t.rotateX === n && t.rotateY === r && t.scale === i) {
			o && m(e, t);
			return;
		}
		let l = t.rotateX, u = t.rotateY, d = t.scale, h = f({
			duration: a,
			easing: s,
			onUpdate: (a) => {
				t.rotateX = l + (n - l) * a, t.rotateY = u + (r - u) * a, t.scale = d + (i - d) * a, p(e, t);
			},
			onComplete: () => {
				t.tween === h && (t.tween = null, t.targetKey = "", t.rotateX = n, t.rotateY = r, t.scale = i, o ? m(e, t) : p(e, t));
			}
		});
		t.tween = h, t.targetKey = c;
	}, _ = (e, t) => {
		if (!t.captured) {
			t.captured = !0;
			let n = e.getBoundingClientRect();
			t.halfWidth = n.width / 2, t.halfHeight = n.height / 2, t.centerX = n.left + t.halfWidth, t.centerY = n.top + t.halfHeight;
		}
		t.engaged = !0;
	}, v = (e, t, r) => {
		t.engaged || _(e, t);
		let a = t.halfWidth === 0 ? 0 : _n((r.clientX - t.centerX) / t.halfWidth), o = t.halfHeight === 0 ? 0 : _n((r.clientY - t.centerY) / t.halfHeight);
		g(e, t, vn(-o * n), vn(a * n), i, !1);
	}, y = (e, t) => {
		t.engaged && (t.engaged = !1, g(e, t, 0, 0, 1, !0));
	};
	for (let e of c) {
		let t = {
			engaged: !1,
			captured: !1,
			rotateX: 0,
			rotateY: 0,
			scale: 1,
			halfWidth: 0,
			halfHeight: 0,
			centerX: 0,
			centerY: 0,
			tween: null,
			targetKey: ""
		};
		l.set(e, t);
		let n = (n) => {
			let r = n;
			d || r.pointerType === "touch" || (b() ? h(e, t) : v(e, t, r));
		}, r = () => {
			d || y(e, t);
		};
		e.addEventListener("pointerenter", n), e.addEventListener("pointermove", n), e.addEventListener("pointerleave", r), e.addEventListener("pointercancel", r), u.push(() => {
			e.removeEventListener("pointerenter", n), e.removeEventListener("pointermove", n), e.removeEventListener("pointerleave", r), e.removeEventListener("pointercancel", r);
		});
	}
	return u.push(C((e) => {
		if (!d && e) for (let [e, t] of l) h(e, t);
	})), { destroy: () => {
		if (!d) {
			d = !0;
			for (let e of u) e();
			for (let [e, t] of l) h(e, t);
			l.clear();
		}
	} };
}
// src/effects/parallax.ts
var bn = .3, xn = 100, Sn = (e) => e;
function Cn(e) {
	return Math.round(e * 100) / 100;
}
function wn(e, t = {}) {
	let { speed: n = bn, axis: r = "y", maxOffset: i = xn, easing: a = Sn } = t;
	if (typeof n != "number" || !Number.isFinite(n)) throw RangeError(`speed must be a finite number, received ${String(n)}`);
	if (typeof i != "number" || !Number.isFinite(i) || i < 0) throw RangeError(`maxOffset must be a finite number >= 0, received ${String(i)}`);
	if (r !== "x" && r !== "y") throw TypeError(`axis must be "x" or "y", received ${String(r)}`);
	if (typeof a != "function") throw TypeError("easing must be a function");
	if (typeof window > "u" || typeof requestAnimationFrame != "function") throw Error("parallax() requires window and requestAnimationFrame, which are not available in this environment");
	let o = D(e);
	if (o.length === 0) return { destroy: () => void 0 };
	let s = /* @__PURE__ */ new Map();
	for (let e of o) s.set(e, {
		pageCenter: 0,
		written: !1,
		offset: 0
	});
	let c = null, l = !0, u = !1, d = (e) => r === "y" ? `translate(0px, ${e.offset}px)` : `translate(${e.offset}px, 0px)`, f = (e, t) => {
		t.written && (I(e, t), t.written = !1, t.offset = 0);
	}, p = () => {
		let e = [];
		for (let [t, n] of s) n.written && (F(t, n, ""), e.push([t, n]));
		let t = window.scrollX ?? 0, n = window.scrollY ?? 0;
		for (let [e, i] of s) {
			let a = e.getBoundingClientRect();
			i.pageCenter = r === "y" ? a.top + a.height / 2 + n : a.left + a.width / 2 + t;
		}
		for (let [t, n] of e) F(t, n, d(n));
		l = !1;
	}, m = (e, t, r) => {
		if (i === 0) return 0;
		let o = -(e.pageCenter - t - r / 2) * n, s = Math.min(Math.abs(o) / i, 1), c = a(s);
		return Number.isFinite(c) ? Cn(Math.sign(o) * c * i) + 0 : e.offset;
	}, h = () => {
		if (u) return;
		if (b()) {
			for (let [e, t] of s) f(e, t);
			l = !0;
			return;
		}
		l && p();
		let e = r === "y" ? window.scrollY ?? 0 : window.scrollX ?? 0, t = (r === "y" ? window.innerHeight : window.innerWidth) || 0;
		for (let [n, r] of s) {
			let i = m(r, e, t);
			i !== r.offset && (r.written = !0, r.offset = i, F(n, r, d(r)));
		}
	}, g = () => {
		u || c !== null || (c = requestAnimationFrame(() => {
			c = null, h();
		}));
	}, _ = () => g(), v = () => {
		l = !0, g();
	};
	window.addEventListener("scroll", _, { passive: !0 }), window.addEventListener("resize", v, { passive: !0 });
	let y = C(() => {
		l = !0, h();
	});
	return h(), { destroy: () => {
		if (!u) {
			u = !0, window.removeEventListener("scroll", _), window.removeEventListener("resize", v), y(), c !== null && (cancelAnimationFrame(c), c = null);
			for (let [e, t] of s) f(e, t);
			s.clear();
		}
	} };
}
// src/core/built-in-palettes.ts
var Tn = [
	{
		name: "Cobalt Classic",
		primary: "#111111",
		secondary: "#FFFFFF",
		accent: "#0047AB",
		colorNames: {
			primary: "Black",
			secondary: "White",
			accent: "Cobalt Blue"
		}
	},
	{
		name: "Burnt Chocolate",
		primary: "#6F3B22",
		secondary: "#FFF1D6",
		accent: "#CC5500",
		colorNames: {
			primary: "Chocolate Brown",
			secondary: "Cream",
			accent: "Burnt Orange"
		}
	},
	{
		name: "Dusty Romance",
		primary: "#800020",
		secondary: "#FFF1D6",
		accent: "#D8A7A7",
		colorNames: {
			primary: "Burgundy",
			secondary: "Cream",
			accent: "Dusty Pink"
		}
	},
	{
		name: "Cosmic Mocha",
		primary: "#FFF8E7",
		secondary: "#DCC7AA",
		accent: "#4A102A",
		colorNames: {
			primary: "Cosmic Latte",
			secondary: "Mocha Cream",
			accent: "Deep Burgundy"
		}
	},
	{
		name: "Earth & Amber",
		primary: "#A3B18A",
		secondary: "#969A98",
		accent: "#C87924",
		colorNames: {
			primary: "Sage Green",
			secondary: "Concrete Grey",
			accent: "Burnt Amber"
		}
	},
	{
		name: "Primary Pop",
		primary: "#A7D8F0",
		secondary: "#E32636",
		accent: "#FFD93D",
		colorNames: {
			primary: "Baby Blue",
			secondary: "Red",
			accent: "Sunshine Yellow"
		}
	},
	{
		name: "Midnight Voltage",
		primary: "#101B3F",
		secondary: "#0047AB",
		accent: "#F02D3A",
		colorNames: {
			primary: "Midnight Navy",
			secondary: "Cobalt Blue",
			accent: "Bright Red"
		}
	},
	{
		name: "Earthbound",
		primary: "#242424",
		secondary: "#795548",
		accent: "#C87924",
		colorNames: {
			primary: "Charcoal Black",
			secondary: "Earth Brown",
			accent: "Burnt Amber"
		}
	},
	{
		name: "Electric Teal",
		primary: "#101418",
		secondary: "#F5EBDD",
		accent: "#00D6C9",
		colorNames: {
			primary: "Ink Black",
			secondary: "Warm Ivory",
			accent: "Electric Teal"
		}
	},
	{
		name: "Crimson Midnight",
		primary: "#111A33",
		secondary: "#A7A29A",
		accent: "#DC143C",
		colorNames: {
			primary: "Midnight Navy",
			secondary: "Warm Stone Grey",
			accent: "Crimson Red"
		}
	},
	{
		name: "Neon Abyss",
		primary: "#08080C",
		secondary: "#FF2442",
		accent: "#4B0082",
		colorNames: {
			primary: "Deep Black",
			secondary: "Neon Red",
			accent: "Indigo"
		}
	},
	{
		name: "Royal Atlas",
		primary: "#FFFFF0",
		secondary: "#D4AF37",
		accent: "#102A43",
		colorNames: {
			primary: "Ivory",
			secondary: "Gold",
			accent: "Deep Atlas Navy"
		}
	},
	{
		name: "Ember Editorial",
		primary: "#CC5500",
		secondary: "#F5EBDD",
		accent: "#202124",
		colorNames: {
			primary: "Burnt Orange",
			secondary: "Warm Ivory",
			accent: "Soft Black"
		}
	},
	{
		name: "Editorial Heat",
		primary: "#F5EBDD",
		secondary: "#153E75",
		accent: "#FF765E",
		colorNames: {
			primary: "Warm Ivory",
			secondary: "Deep Editorial Blue",
			accent: "Coral Orange"
		}
	},
	{
		name: "Strawberry Riot",
		primary: "#F6B7C8",
		secondary: "#D7193F",
		accent: "#A8E10C",
		colorNames: {
			primary: "Soft Strawberry Pink",
			secondary: "Vibrant Crimson Red",
			accent: "Lime Green"
		}
	},
	{
		name: "Sage & Olive",
		primary: "#F8F8F2",
		secondary: "#A3B18A",
		accent: "#414833",
		colorNames: {
			primary: "Soft White",
			secondary: "Sage Green",
			accent: "Deep Olive"
		}
	},
	{
		name: "Solar Cobalt",
		primary: "#D8C3A5",
		secondary: "#0047AB",
		accent: "#FFD447",
		colorNames: {
			primary: "Warm Beige",
			secondary: "Cobalt Blue",
			accent: "Sun Yellow"
		}
	},
	{
		name: "Electric Eclipse",
		primary: "#090A0F",
		secondary: "#8F00FF",
		accent: "#FFD447",
		colorNames: {
			primary: "Midnight Black",
			secondary: "Electric Violet",
			accent: "Sun Yellow"
		}
	},
	{
		name: "Silver Signal",
		primary: "#343A40",
		secondary: "#C7CDD4",
		accent: "#E51B23",
		colorNames: {
			primary: "Charcoal Grey",
			secondary: "Moonlit Silver",
			accent: "Signal Red"
		}
	},
	{
		name: "Amethyst Circuit",
		primary: "#0A0A0A",
		secondary: "#7851A9",
		accent: "#00E5FF",
		colorNames: {
			primary: "Jet Black",
			secondary: "Royal Amethyst",
			accent: "Electric Cyan"
		}
	},
	{
		name: "Woodland Glow",
		primary: "#A3B18A",
		secondary: "#5D4037",
		accent: "#FFB000",
		colorNames: {
			primary: "Sage Green",
			secondary: "Walnut Brown",
			accent: "Amber Glow"
		}
	},
	{
		name: "Peach Voltage",
		primary: "#F7C6A3",
		secondary: "#A8E10C",
		accent: "#DC143C",
		colorNames: {
			primary: "Soft Peach",
			secondary: "Lime Green",
			accent: "Crimson"
		}
	},
	{
		name: "Forest Lavender",
		primary: "#E7DDC8",
		secondary: "#1F5B45",
		accent: "#C8B6E2",
		colorNames: {
			primary: "Oatmeal",
			secondary: "Pine Green",
			accent: "Soft Lilac"
		}
	},
	{
		name: "Mauve Terracotta",
		primary: "#B7849A",
		secondary: "#4B203A",
		accent: "#C66B4E",
		colorNames: {
			primary: "Dusty Mauve",
			secondary: "Deep Plum",
			accent: "Terracotta"
		}
	},
	{
		name: "Chromatic Riot",
		primary: "#B9A7E8",
		secondary: "#C7E000",
		accent: "#F04438",
		colorNames: {
			primary: "Lavender",
			secondary: "Chartreuse",
			accent: "Tomato Red"
		}
	},
	{
		name: "Neon Rebellion",
		primary: "#0A0A0A",
		secondary: "#FF2D95",
		accent: "#C7E000",
		colorNames: {
			primary: "Jet Black",
			secondary: "Hot Pink",
			accent: "Chartreuse"
		}
	},
	{
		name: "Emerald Vermilion",
		primary: "#F5EBDD",
		secondary: "#087F5B",
		accent: "#E34234",
		colorNames: {
			primary: "Warm Ivory",
			secondary: "Emerald Green",
			accent: "Vermilion"
		}
	},
	{
		name: "Forest Crimson",
		primary: "#242424",
		secondary: "#1B4332",
		accent: "#DC143C",
		colorNames: {
			primary: "Charcoal Black",
			secondary: "Forest Green",
			accent: "Crimson Red"
		}
	},
	{
		name: "Lemon Afterdark",
		primary: "#FFF44F",
		secondary: "#242424",
		accent: "#B65CFF",
		colorNames: {
			primary: "Lemon",
			secondary: "Charcoal Black",
			accent: "Electric Lavender"
		}
	},
	{
		name: "Mocha Gold",
		primary: "#6F4E37",
		secondary: "#F1D6A8",
		accent: "#C87924",
		colorNames: {
			primary: "Mocha Brown",
			secondary: "Champagne Gold",
			accent: "Burnt Amber"
		}
	},
	{
		name: "Cerulean Rose",
		primary: "#0A0A0A",
		secondary: "#007BA7",
		accent: "#FF3CAC",
		colorNames: {
			primary: "Jet Black",
			secondary: "Cerulean Blue",
			accent: "Neon Rose"
		}
	},
	{
		name: "Amber Frost",
		primary: "#DDE6ED",
		secondary: "#3D1635",
		accent: "#EAA221",
		colorNames: {
			primary: "Ice Silver",
			secondary: "Deep Ambergine",
			accent: "Marigold"
		}
	},
	{
		name: "Platinum Mocha",
		primary: "#6F4E37",
		secondary: "#D5D8DC",
		accent: "#DCD0FF",
		colorNames: {
			primary: "Mocha Brown",
			secondary: "Platinum Silver",
			accent: "Pale Lavender"
		}
	}
], En = [
	"primary",
	"secondary",
	"accent",
	"background",
	"surface",
	"text",
	"muted",
	"border",
	"success",
	"warning",
	"error",
	"info"
], Dn = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i, On = /* @__PURE__ */ new Map(), kn = /* @__PURE__ */ new Set(), An;
function jn(e) {
	if (typeof e != "string" || e.trim() === "" || e !== e.trim()) throw TypeError("Palette name must be a non-empty string without surrounding whitespace");
}
function Mn(e, t) {
	if (typeof e != "string" || !Dn.test(e)) throw TypeError(`Palette token "${t}" must be a valid HEX color`);
}
function Nn(e) {
	for (let t of Object.keys(e)) if (!En.includes(t)) throw TypeError(`Unknown semantic color token "${t}"`);
}
function Pn(e) {
	if (e === void 0) return;
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Palette color names must be an object");
	let t = Object.keys(e);
	for (let e of t) if (e !== "primary" && e !== "secondary" && e !== "accent") throw TypeError(`Unknown palette color name key "${e}"`);
	let n = e;
	for (let e of [
		"primary",
		"secondary",
		"accent"
	]) if (typeof n[e] != "string" || n[e].trim() === "") throw TypeError(`Palette color name "${e}" must be a non-empty string`);
	return Object.freeze({
		primary: n.primary,
		secondary: n.secondary,
		accent: n.accent
	});
}
function Fn(e) {
	return [
		"primary",
		"secondary",
		"accent"
	].some((t) => Object.prototype.hasOwnProperty.call(e, t));
}
function In(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Palette must be an object");
	jn(e.name);
	let t = Pn(e.colorNames), n;
	if (Fn(e)) {
		let t = e, r = {
			primary: t.primary,
			secondary: t.secondary,
			accent: t.accent
		};
		for (let e of [
			"primary",
			"secondary",
			"accent"
		]) Mn(r[e], e);
		let i = t.overrides === void 0 ? {} : t.overrides;
		if (typeof i != "object" || !i || Array.isArray(i)) throw TypeError("Palette semantic token overrides must be an object");
		Nn(i), n = {
			...r,
			background: t.secondary,
			surface: t.secondary,
			text: t.primary,
			muted: t.secondary,
			border: t.secondary,
			success: t.accent,
			warning: t.accent,
			error: t.accent,
			info: t.accent,
			...i
		};
	} else {
		let t = e;
		if (t.tokens === null || typeof t.tokens != "object" || Array.isArray(t.tokens)) throw TypeError("Palette tokens must be an object");
		Nn(t.tokens), n = t.tokens;
	}
	let r = {};
	for (let e of En) {
		if (!Object.prototype.hasOwnProperty.call(n, e)) throw TypeError(`Palette is missing required semantic color token "${e}"`);
		let t = n[e];
		Mn(t, e), r[e] = t;
	}
	return Object.freeze({
		name: e.name,
		tokens: Object.freeze(r),
		...t ? { colorNames: t } : {}
	});
}
function Ln(e) {
	let t = {};
	for (let n of En) t[n] = e.tokens[n];
	return Object.freeze({
		name: e.name,
		tokens: Object.freeze(t),
		...e.colorNames ? { colorNames: Object.freeze({ ...e.colorNames }) } : {}
	});
}
var Rn = new Map(Tn.map((e) => {
	let t = In(e);
	return [t.name, t];
}));
function zn(e) {
	let t = In(e);
	if (Rn.has(t.name)) throw TypeError(`Cannot replace built-in palette "${t.name}"`);
	if (On.has(t.name)) throw TypeError(`Palette "${t.name}" is already registered`);
	On.set(t.name, t);
}
function R(e) {
	jn(e);
	let t = Rn.get(e) ?? On.get(e);
	return t ? Ln(t) : void 0;
}
function Bn() {
	return Object.freeze([...Rn.keys(), ...On.keys()]);
}
function Vn() {
	let e = z();
	for (let t of [...kn]) t(e);
}
function Hn(e) {
	if (jn(e), !Rn.has(e) && !On.has(e)) throw TypeError(`Unknown palette "${e}"`);
	An !== e && (An = e, Vn());
}
function z() {
	return An === void 0 ? void 0 : R(An);
}
function Un(e) {
	if (typeof e != "function") throw TypeError("Palette change listener must be a function");
	return kn.add(e), () => {
		kn.delete(e);
	};
}
function Wn(e) {
	if (jn(e), Rn.has(e)) return !1;
	let t = On.delete(e);
	return t && An === e && (An = void 0, Vn()), t;
}
var Gn = Object.freeze({
	activate: Hn,
	getActive: z,
	get: R,
	list: Bn,
	register: zn,
	remove: Wn,
	subscribe: Un
}), Kn = /* @__PURE__ */ new WeakMap();
function qn(e, t) {
	if (e === void 0) return t;
	let n = e === "active" ? z() : R(e);
	if (!n && e !== "active") throw TypeError(`Unknown palette "${e}"`);
	return n ? [
		n.tokens.primary,
		n.tokens.secondary,
		n.tokens.accent
	] : t;
}
function B(e, t, n) {
	return e === "active" ? Un((e) => {
		n(e ? [
			e.tokens.primary,
			e.tokens.secondary,
			e.tokens.accent
		] : t);
	}) : () => void 0;
}
function V(e) {
	if (!Array.isArray(e) || e.length === 0) throw TypeError("colors must be an array containing at least one CSS color");
	for (let t of e) {
		if (typeof t != "string" || t.trim() === "") throw TypeError("each color must be a non-empty CSS color string");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t)) throw TypeError(`Invalid CSS color "${t}"`);
	}
}
function H(e, t, n) {
	e.width = Math.max(0, t), e.height = Math.max(0, n);
	let r = typeof devicePixelRatio == "number" ? Math.max(1, Math.min(devicePixelRatio, 2)) : 1;
	e.canvas.width = Math.round(e.width * r), e.canvas.height = Math.round(e.height * r), e.context.setTransform(r, 0, 0, r, 0, 0);
}
function U(e) {
	e.width = 0, e.height = 0;
}
function Jn(e, t) {
	return {
		value: e.style.getPropertyValue(t),
		priority: e.style.getPropertyPriority(t)
	};
}
function Yn(e, t, n) {
	n.value === "" ? e.style.removeProperty(t) : e.style.setProperty(t, n.value, n.priority);
}
function W(e) {
	let t = Kn.get(e);
	if (t) {
		t.count++;
		return;
	}
	let n = Jn(e, "position"), r = Jn(e, "isolation"), i = typeof getComputedStyle == "function" ? getComputedStyle(e) : void 0, a = (i?.position ?? (n.value || "static")) === "static", o = (i?.isolation ?? r.value) !== "isolate";
	a && e.style.setProperty("position", "relative"), o && e.style.setProperty("isolation", "isolate"), Kn.set(e, {
		count: 1,
		position: n,
		isolation: r,
		restorePosition: a,
		restoreIsolation: o
	});
}
function G(e) {
	let t = Kn.get(e);
	t && (t.count--, !(t.count > 0) && (Kn.delete(e), t.restorePosition && Yn(e, "position", t.position), t.restoreIsolation && Yn(e, "isolation", t.isolation)));
}
function K(e) {
	let t = b();
	if (e.animated && e.speed > 0 && !t && (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function")) throw Error(`${e.errorName} requires requestAnimationFrame and cancelAnimationFrame when motion is enabled`);
	let n = /* @__PURE__ */ new Set(), r = !1, i = t, a = typeof document > "u" || !document.hidden, o = null, s = null, c = () => {
		o !== null && (typeof cancelAnimationFrame == "function" && cancelAnimationFrame(o), o = null, s = null);
	}, l = (t) => {
		if (o = null, r || i || !a || n.size === 0) return;
		let c = Math.min(Math.max(0, (t - (s ?? t)) / 1e3), .05) * e.speed;
		s = t;
		for (let r of n) e.update(r, c, t);
		u();
	}, u = () => {
		!r && !i && e.animated && e.speed !== 0 && a && n.size !== 0 && o === null && (o = requestAnimationFrame(l));
	}, d = () => {
		a = !document.hidden, a ? (s = null, u()) : c();
	}, f = (t) => {
		r || (i = t, t ? (c(), e.renderStatic()) : (s = null, u()));
	}, p = typeof document < "u" && typeof document.addEventListener == "function" && typeof document.removeEventListener == "function";
	p && document.addEventListener("visibilitychange", d);
	let m = C(f);
	return {
		get isReducedMotion() {
			return i;
		},
		setVisible: (e, t) => {
			r || (t ? n.add(e) : n.delete(e), n.size === 0 ? c() : u());
		},
		destroy: () => {
			r || (r = !0, c(), m(), p && document.removeEventListener("visibilitychange", d), n.clear());
		}
	};
}
// src/backgrounds/aurora.ts
var Xn = [
	"#7c3aed",
	"#06b6d4",
	"#ec4899"
], Zn = 8, Qn = 60, $n = .7, er = 24, tr = 0;
function nr(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function rr(e) {
	if (!Array.isArray(e) || e.length < 2) throw TypeError("colors must be an array containing at least two CSS colors");
	for (let t of e) {
		if (typeof t != "string" || t.trim() === "") throw TypeError("each color must be a non-empty CSS color string");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t)) throw TypeError(`Invalid CSS color "${t}"`);
	}
}
function ir(e) {
	let t = document.createElement("style");
	t.textContent = `
@keyframes ${e} {
  0% { transform: translate3d(-4%, -3%, 0) scale(1); }
  50% { transform: translate3d(4%, 3%, 0) scale(1.08); }
  100% { transform: translate3d(-4%, -3%, 0) scale(1); }
}`;
	let n = document.head ?? document.documentElement;
	if (!n) throw Error("aurora() requires a document head or document element");
	return n.appendChild(t), t;
}
function ar(e, t = {}) {
	let { colors: n = Xn, speed: r = Zn, blur: i = Qn, opacity: a = $n, borderRadius: o = er, waveCount: s = 3 } = t;
	if (rr(n), !Number.isInteger(s) || s < 1 || s > 8) throw RangeError(`waveCount must be an integer from 1 to 8, received ${String(s)}`);
	if (nr("speed", r, Number.MIN_VALUE), nr("blur", i, 0), nr("opacity", a, 0, 1), nr("borderRadius", o, 0), r === 0) throw RangeError("speed must be greater than 0");
	let c = D(e);
	if (c.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("aurora() requires document.createElement, which is not available in this environment");
	let l = `af-motion-aurora-${++tr}`, u = ir(l), d = b(), f = [], p = [], m = !1;
	try {
		for (let e of c) {
			let t = document.createElement("div");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "-20%"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none");
			let c = s === 3 ? [
				`radial-gradient(ellipse at 20% 20%, ${n[0]}, transparent 60%)`,
				`radial-gradient(ellipse at 80% 30%, ${n[1]}, transparent 55%)`,
				`radial-gradient(ellipse at 50% 85%, ${n[2 % n.length]}, transparent 60%)`
			] : Array.from({ length: s }, (e, t) => {
				let r = t / s;
				return `radial-gradient(ellipse at ${Math.round(14 + r * 72)}% ${Math.round(18 + t % 2 * 55 + r * 12)}%, ${n[t % n.length] ?? n[0]}, transparent ${t % 2 == 0 ? 60 : 55}%)`;
			});
			t.style.setProperty("background", c.join(", ")), t.style.setProperty("filter", `blur(${i}px)`), t.style.setProperty("opacity", String(a)), t.style.setProperty("border-radius", `${o}px`), t.style.setProperty("will-change", d ? "auto" : "transform"), d || t.style.setProperty("animation", `${l} ${r}s ease-in-out infinite`), W(e), p.push(e), e.insertBefore(t, e.firstChild), f.push(t);
		}
	} catch (e) {
		for (let e of f) e.parentElement?.removeChild(e);
		for (let e of p) G(e);
		throw u.parentElement?.removeChild(u), e;
	}
	let h = C((e) => {
		if (!m) for (let t of f) e ? (t.style.removeProperty("animation"), t.style.setProperty("will-change", "auto")) : (t.style.setProperty("will-change", "transform"), t.style.setProperty("animation", `${l} ${r}s ease-in-out infinite`));
	});
	return { destroy: () => {
		if (!m) {
			m = !0, h();
			for (let e = 0; e < f.length; e++) {
				let t = f[e], n = c[e];
				t && n && (n.removeChild(t), G(n));
			}
			u.parentElement?.removeChild(u);
		}
	} };
}
// src/backgrounds/advanced-gradient.ts
var or = [
	"#7c3aed",
	"#06b6d4",
	"#ec4899"
], sr = 12, cr = .65, lr = 135, ur = .8, dr = 0;
function fr(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function pr(e) {
	if (!Array.isArray(e) || e.length < 2) throw TypeError("colors must be an array containing at least two CSS colors");
	for (let t of e) {
		if (typeof t != "string" || t.trim() === "") throw TypeError("each color must be a non-empty CSS color string");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t)) throw TypeError(`Invalid CSS color "${t}"`);
	}
}
function mr(e) {
	if (e !== void 0) {
		if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("style must be an object of CSS property/value strings");
		for (let [t, n] of Object.entries(e)) if (t.trim() === "" || typeof n != "string") throw TypeError("style must contain non-empty CSS property names and string values");
	}
}
function hr(e) {
	if (e === void 0) return;
	let t = e === "active" ? z() : R(e);
	if (!t && e !== "active") throw TypeError(`Unknown palette "${e}"`);
	return t ? [
		t.tokens.primary,
		t.tokens.secondary,
		t.tokens.accent
	] : void 0;
}
function gr(e, t, n) {
	let r = n * Math.PI / 180, i = Math.cos(r) * t * 8, a = Math.sin(r) * t * 8, o = document.createElement("style");
	o.textContent = `
@keyframes ${e} {
  0%, 100% { transform: translate3d(${-i}%, ${-a}%, 0) scale(1.04); }
  50% { transform: translate3d(${i}%, ${a}%, 0) scale(1.12); }
}`;
	let s = document.head ?? document.documentElement;
	if (!s) throw Error("advancedGradientBackground() requires a document head or document element");
	return s.appendChild(o), o;
}
function _r(e, t, n) {
	return e === "mesh" ? [
		`radial-gradient(ellipse at 18% 24%, ${t[0]}, transparent 52%)`,
		`radial-gradient(ellipse at 82% 28%, ${t[1]}, transparent 50%)`,
		`radial-gradient(ellipse at 52% 82%, ${t[2 % t.length]}, transparent 55%)`,
		`linear-gradient(${n}deg, ${t.join(", ")})`
	].join(", ") : e === "aurora" ? [
		`radial-gradient(ellipse at 20% 25%, ${t[0]}, transparent 60%)`,
		`radial-gradient(ellipse at 80% 30%, ${t[1]}, transparent 55%)`,
		`radial-gradient(ellipse at 50% 85%, ${t[2 % t.length]}, transparent 60%)`
	].join(", ") : e === "radial" ? `radial-gradient(ellipse at center, ${t.join(", ")})` : `conic-gradient(from ${n}deg at center, ${t.join(", ")})`;
}
function vr(e, t = {}) {
	let { type: n = "mesh", colors: r = or, palette: i, speed: a = sr, intensity: o = cr, direction: s = lr, opacity: c = ur, className: l, style: u } = t;
	if (![
		"mesh",
		"aurora",
		"radial",
		"conic"
	].includes(n)) throw TypeError(`Unknown advanced gradient type "${String(n)}"`);
	if (fr("speed", a, 0), fr("intensity", o, 0, 1), fr("direction", s, -Infinity), fr("opacity", c, 0, 1), l !== void 0 && typeof l != "string") throw TypeError("className must be a string");
	mr(u);
	let d = D(e);
	if (d.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("advancedGradientBackground() requires document.createElement");
	let f = hr(i) ?? r;
	pr(f), i === "active" && pr(r);
	let p = `af-motion-advanced-gradient-${++dr}`, m = gr(p, o, s), h = b(), g = [], _ = [], v = !1, y = (e, t) => {
		e.style.setProperty("background-image", _r(n, t, s));
		let r = `${100 + o * 100}% ${100 + o * 100}%`;
		e.style.setProperty("background-size", r);
	}, x = (e) => {
		for (let t of g) e || a === 0 || n !== "mesh" && n !== "aurora" ? (t.style.removeProperty("animation"), t.style.setProperty("will-change", "auto")) : (t.style.setProperty("animation", `${p} ${a}s ease-in-out infinite`), t.style.setProperty("will-change", "transform"));
	};
	try {
		for (let e of d) {
			let t = document.createElement("div");
			t.setAttribute("aria-hidden", "true"), l && (t.className = l), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", n === "aurora" ? "-20%" : "-8%"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none"), t.style.setProperty("opacity", String(c)), n === "aurora" && t.style.setProperty("filter", `blur(${Math.round(60 * o)}px)`), y(t, f);
			for (let [e, n] of Object.entries(u ?? {})) t.style.setProperty(e, n);
			W(e), _.push(e), e.insertBefore(t, e.firstChild), g.push(t);
		}
		x(h);
	} catch (e) {
		for (let e of g) e.parentElement?.removeChild(e);
		for (let e of _) G(e);
		throw m.parentElement?.removeChild(m), e;
	}
	let S = C(x), w = i === "active" ? Un((e) => {
		if (v) return;
		let t = e ? [
			e.tokens.primary,
			e.tokens.secondary,
			e.tokens.accent
		] : r;
		pr(t);
		for (let e of g) y(e, t);
	}) : () => void 0;
	return { destroy: () => {
		if (!v) {
			v = !0, S(), w();
			for (let e = 0; e < g.length; e++) {
				let t = g[e], n = d[e];
				t && n && (t.parentElement === n && n.removeChild(t), G(n));
			}
			m.parentElement?.removeChild(m);
		}
	} };
}
// src/backgrounds/floating-orbs.ts
var yr = [
	"#7c3aed",
	"#06b6d4",
	"#ec4899"
], br = 5, xr = 80, Sr = 240, Cr = 40, wr = 12, Tr = .6, Er = 100, Dr = 0;
function Or(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function kr(e) {
	if (!Array.isArray(e) || e.length === 0) throw TypeError("colors must be an array containing at least one CSS color");
	for (let t of e) {
		if (typeof t != "string" || t.trim() === "") throw TypeError("each color must be a non-empty CSS color string");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t)) throw TypeError(`Invalid CSS color "${t}"`);
	}
}
function Ar(e) {
	let t = document.createElement("style");
	t.textContent = `
@keyframes ${e} {
  0% { transform: translate3d(-12px, -18px, 0) scale(1); }
  33% { transform: translate3d(22px, -8px, 0) scale(1.08); }
  66% { transform: translate3d(8px, 24px, 0) scale(0.94); }
  100% { transform: translate3d(-12px, -18px, 0) scale(1); }
}`;
	let n = document.head ?? document.documentElement;
	if (!n) throw Error("floatingOrbs() requires a document head or document element");
	return n.appendChild(t), t;
}
function jr(e, t) {
	let n = (e * 61 + 17) % 88 + 6, r = (e * 43 + 29) % 82 + 9;
	return {
		left: Math.min(n, 100),
		top: Math.min(r, 100 - 100 / t)
	};
}
function Mr(e, t = {}) {
	let { colors: n = yr, count: r = br, minSize: i = xr, maxSize: a = Sr, blur: o = Cr, speed: s = wr, opacity: c = Tr } = t;
	if (kr(n), Or("count", r, 1, Er), !Number.isInteger(r)) throw RangeError(`count must be an integer from 1 to ${Er}, received ${String(r)}`);
	if (Or("minSize", i, Number.MIN_VALUE), Or("maxSize", a, Number.MIN_VALUE), a < i) throw RangeError(`maxSize must be greater than or equal to minSize, received ${String(a)}`);
	Or("blur", o, 0), Or("speed", s, Number.MIN_VALUE), Or("opacity", c, 0, 1);
	let l = D(e);
	if (l.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("floatingOrbs() requires document.createElement, which is not available in this environment");
	let u = `af-motion-floating-orbs-${++Dr}`, d = Ar(u), f = b(), p = [], m = [], h = !1;
	try {
		for (let e of l) {
			let t = document.createElement("div");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("z-index", "-1"), t.style.setProperty("overflow", "hidden"), t.style.setProperty("pointer-events", "none");
			for (let e = 0; e < r; e++) {
				let l = document.createElement("span"), d = i + (a - i) * (e * 37 % r) / Math.max(r - 1, 1), p = jr(e, r);
				l.setAttribute("aria-hidden", "true"), l.style.setProperty("position", "absolute"), l.style.setProperty("left", `${p.left}%`), l.style.setProperty("top", `${p.top}%`), l.style.setProperty("width", `${d}px`), l.style.setProperty("height", `${d}px`), l.style.setProperty("border-radius", "50%"), l.style.setProperty("background", `radial-gradient(circle, ${n[e % n.length]} 0%, transparent 70%)`), l.style.setProperty("filter", `blur(${o}px)`), l.style.setProperty("opacity", String(c)), l.style.setProperty("pointer-events", "none"), f ? l.style.setProperty("will-change", "auto") : (l.style.setProperty("will-change", "transform"), l.style.setProperty("animation", `${u} ${s}s ease-in-out ${-(s * e) / r}s infinite`)), t.appendChild(l);
			}
			W(e), m.push(e), e.insertBefore(t, e.firstChild), p.push(t);
		}
	} catch (e) {
		for (let e of p) e.parentElement?.removeChild(e);
		for (let e of m) G(e);
		throw d.parentElement?.removeChild(d), e;
	}
	let g = C((e) => {
		if (!h) for (let t of p) for (let n of Array.from(t.children)) if (e) n.style.removeProperty("animation"), n.style.setProperty("will-change", "auto");
		else {
			n.style.setProperty("will-change", "transform");
			let e = Array.from(t.children).indexOf(n);
			n.style.setProperty("animation", `${u} ${s}s ease-in-out ${-(s * e) / r}s infinite`);
		}
	});
	return { destroy: () => {
		if (!h) {
			h = !0, g();
			for (let e = 0; e < p.length; e++) {
				let t = p[e], n = l[e];
				t && n && (n.removeChild(t), G(n));
			}
			d.parentElement?.removeChild(d);
		}
	} };
}
// src/backgrounds/gradient.ts
var Nr = [
	"#7c3aed",
	"#06b6d4",
	"#ec4899"
], Pr = 135, Fr = 8, Ir = .8, Lr = 0;
function Rr(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function zr(e) {
	if (!Array.isArray(e) || e.length < 2) throw TypeError("colors must be an array containing at least two CSS colors");
	for (let t of e) {
		if (typeof t != "string" || t.trim() === "") throw TypeError("each color must be a non-empty CSS color string");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t)) throw TypeError(`Invalid CSS color "${t}"`);
	}
}
function Br(e) {
	let t = document.createElement("style");
	t.textContent = `
@keyframes ${e} {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`;
	let n = document.head ?? document.documentElement;
	if (!n) throw Error("gradientBackground() requires a document head or document element");
	return n.appendChild(t), t;
}
function Vr(e, t = {}) {
	let { colors: n = Nr, angle: r = Pr, speed: i = Fr, opacity: a = Ir } = t;
	zr(n), Rr("angle", r, -Infinity), Rr("speed", i, 0), Rr("opacity", a, 0, 1);
	let o = D(e);
	if (o.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("gradientBackground() requires document.createElement, which is not available in this environment");
	let s = `af-motion-gradient-${++Lr}`, c = Br(s), l = b(), u = [], d = [], f = !1, p = `linear-gradient(${r}deg, ${n.join(", ")})`;
	try {
		for (let e of o) {
			let t = document.createElement("div");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none"), t.style.setProperty("background-image", p), t.style.setProperty("background-size", i > 0 && !l ? "200% 200%" : "100% 100%"), t.style.setProperty("background-position", "50% 50%"), t.style.setProperty("opacity", String(a)), i > 0 && !l && t.style.setProperty("animation", `${s} ${i}s ease-in-out infinite`), W(e), d.push(e), u.push(t), e.insertBefore(t, e.firstChild);
		}
	} catch (e) {
		for (let e of u) e.parentElement?.removeChild(e);
		for (let e of d) G(e);
		throw c.parentElement?.removeChild(c), e;
	}
	let m = C((e) => {
		if (!f) for (let t of u) e || i === 0 ? (t.style.removeProperty("animation"), t.style.setProperty("background-size", "100% 100%")) : (t.style.setProperty("background-size", "200% 200%"), t.style.setProperty("animation", `${s} ${i}s ease-in-out infinite`));
	});
	return { destroy: () => {
		if (!f) {
			f = !0, m();
			for (let e = 0; e < u.length; e++) {
				let t = u[e], n = o[e];
				t && n && (n.removeChild(t), G(n));
			}
			c.parentElement?.removeChild(c);
		}
	} };
}
// src/backgrounds/particle-field.ts
var Hr = ["#7c3aed", "#06b6d4"], Ur = 60, Wr = 2, Gr = 1, Kr = 1e3, qr = 120, Jr = 18;
function Yr(e) {
	if (!Array.isArray(e) || e.length === 0) throw TypeError("colors must be an array containing at least one CSS color");
	for (let t of e) {
		if (typeof t != "string" || t.trim() === "") throw TypeError("each color must be a non-empty CSS color string");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t)) throw TypeError(`Invalid CSS color "${t}"`);
	}
}
function Xr(e, t, n) {
	return Array.from({ length: e }, (e, r) => {
		let i = r * .61803398875 % 1, a = (r * .75487766625 + .5) % 1, o = r * 2.399963229728653 % (Math.PI * 2), s = Jr * n * (.35 + r * 17 % 13 / 20);
		return {
			x: i,
			y: a,
			vx: Math.cos(o) * s,
			vy: Math.sin(o) * s,
			color: t[r % t.length]
		};
	});
}
function Zr(e, t, n, r, i) {
	let a = document.createElement("canvas"), o = a.getContext("2d");
	if (!o) throw Error("particleField() requires a canvas with a 2D rendering context");
	return a.setAttribute("aria-hidden", "true"), a.style.setProperty("position", "absolute"), a.style.setProperty("inset", "0"), a.style.setProperty("width", "100%"), a.style.setProperty("height", "100%"), a.style.setProperty("display", "block"), a.style.setProperty("z-index", "-1"), a.style.setProperty("pointer-events", "none"), {
		element: e,
		canvas: a,
		context: o,
		particles: Xr(n, t, i),
		width: 0,
		height: 0
	};
}
function Qr(e, t, n) {
	let { context: r, particles: i, width: a, height: o } = e;
	r.clearRect(0, 0, a, o);
	for (let e of i) r.beginPath(), r.arc(e.x * a, e.y * o, t, 0, Math.PI * 2), r.fillStyle = e.color, r.fill();
	if (n) {
		for (let e = 0; e < i.length; e++) {
			let t = i[e];
			if (t) for (let n = e + 1; n < i.length; n++) {
				let e = i[n];
				if (!e) continue;
				let s = (t.x - e.x) * a, c = (t.y - e.y) * o, l = Math.hypot(s, c);
				l >= qr || (r.beginPath(), r.moveTo(t.x * a, t.y * o), r.lineTo(e.x * a, e.y * o), r.strokeStyle = t.color, r.globalAlpha = 1 - l / qr, r.lineWidth = 1, r.stroke());
			}
		}
		r.globalAlpha = 1;
	}
}
function $r(e, t = {}) {
	let { count: n = Ur, colors: r = Hr, size: i = Wr, speed: a = Gr, connections: o = !1 } = t;
	if (Yr(r), !Number.isInteger(n) || n < 1 || n > Kr) throw RangeError(`count must be an integer from 1 to ${Kr}, received ${String(n)}`);
	if (typeof i != "number" || !Number.isFinite(i) || i <= 0) throw RangeError(`size must be a finite number > 0, received ${String(i)}`);
	if (typeof a != "number" || !Number.isFinite(a) || a < 0) throw RangeError(`speed must be a finite number >= 0, received ${String(a)}`);
	if (typeof o != "boolean") throw TypeError(`connections must be a boolean, received ${String(o)}`);
	let s = D(e);
	if (s.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("particleField() requires document.createElement, which is not available in this environment");
	let c = s.map((e) => Zr(e, r, n, i, a)), l = new Map(c.map((e) => [e.element, e])), u = !1, d = (e, t, n) => {
		H(e, t, n), Qr(e, i, o);
	};
	for (let e of c) {
		let t = e.element.getBoundingClientRect();
		d(e, t.width, t.height);
	}
	let f = K({
		speed: 1,
		animated: a > 0,
		errorName: "particleField()",
		renderStatic: () => c.forEach((e) => Qr(e, i, o)),
		update: (e, t) => {
			for (let n of e.particles) n.x = (n.x + n.vx * t / Math.max(e.width, 1) + 1) % 1, n.y = (n.y + n.vy * t / Math.max(e.height, 1) + 1) % 1;
			Qr(e, i, o);
		}
	}), p, m;
	try {
		typeof IntersectionObserver == "function" && (p = new IntersectionObserver((e) => {
			for (let t of e) {
				let e = l.get(t.target);
				e && f.setVisible(e, t.isIntersecting);
			}
		})), typeof ResizeObserver == "function" && (m = new ResizeObserver((e) => {
			if (!u) for (let t of e) {
				let e = l.get(t.target);
				e && d(e, t.contentRect.width, t.contentRect.height);
			}
		}));
	} catch (e) {
		throw f.destroy(), p?.disconnect(), m?.disconnect(), e;
	}
	let h = () => {
		if (!u) for (let e of c) {
			let t = e.element.getBoundingClientRect();
			d(e, t.width, t.height);
		}
	}, g = !m && typeof window < "u";
	g && window.addEventListener("resize", h);
	let _ = [], v = [];
	try {
		for (let e of c) W(e.element), _.push(e.element), e.element.insertBefore(e.canvas, e.element.firstChild), v.push(e), p?.observe(e.element), m?.observe(e.element), p || f.setVisible(e, !0);
	} catch (e) {
		f.destroy(), p?.disconnect(), m?.disconnect();
		for (let e of v) e.element.removeChild(e.canvas), U(e.canvas);
		for (let e of _) G(e);
		throw e;
	}
	return { destroy: () => {
		if (!u) {
			u = !0, f.destroy(), p?.disconnect(), m?.disconnect(), g && window.removeEventListener("resize", h);
			for (let e of c) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas), U(e.canvas), G(e.element);
		}
	} };
}
// src/backgrounds/particle-background.ts
var ei = ["#7c3aed", "#06b6d4"], ti = 60, ni = 2, ri = 1, ii = .8, ai = 120, oi = 120, si = 180, ci = 1e3, li = 18;
function q(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function ui(e, t, n, r) {
	return t === void 0 ? e ?? ti : Math.max(1, Math.min(ci, Math.round(n * r / 1e4 * t)));
}
function di(e, t) {
	return Array.from({ length: e }, (e, n) => {
		let r = n * 2.399963229728653, i = (n * .61803398875 + .13) % 1, a = (n * .75487766625 + .47) % 1, o = li * t * (.35 + n * 17 % 13 / 20);
		return {
			x: i,
			y: a,
			vx: Math.cos(r) * o,
			vy: Math.sin(r) * o,
			colorIndex: n
		};
	});
}
function fi(e, t, n) {
	if (n <= 0) return;
	let { context: r, particles: i, width: a, height: o } = e, s = /* @__PURE__ */ new Map(), c = (e, t) => `${e},${t}`;
	for (let e = 0; e < i.length; e++) {
		let t = i[e];
		if (!t) continue;
		let r = c(Math.floor(t.x * a / n), Math.floor(t.y * o / n)), l = s.get(r);
		l ? l.push(e) : s.set(r, [e]);
	}
	for (let e = 0; e < i.length; e++) {
		let l = i[e];
		if (!l) continue;
		let u = l.x * a, d = l.y * o, f = Math.floor(u / n), p = Math.floor(d / n);
		for (let m = -1; m <= 1; m++) for (let h = -1; h <= 1; h++) {
			let g = s.get(c(f + h, p + m));
			if (g) for (let s of g) {
				if (s <= e) continue;
				let c = i[s];
				if (!c) continue;
				let f = (l.x - c.x) * a, p = (l.y - c.y) * o, m = Math.hypot(f, p);
				m >= n || (r.beginPath(), r.moveTo(u, d), r.lineTo(c.x * a, c.y * o), r.strokeStyle = t[l.colorIndex] ?? t[0] ?? "#000", r.globalAlpha = (1 - m / n) * .45, r.lineWidth = 1, r.stroke());
			}
		}
	}
	r.globalAlpha = 1;
}
function pi(e, t, n, r, i, a, o, s) {
	let { context: c, particles: l, width: u, height: d } = e;
	c.clearRect(0, 0, u, d), (t === "network" || t === "constellation") && fi(e, n, a), c.globalAlpha = i;
	for (let t of l) {
		let a = t.x * u, l = t.y * d;
		if (c.beginPath(), c.arc(a, l, r, 0, Math.PI * 2), c.fillStyle = n[t.colorIndex] ?? n[0] ?? "#000", c.fill(), s && e.pointerActive) {
			let r = a - e.pointerX, s = l - e.pointerY, u = Math.hypot(r, s);
			u < o && (c.beginPath(), c.moveTo(e.pointerX, e.pointerY), c.lineTo(a, l), c.strokeStyle = n[t.colorIndex] ?? n[0] ?? "#000", c.globalAlpha = i * (1 - u / o) * .7, c.lineWidth = 1, c.stroke(), c.globalAlpha = i);
		}
	}
	c.globalAlpha = 1;
}
function mi(e, t = {}) {
	let { mode: n = "floating", count: r, density: i, colors: a = ei, palette: o, speed: s = ri, size: c = ni, opacity: l = ii, connectionDistance: u = ai, pointerInteraction: d = n === "cursor", pointerRadius: f = oi, pointerStrength: p = si } = t;
	if (![
		"floating",
		"network",
		"cursor",
		"constellation"
	].includes(n)) throw TypeError(`Unknown particle background mode "${String(n)}"`);
	if (r !== void 0 && i !== void 0) throw TypeError("count and density cannot both be specified");
	if (r !== void 0 && (!Number.isInteger(r) || r < 1 || r > ci)) throw RangeError(`count must be an integer from 1 to ${ci}, received ${String(r)}`);
	if (i !== void 0 && q("density", i, Number.MIN_VALUE), q("speed", s, 0), q("size", c, Number.MIN_VALUE), q("opacity", l, 0, 1), q("connectionDistance", u, 0), q("pointerRadius", f, Number.MIN_VALUE), q("pointerStrength", p, 0), typeof d != "boolean") throw TypeError(`pointerInteraction must be a boolean, received ${String(d)}`);
	V(a);
	let m = D(e);
	if (m.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("particleBackground() requires document.createElement");
	let h = qn(o, a);
	V(h);
	let g = [];
	try {
		for (let e of m) {
			let t = document.createElement("canvas"), n = t.getContext("2d");
			if (!n) throw Error("particleBackground() requires a canvas with a 2D rendering context");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("width", "100%"), t.style.setProperty("height", "100%"), t.style.setProperty("display", "block"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none");
			let a = e.getBoundingClientRect(), o = {
				element: e,
				canvas: t,
				context: n,
				particles: di(ui(r, i, a.width, a.height), s),
				width: 0,
				height: 0,
				pointerX: 0,
				pointerY: 0,
				pointerActive: !1
			};
			H(o, a.width, a.height), g.push(o);
		}
	} catch (e) {
		for (let e of g) e.canvas.parentElement?.removeChild(e.canvas), U(e.canvas);
		throw e;
	}
	let _ = !1, v = (e) => {
		pi(e, n, h, c, l, u, f, d);
	}, y = K({
		speed: 1,
		animated: s > 0,
		errorName: "particleBackground()",
		renderStatic: () => g.forEach(v),
		update: (e, t) => {
			if (s > 0) {
				let r = n === "constellation" ? .12 : 1;
				for (let n of e.particles) {
					if (d && e.pointerActive) {
						let r = n.x * e.width - e.pointerX, i = n.y * e.height - e.pointerY, a = Math.hypot(r, i);
						if (a > 0 && a < f) {
							let e = (1 - a / f) * p * t;
							n.vx += r / a * e, n.vy += i / a * e;
						}
					}
					n.x = (n.x + n.vx * r * t / Math.max(e.width, 1) + 1) % 1, n.y = (n.y + n.vy * r * t / Math.max(e.height, 1) + 1) % 1, n.vx *= .995, n.vy *= .995;
				}
			}
			v(e);
		}
	}), b = (e, t, n) => {
		H(e, t, n);
		let a = ui(r, i, e.width, e.height);
		e.particles.length !== a && (e.particles = di(a, s)), v(e);
	}, x, S;
	try {
		if (typeof IntersectionObserver == "function") x = new IntersectionObserver((e) => {
			for (let t of e) {
				let e = g.find((e) => e.element === t.target);
				e && y.setVisible(e, t.isIntersecting);
			}
		});
		else for (let e of g) y.setVisible(e, !0);
		typeof ResizeObserver == "function" && (S = new ResizeObserver((e) => {
			if (!_) for (let t of e) {
				let e = g.find((e) => e.element === t.target);
				e && b(e, t.contentRect.width, t.contentRect.height);
			}
		}));
	} catch (e) {
		throw y.destroy(), x?.disconnect(), S?.disconnect(), e;
	}
	let C = () => {
		if (!_) for (let e of g) {
			let t = e.element.getBoundingClientRect();
			b(e, t.width, t.height);
		}
	}, w = !S && typeof window < "u";
	w && window.addEventListener("resize", C);
	let T = /* @__PURE__ */ new Map();
	if (d) for (let e of g) {
		let t = (t) => {
			if (_ || y.isReducedMotion) return;
			let n = t, r = e.element.getBoundingClientRect();
			e.pointerX = n.clientX - r.left, e.pointerY = n.clientY - r.top, e.pointerActive = !0, v(e);
		}, n = () => {
			e.pointerActive = !1, v(e);
		};
		e.element.addEventListener("pointermove", t), e.element.addEventListener("pointerleave", n), T.set(e.element, {
			move: t,
			leave: n
		});
	}
	let E = [], O = [];
	try {
		for (let e of g) W(e.element), E.push(e.element), e.element.insertBefore(e.canvas, e.element.firstChild), O.push(e), x?.observe(e.element), S?.observe(e.element), v(e);
	} catch (e) {
		y.destroy(), x?.disconnect(), S?.disconnect(), w && window.removeEventListener("resize", C);
		for (let [e, t] of T) e.removeEventListener("pointermove", t.move), e.removeEventListener("pointerleave", t.leave);
		for (let e of O) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas);
		for (let e of E) G(e);
		throw e;
	}
	let k = B(o, a, (e) => {
		if (!_) {
			h = e, V(h);
			for (let e of g) v(e);
		}
	});
	return { destroy: () => {
		if (!_) {
			_ = !0, y.destroy(), k(), x?.disconnect(), S?.disconnect(), w && window.removeEventListener("resize", C);
			for (let e of g) {
				let t = T.get(e.element);
				t && (e.element.removeEventListener("pointermove", t.move), e.element.removeEventListener("pointerleave", t.leave)), e.canvas.parentElement === e.element && e.element.removeChild(e.canvas), U(e.canvas), G(e.element);
			}
		}
	} };
}
// src/backgrounds/cosmic-background.ts
var hi = [
	"#9b8cff",
	"#74e6ff",
	"#ff9ed8"
], gi = 1.5, _i = 1, vi = 1, yi = .8, bi = 6, xi = 140, Si = 2400;
function Ci(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function wi(e, t, n) {
	return Math.min(Si, Math.round(e * t / 1e4 * n));
}
function Ti(e, t) {
	return Array.from({ length: e }, (n, r) => {
		let i = .15 + r * 37 % 86 / 100;
		if (t === "galaxy") {
			let t = (r + .5) / Math.max(e, 1), n = r % 3, a = Math.sqrt(t) * .48, o = a * 9 + n * Math.PI * 2 / 3;
			return {
				x: .5 + Math.cos(o) * a,
				y: .5 + Math.sin(o) * a * .72,
				size: .45 + i * 1.8,
				depth: i,
				colorIndex: r,
				twinkle: r * .37 % (Math.PI * 2)
			};
		}
		return {
			x: (r * .61803398875 + .13) % 1,
			y: (r * .75487766625 + .47) % 1,
			size: .4 + i * 1.8,
			depth: i,
			colorIndex: r,
			twinkle: r * .37 % (Math.PI * 2)
		};
	});
}
function Ei() {
	return [
		{
			x: .22,
			y: .32,
			radius: .38,
			colorIndex: 0,
			phase: 0
		},
		{
			x: .72,
			y: .3,
			radius: .34,
			colorIndex: 1,
			phase: 2.1
		},
		{
			x: .5,
			y: .74,
			radius: .42,
			colorIndex: 2,
			phase: 4.2
		},
		{
			x: .92,
			y: .78,
			radius: .26,
			colorIndex: 0,
			phase: 5.3
		}
	];
}
function Di(e, t, n, r) {
	let { context: i, clouds: a, width: o, height: s } = e;
	for (let e of a) {
		let a = Math.sin(r * .12 + e.phase) * .025, c = (e.x + a) * o, l = (e.y + Math.cos(r * .1 + e.phase) * .02) * s, u = e.radius * Math.max(o, s), d = i.createRadialGradient(c, l, 0, c, l, u), f = t[e.colorIndex % t.length] ?? t[0] ?? "#fff";
		d.addColorStop(0, f), d.addColorStop(.35, f), d.addColorStop(1, "transparent"), i.globalAlpha = n * .34, i.fillStyle = d, i.fillRect(c - u, l - u, u * 2, u * 2);
	}
	i.globalAlpha = 1;
}
function Oi(e, t, n, r, i) {
	let { context: a, stars: o, width: s, height: c } = e, l = n === "galaxy" ? e.rotation : 0;
	for (let n of o) {
		let o = n.x - .5, u = n.y - .5, d = o * Math.cos(l) - u * Math.sin(l), f = o * Math.sin(l) + u * Math.cos(l), p = (.5 + d) * s, m = (.5 + f) * c, h = .75 + Math.sin(e.elapsed * 1.4 + n.twinkle) * .2, g = n.size * (.4 + r * .6);
		a.globalAlpha = i * h * (.35 + n.depth * .65), a.fillStyle = t[n.colorIndex % t.length] ?? t[0] ?? "#fff", a.beginPath(), a.arc(p, m, g, 0, Math.PI * 2), a.fill(), n.depth > .88 && g > 1.5 && (a.globalAlpha *= .55, a.fillRect(p - g * 2, m - .35, g * 4, .7), a.fillRect(p - .35, m - g * 2, .7, g * 4));
	}
	a.globalAlpha = 1;
}
function ki(e, t, n) {
	let r = Math.PI * (.58 + Math.random() * .15), i = Math.max(e.width, e.height, 1) * .75 * n;
	e.shootingStars.push({
		x: Math.random() * e.width,
		y: Math.random() * e.height * .65,
		vx: Math.cos(r) * i,
		vy: Math.sin(r) * i,
		age: 0,
		lifetime: .9,
		colorIndex: Math.floor(Math.random() * t.length)
	});
}
function Ai(e, t, n, r) {
	let { context: i } = e;
	for (let a of e.shootingStars) {
		let e = Math.max(0, 1 - a.age / a.lifetime), o = a.x - a.vx / Math.max(Math.hypot(a.vx, a.vy), 1) * r, s = a.y - a.vy / Math.max(Math.hypot(a.vx, a.vy), 1) * r, c = i.createLinearGradient(o, s, a.x, a.y);
		c.addColorStop(0, "transparent"), c.addColorStop(1, t[a.colorIndex % t.length] ?? t[0] ?? "#fff"), i.globalAlpha = n * e, i.strokeStyle = c, i.lineWidth = 2, i.beginPath(), i.moveTo(o, s), i.lineTo(a.x, a.y), i.stroke();
	}
	i.globalAlpha = 1;
}
function ji(e, t, n, r, i, a) {
	e.context.clearRect(0, 0, e.width, e.height), t === "nebula" && Di(e, n, i, e.elapsed), Oi(e, n, t, r, i), t === "shooting-stars" && Ai(e, n, i, a);
}
function Mi(e, t = {}) {
	let { effect: n = "starfield", density: r = gi, speed: i = _i, depth: a = vi, intensity: o = yi, colors: s = hi, palette: c, shootingFrequency: l = bi, trailLength: u = xi } = t;
	if (![
		"starfield",
		"nebula",
		"shooting-stars",
		"galaxy"
	].includes(n)) throw TypeError(`Unknown cosmic background effect "${String(n)}"`);
	Ci("density", r, 0), Ci("speed", i, 0), Ci("depth", a, 0, 1), Ci("intensity", o, 0, 1), Ci("shootingFrequency", l, 0), Ci("trailLength", u, 0), V(s);
	let d = D(e);
	if (d.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("cosmicBackground() requires document.createElement");
	let f = qn(c, s);
	V(f);
	let p = [];
	try {
		for (let e of d) {
			let t = document.createElement("canvas"), i = t.getContext("2d");
			if (!i) throw Error("cosmicBackground() requires a canvas with a 2D rendering context");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("width", "100%"), t.style.setProperty("height", "100%"), t.style.setProperty("display", "block"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none");
			let a = e.getBoundingClientRect(), o = {
				element: e,
				canvas: t,
				context: i,
				width: 0,
				height: 0,
				stars: Ti(wi(a.width, a.height, r), n),
				clouds: Ei(),
				shootingStars: [],
				rotation: 0,
				elapsed: 0,
				nextShootingTime: null
			};
			H(o, a.width, a.height), p.push(o);
		}
	} catch (e) {
		for (let e of p) e.canvas.parentElement?.removeChild(e.canvas), U(e.canvas);
		throw e;
	}
	let m = !1, h = i > 0, g = (e) => {
		ji(e, n, f, a, o, u);
	}, _ = K({
		speed: i,
		animated: h,
		errorName: "cosmicBackground()",
		renderStatic: () => p.forEach(g),
		update: (e, t, r) => {
			if (e.elapsed += t, n === "starfield") for (let n of e.stars) n.y += t * (.012 + n.depth * .045) * a % 1, n.y > 1 && --n.y;
			else if (n === "galaxy") e.rotation += t * .025 * a;
			else if (n === "shooting-stars") {
				if (l > 0) {
					let t = 60 / l;
					e.nextShootingTime === null ? e.nextShootingTime = r + t * 1e3 : r >= e.nextShootingTime && (ki(e, f, i), e.nextShootingTime = r + t * 1e3);
				}
				for (let n of e.shootingStars) n.age += t, n.x += n.vx * t, n.y += n.vy * t;
				e.shootingStars = e.shootingStars.filter((t) => t.age < t.lifetime && t.x > -u && t.y < e.height + u);
			}
			g(e);
		}
	}), v = (e, t, i) => {
		H(e, t, i), e.stars = Ti(wi(e.width, e.height, r), n), e.shootingStars = [], e.nextShootingTime = null, g(e);
	}, y, b;
	try {
		if (typeof IntersectionObserver == "function") y = new IntersectionObserver((e) => {
			for (let t of e) {
				let e = p.find((e) => e.element === t.target);
				e && _.setVisible(e, t.isIntersecting);
			}
		});
		else for (let e of p) _.setVisible(e, !0);
		typeof ResizeObserver == "function" && (b = new ResizeObserver((e) => {
			if (!m) for (let t of e) {
				let e = p.find((e) => e.element === t.target);
				e && v(e, t.contentRect.width, t.contentRect.height);
			}
		}));
	} catch (e) {
		throw _.destroy(), y?.disconnect(), b?.disconnect(), e;
	}
	let x = () => {
		if (!m) for (let e of p) {
			let t = e.element.getBoundingClientRect();
			v(e, t.width, t.height);
		}
	}, S = !b && typeof window < "u";
	S && window.addEventListener("resize", x);
	let C = [], w = [];
	try {
		for (let e of p) W(e.element), C.push(e.element), e.element.insertBefore(e.canvas, e.element.firstChild), w.push(e), y?.observe(e.element), b?.observe(e.element), g(e);
	} catch (e) {
		_.destroy(), y?.disconnect(), b?.disconnect(), S && window.removeEventListener("resize", x);
		for (let e of w) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas);
		for (let e of C) G(e);
		throw e;
	}
	let T = B(c, s, (e) => {
		if (!m) {
			f = e, V(f);
			for (let e of p) g(e);
		}
	});
	return { destroy: () => {
		if (!m) {
			m = !0, _.destroy(), T(), y?.disconnect(), b?.disconnect(), S && window.removeEventListener("resize", x);
			for (let e of p) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas), U(e.canvas), G(e.element);
		}
	} };
}
// src/backgrounds/geometric-backgrounds.ts
var Ni = [
	"#7c3aed",
	"#06b6d4",
	"#ec4899"
], Pi = 1, Fi = .65, J = 160, Ii = 1600;
function Y(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function Li(e, t, n, r) {
	e.strokeStyle = t, e.lineWidth = n, e.globalAlpha = r;
}
function Ri(e, t, n, r) {
	e.beginPath();
	for (let i = 0; i < 6; i++) {
		let a = Math.PI / 3 * i, o = t + Math.cos(a) * r, s = n + Math.sin(a) * r;
		i === 0 ? e.moveTo(o, s) : e.lineTo(o, s);
	}
	e.closePath(), e.stroke();
}
function zi(e, t, n, r, i, a, o) {
	let { context: s, width: c, height: l } = e;
	Li(s, t, i, a);
	let u = Math.max(r, c / J, l / J), d = Math.min(J, Math.ceil(c / u) + 1), f = Math.min(J, Math.ceil(l / u) + 1);
	if (o > 0) {
		let e = l * (.12 + (1 - o) * .35);
		for (let t = 0; t <= d; t++) {
			let n = t * u, r = (n - c / 2) * o * .72;
			s.beginPath(), s.moveTo(c / 2 + r * .05, e), s.lineTo(n, l), s.stroke();
		}
		for (let t = 1; t <= f; t++) {
			let n = t / f, r = e + (l - e) * n * n;
			s.beginPath(), s.moveTo(0, r), s.lineTo(c, r), s.stroke();
		}
		s.globalAlpha = 1;
	} else {
		if (n === "square") {
			for (let e = 0; e <= c; e += u) s.beginPath(), s.moveTo(e, 0), s.lineTo(e, l), s.stroke();
			for (let e = 0; e <= l; e += u) s.beginPath(), s.moveTo(0, e), s.lineTo(c, e), s.stroke();
		} else if (n === "dot") {
			s.fillStyle = t;
			for (let e = 0; e <= l; e += u) for (let t = 0; t <= c; t += u) s.beginPath(), s.arc(t, e, i, 0, Math.PI * 2), s.fill();
		} else if (n === "diamond") for (let e = 0; e <= l; e += r) for (let t = 0; t <= c; t += r) s.beginPath(), s.moveTo(t, e - u / 2), s.lineTo(t + u / 2, e), s.lineTo(t, e + u / 2), s.lineTo(t - u / 2, e), s.closePath(), s.stroke();
		else {
			let e = u / Math.sqrt(3), t = u, n = e * 1.5;
			for (let r = 0; r <= J && r * n <= l + e; r++) {
				let i = 0;
				for (let a = r % 2 * t / 2; a <= c + t && i < J; a += t, i++) Ri(s, a, r * n, e);
			}
		}
		s.globalAlpha = 1;
	}
}
function Bi(e, t, n, r, i, a, o) {
	let { context: s, width: c, height: l } = e, u = Math.min(42, Math.ceil(c / n)), d = Math.min(28, Math.ceil(l / n)), f = Math.max(1, Math.round(3 / r));
	for (let e = 0; e <= d; e++) for (let r = e % 2 * f; r <= u; r += f) {
		let u = r * n, d = e * n, f = Math.min(c, u + n * (.5 + (e + r) % 2 * .5)), p = Math.min(l, d + n * (.45 + (e + r) % 3 * .15)), m = t[(e + r) % t.length] ?? t[0] ?? "#fff";
		s.globalAlpha = a * (.55 + Math.sin(o + e * .7 + r * .45) * .25), s.strokeStyle = m, s.lineWidth = i, s.beginPath(), s.moveTo(u, d), s.lineTo(f, d), s.lineTo(f, p), s.stroke(), s.globalAlpha = a * (.55 + Math.sin(o + e * .7 + r * .45) * .25), s.fillStyle = m, s.shadowColor = m, s.shadowBlur = 7, s.beginPath(), s.arc(f, p, i * 1.6, 0, Math.PI * 2), s.fill(), s.shadowBlur = 0;
	}
	s.globalAlpha = 1;
}
function Vi(e, t, n) {
	e.meshColumns = Math.max(1, Math.ceil(e.width / t)), e.meshRows = Math.max(1, Math.ceil(e.height / t));
	let r = Math.min(Ii, (e.meshColumns + 1) * (e.meshRows + 1)), i = r < (e.meshColumns + 1) * (e.meshRows + 1) ? Math.sqrt(r / ((e.meshColumns + 1) * (e.meshRows + 1))) : 1;
	e.meshColumns = Math.max(1, Math.floor(e.meshColumns * i)), e.meshRows = Math.max(1, Math.floor(e.meshRows * i)), e.meshPoints = [];
	for (let r = 0; r <= e.meshRows; r++) for (let i = 0; i <= e.meshColumns; i++) {
		let a = ((r * 17 + i * 31) % 9 - 4) * n * t * .045, o = ((r * 29 + i * 13) % 9 - 4) * n * t * .045;
		e.meshPoints.push({
			x: i / e.meshColumns * e.width + a,
			y: r / e.meshRows * e.height + o
		});
	}
}
function Hi(e, t, n, r, i, a, o) {
	e.meshPoints.length === 0 && Vi(e, n, r);
	let { context: s, meshPoints: c, meshColumns: l, meshRows: u, width: d, height: f } = e, p = n * i;
	Li(s, t, a, o);
	for (let e = 0; e <= u; e++) for (let n = 0; n <= l; n++) {
		let r = c[e * (l + 1) + n];
		if (r) {
			if (n < l) {
				let t = c[e * (l + 1) + n + 1];
				t && Math.hypot(t.x - r.x, t.y - r.y) <= p && (s.beginPath(), s.moveTo(r.x, r.y), s.lineTo(t.x, t.y), s.stroke());
			}
			if (e < u) {
				let t = c[(e + 1) * (l + 1) + n];
				t && Math.hypot(t.x - r.x, t.y - r.y) <= p && (s.beginPath(), s.moveTo(r.x, r.y), s.lineTo(t.x, t.y), s.stroke());
			}
			if (e < u && n < l && (e + n) % 2 == 0) {
				let t = c[(e + 1) * (l + 1) + n + 1];
				t && Math.hypot(t.x - r.x, t.y - r.y) <= p && (s.beginPath(), s.moveTo(r.x, r.y), s.lineTo(t.x, t.y), s.stroke());
			}
			s.fillStyle = t, s.globalAlpha = o * .85, s.beginPath(), s.arc(Math.max(0, Math.min(d, r.x)), Math.max(0, Math.min(f, r.y)), a * 1.15, 0, Math.PI * 2), s.fill();
		}
	}
	s.globalAlpha = 1;
}
function Ui(e, t, n, r, i, a) {
	let { context: o, width: s, height: c } = e, l = n / Math.sqrt(3), u = n, d = l * 1.5, f = Math.sin(a) * Math.min(n * .035, 2);
	Li(o, t, r, i);
	for (let e = -1; e <= J && e * d <= c + l; e++) {
		let t = 0;
		for (let n = e % 2 * u / 2 - u; n <= s + u && t < J; n += u, t++) Ri(o, n + f, e * d, l);
	}
	o.globalAlpha = 1;
}
function Wi(e, t, n, r, i, a, o, s) {
	let { context: c, width: l, height: u } = e, d = u * r;
	Li(c, t, i, a);
	for (let e = -8; e <= 8; e++) c.beginPath(), c.moveTo(l / 2 + e * n * .08, d), c.lineTo(l / 2 + e * n * 1.8, u), c.stroke();
	let f = Math.min(42, Math.ceil(u / n) + 8), p = s > 0 ? o * s * n % n : 0;
	for (let e = 0; e < f; e++) {
		let t = (e + p / n) / f, r = d + (u - d) * t * t;
		r < d || r > u || (c.beginPath(), c.moveTo(0, r), c.lineTo(l, r), c.stroke());
	}
	c.globalAlpha = 1;
}
function Gi(e, t, n, r) {
	let { context: i } = e;
	i.clearRect(0, 0, e.width, e.height);
	let a = n[0] ?? "#fff", o = r.intensity ?? Fi;
	if (t === "grid") {
		let t = r;
		zi(e, a, t.shape ?? "square", t.spacing ?? 48, t.lineWeight ?? 1, (t.opacity ?? .35) * o, t.perspective ?? 0);
	} else if (t === "tech-circuit") {
		let t = r;
		Bi(e, n, t.spacing ?? 72, t.density ?? 1, t.lineWeight ?? 1.25, o, e.phase);
	} else if (t === "polygon-mesh") {
		let t = r;
		Hi(e, a, t.spacing ?? 96, t.irregularity ?? .2, t.connectionRange ?? 1.55, t.lineWeight ?? 1, o);
	} else if (t === "hexagon-field") {
		let t = r;
		Ui(e, a, t.spacing ?? 56, t.lineWeight ?? 1, o, e.phase);
	} else {
		let t = r;
		Wi(e, a, t.spacing ?? 48, t.horizon ?? .38, t.lineWeight ?? 1, o, e.phase, t.movement ?? 1);
	}
	i.globalAlpha = 1;
}
function Ki(e, t) {
	let n = e.speed ?? Pi, r = e.intensity ?? Fi;
	if (Y("speed", n, 0), Y("intensity", r, 0, 1), t === "grid") {
		let t = e;
		if (Y("spacing", t.spacing ?? 48, Number.MIN_VALUE), Y("lineWeight", t.lineWeight ?? 1, Number.MIN_VALUE), Y("opacity", t.opacity ?? .35, 0, 1), Y("perspective", t.perspective ?? 0, 0, 1), t.shape !== void 0 && ![
			"square",
			"dot",
			"diamond",
			"hexagon"
		].includes(t.shape)) throw TypeError(`Unknown geometric grid shape "${String(t.shape)}"`);
	} else if (t === "tech-circuit") {
		let t = e;
		Y("spacing", t.spacing ?? 72, Number.MIN_VALUE), Y("density", t.density ?? 1, .1, 3), Y("lineWeight", t.lineWeight ?? 1.25, Number.MIN_VALUE);
	} else if (t === "polygon-mesh") {
		let t = e;
		Y("spacing", t.spacing ?? 96, Number.MIN_VALUE), Y("irregularity", t.irregularity ?? .2, 0, 1), Y("connectionRange", t.connectionRange ?? 1.55, 1, 3), Y("lineWeight", t.lineWeight ?? 1, Number.MIN_VALUE);
	} else if (t === "hexagon-field") {
		let t = e;
		if (Y("spacing", t.spacing ?? 56, Number.MIN_VALUE), Y("lineWeight", t.lineWeight ?? 1, Number.MIN_VALUE), t.animate !== void 0 && typeof t.animate != "boolean") throw TypeError(`animate must be a boolean, received ${String(t.animate)}`);
	} else {
		let t = e;
		Y("spacing", t.spacing ?? 48, Number.MIN_VALUE), Y("horizon", t.horizon ?? .38, 0, .9), Y("movement", t.movement ?? 1, 0, 5), Y("lineWeight", t.lineWeight ?? 1, Number.MIN_VALUE);
	}
}
function qi(e, t = {}) {
	let n = t.effect ?? "grid";
	if (![
		"grid",
		"tech-circuit",
		"polygon-mesh",
		"hexagon-field",
		"perspective-floor"
	].includes(n)) throw TypeError(`Unknown geometric background effect "${String(n)}"`);
	Ki(t, n);
	let r = t.colors ?? Ni;
	V(r);
	let i = D(e);
	if (i.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("geometricBackground() requires document.createElement");
	let a = t.speed ?? Pi, o = a > 0 && (n === "tech-circuit" || n === "perspective-floor" && (t.movement ?? 1) > 0 || n === "hexagon-field" && t.animate === !0), s = qn(t.palette, r);
	V(s);
	let c = [];
	try {
		for (let e of i) {
			let t = document.createElement("canvas"), n = t.getContext("2d");
			if (!n) throw Error("geometricBackground() requires a canvas with a 2D rendering context");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("width", "100%"), t.style.setProperty("height", "100%"), t.style.setProperty("display", "block"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none");
			let r = e.getBoundingClientRect(), i = {
				element: e,
				canvas: t,
				context: n,
				width: 0,
				height: 0,
				phase: 0,
				meshPoints: [],
				meshColumns: 0,
				meshRows: 0
			};
			H(i, r.width, r.height), c.push(i);
		}
	} catch (e) {
		for (let e of c) e.canvas.parentElement?.removeChild(e.canvas), U(e.canvas);
		throw e;
	}
	let l = !1, u = (e) => Gi(e, n, s, t), d = K({
		speed: a,
		animated: o,
		errorName: "geometricBackground()",
		renderStatic: () => c.forEach(u),
		update: (e, t) => {
			e.phase += t, u(e);
		}
	}), f, p;
	try {
		if (typeof IntersectionObserver == "function") f = new IntersectionObserver((e) => {
			for (let t of e) {
				let e = c.find((e) => e.element === t.target);
				e && d.setVisible(e, t.isIntersecting);
			}
		});
		else for (let e of c) d.setVisible(e, !0);
		typeof ResizeObserver == "function" && (p = new ResizeObserver((e) => {
			if (!l) for (let t of e) {
				let e = c.find((e) => e.element === t.target);
				e && (H(e, t.contentRect.width, t.contentRect.height), e.meshPoints = [], u(e));
			}
		}));
	} catch (e) {
		throw d.destroy(), f?.disconnect(), p?.disconnect(), e;
	}
	let m = () => {
		if (!l) for (let e of c) {
			let t = e.element.getBoundingClientRect();
			H(e, t.width, t.height), e.meshPoints = [], u(e);
		}
	}, h = !p && typeof window < "u";
	h && window.addEventListener("resize", m);
	let g = [], _ = [];
	try {
		for (let e of c) W(e.element), g.push(e.element), e.element.insertBefore(e.canvas, e.element.firstChild), _.push(e), f?.observe(e.element), p?.observe(e.element), u(e);
	} catch (e) {
		d.destroy(), f?.disconnect(), p?.disconnect(), h && window.removeEventListener("resize", m);
		for (let e of _) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas);
		for (let e of g) G(e);
		throw e;
	}
	let v = B(t.palette, r, (e) => {
		if (!l) {
			s = e, V(s);
			for (let e of c) u(e);
		}
	});
	return { destroy: () => {
		if (!l) {
			l = !0, d.destroy(), v(), f?.disconnect(), p?.disconnect(), h && window.removeEventListener("resize", m);
			for (let e of c) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas), U(e.canvas), G(e.element);
		}
	} };
}
// src/backgrounds/fluid-backgrounds.ts
var Ji = [
	"#7c3aed",
	"#06b6d4",
	"#ec4899",
	"#f59e0b"
], Yi = 1, Xi = .75, Zi = 12;
function X(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function Qi(e, t, n, r) {
	if (!Number.isInteger(t) || t < n || t > r) throw RangeError(`${e} must be an integer from ${n} to ${r}, received ${String(t)}`);
}
function $i(e) {
	return Array.from({ length: e }, (e, t) => ({
		x: (t * .61803398875 + .19) % 1,
		y: (t * .75487766625 + .31) % 1,
		phase: t * 2.399963229728653,
		scale: .68 + t * 19 % 13 / 20,
		colorIndex: t
	}));
}
function ea(e, t, n, r, i, a) {
	let o = e.createRadialGradient(t, n, r * Math.max(0, 1 - a), t, n, r);
	return o.addColorStop(0, i), o.addColorStop(Math.max(.05, 1 - a * .6), i), o.addColorStop(1, "transparent"), o;
}
function ta(e, t, n, r, i) {
	let { context: a, width: o, height: s } = e, c = n.count ?? 5, l = n.size ?? 100, u = n.blur ?? 32;
	for (let n = 0; n < c; n++) {
		let c = e.shapes[n];
		if (!c) continue;
		let d = (c.x + Math.sin(r * .27 + c.phase) * .1) * o, f = (c.y + Math.cos(r * .22 + c.phase) * .12) * s, p = l * c.scale * (1 + Math.sin(r * .3 + c.phase) * .08), m = t[c.colorIndex % t.length] ?? t[0] ?? "#fff";
		a.globalAlpha = i * .85, a.fillStyle = ea(a, d, f, p + u, m, Math.min(.98, u / Math.max(p + u, 1))), a.beginPath(), a.arc(d, f, p + u, 0, Math.PI * 2), a.fill(), a.globalAlpha = i * .45, a.fillStyle = ea(a, d, f, p, m, .9), a.beginPath(), a.arc(d, f, p, 0, Math.PI * 2), a.fill();
	}
	a.globalAlpha = 1;
}
function na(e, t, n, r, i) {
	let { context: a, width: o, height: s } = e, c = n.amplitude ?? 36, l = n.frequency ?? 2.5, u = n.direction ?? "horizontal", d = n.layers ?? 4;
	for (let e = 0; e < d; e++) {
		let n = t[e % t.length] ?? t[0] ?? "#fff", f = e / d * Math.PI * 2, p = 1 - e / (d * 1.6);
		if (a.globalAlpha = i * (.22 + (1 - e / d) * .24), a.fillStyle = n, a.beginPath(), u === "horizontal") {
			let t = s * (.42 + e * .13);
			a.moveTo(0, t);
			for (let e = 0; e <= 40; e++) {
				let n = e / 40 * o, i = t + Math.sin(e / 40 * Math.PI * 2 * l + r + f) * c * p;
				a.lineTo(n, i);
			}
			a.lineTo(o, s), a.lineTo(0, s);
		} else {
			let t = o * (.42 + e * .13);
			a.moveTo(t, 0);
			for (let e = 0; e <= 40; e++) {
				let n = e / 40 * s, i = t + Math.sin(e / 40 * Math.PI * 2 * l + r + f) * c * p;
				a.lineTo(i, n);
			}
			a.lineTo(o, s), a.lineTo(o, 0);
		}
		a.closePath(), a.fill();
	}
	a.globalAlpha = 1;
}
function ra(e, t, n, r, i) {
	let { context: a, width: o, height: s } = e, c = n.count ?? 5, l = n.scale ?? .65, u = Math.max(o, s) * l;
	for (let n = 0; n < c; n++) {
		let c = e.shapes[n];
		if (!c) continue;
		let l = (c.x + Math.sin(r * .13 + c.phase) * .14) * o, d = (c.y + Math.cos(r * .11 + c.phase) * .14) * s, f = t[c.colorIndex % t.length] ?? t[0] ?? "#fff";
		a.globalAlpha = i * (.32 + c.scale * .12), a.fillStyle = ea(a, l, d, u * c.scale, f, .94), a.fillRect(0, 0, o, s);
	}
	a.globalAlpha = 1;
}
function ia(e, t, n, r, i) {
	let { context: a, width: o, height: s } = e, c = n.count ?? 5, l = n.size ?? 80, u = n.spread ?? .3;
	for (let n = 0; n < c; n++) {
		let c = e.shapes[n];
		if (!c) continue;
		let d = (c.x + Math.sin(r * .09 + c.phase) * u * .35) * o, f = (c.y + Math.cos(r * .1 + c.phase) * u * .35) * s, p = l * c.scale, m = t[c.colorIndex % t.length] ?? t[0] ?? "#fff", h = ea(a, d, f, p * (1 + u), m, .86);
		a.globalAlpha = i * .62, a.fillStyle = h, a.beginPath(), a.moveTo(d, f - p), a.bezierCurveTo(d + p * 1.4, f - p * 1.1, d + p * 1.5, f + p * .35, d + p * .2, f + p), a.bezierCurveTo(d - p * .6, f + p * 1.5, d - p * 1.3, f + p * .65, d - p, f - p * .1), a.bezierCurveTo(d - p * 1.35, f - p * .8, d - p * .35, f - p * 1.25, d, f - p), a.closePath(), a.fill();
	}
	a.globalAlpha = 1;
}
function aa(e, t, n, r, i) {
	let { context: a, width: o, height: s } = e, c = n.count ?? 6, l = n.radius ?? 64, u = n.threshold ?? 1.8, d = n.movement ?? 1, f = e.shapes.slice(0, c).map((e) => ({
		x: (e.x + Math.sin(r * .2 + e.phase) * .12 * d) * o,
		y: (e.y + Math.cos(r * .17 + e.phase) * .12 * d) * s,
		radius: l * e.scale,
		shape: e
	}));
	a.globalAlpha = i * .5;
	for (let e = 0; e < f.length; e++) {
		let n = f[e];
		if (n) for (let r = e + 1; r < f.length; r++) {
			let e = f[r];
			if (!e) continue;
			let i = Math.hypot(n.x - e.x, n.y - e.y);
			if (i >= (n.radius + e.radius) * u || i < 1) continue;
			let o = Math.atan2(e.y - n.y, e.x - n.x), s = n.radius * .62, c = e.radius * .62, l = Math.cos(o + Math.PI / 2), d = Math.sin(o + Math.PI / 2);
			a.fillStyle = t[n.shape.colorIndex % t.length] ?? t[0] ?? "#fff", a.beginPath(), a.moveTo(n.x + l * s, n.y + d * s), a.bezierCurveTo(n.x + (e.x - n.x) * .35 + l * s, n.y + (e.y - n.y) * .35 + d * s, e.x - (e.x - n.x) * .35 + l * c, e.y - (e.y - n.y) * .35 + d * c, e.x + l * c, e.y + d * c), a.lineTo(e.x - l * c, e.y - d * c), a.bezierCurveTo(e.x - (e.x - n.x) * .35 - l * c, e.y - (e.y - n.y) * .35 - d * c, n.x + (e.x - n.x) * .35 - l * s, n.y + (e.y - n.y) * .35 - d * s, n.x - l * s, n.y - d * s), a.closePath(), a.fill();
		}
	}
	for (let e of f) {
		let n = t[e.shape.colorIndex % t.length] ?? t[0] ?? "#fff";
		a.globalAlpha = i * .8, a.fillStyle = ea(a, e.x, e.y, e.radius, n, .72), a.beginPath(), a.arc(e.x, e.y, e.radius, 0, Math.PI * 2), a.fill();
	}
	a.globalAlpha = 1;
}
function oa(e, t, n, r) {
	e.context.clearRect(0, 0, e.width, e.height);
	let i = e.phase, a = r.intensity ?? Xi;
	t === "liquid-blobs" ? ta(e, n, r, i, a) : t === "fluid-waves" ? na(e, n, r, i, a) : t === "liquid-gradient" ? ra(e, n, r, i, a) : t === "ink-flow" ? ia(e, n, r, i, a) : aa(e, n, r, i, a), e.context.globalAlpha = 1;
}
function sa(e, t) {
	if (X("speed", e.speed ?? Yi, 0), X("intensity", e.intensity ?? Xi, 0, 1), t === "liquid-blobs") {
		let t = e;
		Qi("count", t.count ?? 5, 1, 32), X("size", t.size ?? 100, Number.MIN_VALUE), X("blur", t.blur ?? 32, 0, 160);
	} else if (t === "fluid-waves") {
		let t = e;
		if (X("amplitude", t.amplitude ?? 36, 0), X("frequency", t.frequency ?? 2.5, Number.MIN_VALUE, 20), Qi("layers", t.layers ?? 4, 1, 8), t.direction !== void 0 && t.direction !== "horizontal" && t.direction !== "vertical") throw TypeError(`direction must be "horizontal" or "vertical", received "${String(t.direction)}"`);
	} else if (t === "liquid-gradient") {
		let t = e;
		Qi("count", t.count ?? 5, 2, Zi), X("scale", t.scale ?? .65, .1, 1.5);
	} else if (t === "ink-flow") {
		let t = e;
		Qi("count", t.count ?? 5, 1, 16), X("size", t.size ?? 80, Number.MIN_VALUE), X("spread", t.spread ?? .3, .05, .75);
	} else {
		let t = e;
		Qi("count", t.count ?? 6, 1, 24), X("radius", t.radius ?? 64, Number.MIN_VALUE), X("threshold", t.threshold ?? 1.8, 1, 4), X("movement", t.movement ?? 1, 0, 2);
	}
}
function ca(e, t) {
	return e === "liquid-blobs" || e === "liquid-gradient" || e === "ink-flow" || e === "metaballs" ? t.count ?? (e === "liquid-gradient" ? 5 : e === "metaballs" ? 6 : 5) : 0;
}
function la(e, t = {}) {
	let n = t.effect ?? "liquid-blobs";
	if (![
		"liquid-blobs",
		"fluid-waves",
		"liquid-gradient",
		"ink-flow",
		"metaballs"
	].includes(n)) throw TypeError(`Unknown fluid background effect "${String(n)}"`);
	sa(t, n);
	let r = t.colors ?? Ji;
	V(r);
	let i = D(e);
	if (i.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("fluidBackground() requires document.createElement");
	let a = t.speed ?? Yi, o = qn(t.palette, r);
	V(o);
	let s = [];
	try {
		for (let e of i) {
			let r = document.createElement("canvas"), i = r.getContext("2d");
			if (!i) throw Error("fluidBackground() requires a canvas with a 2D rendering context");
			r.setAttribute("aria-hidden", "true"), r.style.setProperty("position", "absolute"), r.style.setProperty("inset", "0"), r.style.setProperty("width", "100%"), r.style.setProperty("height", "100%"), r.style.setProperty("display", "block"), r.style.setProperty("z-index", "-1"), r.style.setProperty("pointer-events", "none");
			let a = e.getBoundingClientRect(), o = {
				element: e,
				canvas: r,
				context: i,
				width: 0,
				height: 0,
				phase: 0,
				shapes: $i(ca(n, t))
			};
			H(o, a.width, a.height), s.push(o);
		}
	} catch (e) {
		for (let e of s) e.canvas.parentElement?.removeChild(e.canvas), U(e.canvas);
		throw e;
	}
	let c = !1, l = a > 0, u = (e) => oa(e, n, o, t), d = K({
		speed: a,
		animated: l,
		errorName: "fluidBackground()",
		renderStatic: () => s.forEach(u),
		update: (e, t) => {
			e.phase += t, u(e);
		}
	}), f, p;
	try {
		if (typeof IntersectionObserver == "function") f = new IntersectionObserver((e) => {
			for (let t of e) {
				let e = s.find((e) => e.element === t.target);
				e && d.setVisible(e, t.isIntersecting);
			}
		});
		else for (let e of s) d.setVisible(e, !0);
		typeof ResizeObserver == "function" && (p = new ResizeObserver((e) => {
			if (!c) for (let t of e) {
				let e = s.find((e) => e.element === t.target);
				e && (H(e, t.contentRect.width, t.contentRect.height), u(e));
			}
		}));
	} catch (e) {
		throw d.destroy(), f?.disconnect(), p?.disconnect(), e;
	}
	let m = () => {
		if (!c) for (let e of s) {
			let t = e.element.getBoundingClientRect();
			H(e, t.width, t.height), u(e);
		}
	}, h = !p && typeof window < "u";
	h && window.addEventListener("resize", m);
	let g = [], _ = [];
	try {
		for (let e of s) W(e.element), g.push(e.element), e.element.insertBefore(e.canvas, e.element.firstChild), _.push(e), f?.observe(e.element), p?.observe(e.element), u(e);
	} catch (e) {
		d.destroy(), f?.disconnect(), p?.disconnect(), h && window.removeEventListener("resize", m);
		for (let e of _) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas);
		for (let e of g) G(e);
		throw e;
	}
	let v = B(t.palette, r, (e) => {
		if (!c) {
			o = e, V(o);
			for (let e of s) u(e);
		}
	});
	return { destroy: () => {
		if (!c) {
			c = !0, d.destroy(), v(), f?.disconnect(), p?.disconnect(), h && window.removeEventListener("resize", m);
			for (let e of s) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas), U(e.canvas), G(e.element);
		}
	} };
}
// src/backgrounds/atmospheric-backgrounds.ts
var ua = [
	"#7c3aed",
	"#06b6d4",
	"#ec4899"
], da = 1, fa = .7, pa = 3e3, ma = 1800, ha = 16;
function Z(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function ga(e, t, n, r) {
	if (!Number.isInteger(t) || t < n || t > r) throw RangeError(`${e} must be an integer from ${n} to ${r}, received ${String(t)}`);
}
function _a(e, t, n, r) {
	return Array.from({ length: e }, (e, i) => {
		let a = .15 + i * 37 % 86 / 100;
		return {
			x: (i * .61803398875 + .13) % 1 * t,
			y: (i * .75487766625 + .47) % 1 * n,
			speed: r === "rain" ? .65 + a * .7 : .35 + a * .8,
			size: r === "rain" ? .5 + a * 1.2 : .6 + a * 2.2,
			phase: i * 2.399963229728653,
			depth: a
		};
	});
}
function va(e) {
	return Array.from({ length: e }, (e, t) => ({
		x: (t * .61803398875 + .2) % 1,
		y: (t * .75487766625 + .3) % 1,
		size: .22 + t * 19 % 13 / 50,
		phase: t * 2.399963229728653,
		depth: .3 + t * 29 % 8 / 10,
		colorIndex: t
	}));
}
function ya(e, t, n) {
	return ar(e, {
		colors: t,
		speed: n.speed ?? da,
		blur: n.softness ?? 60,
		opacity: n.intensity ?? fa,
		waveCount: n.waveCount ?? 4
	});
}
function ba(e, t, n) {
	let { context: r, width: i, height: a, clouds: o, phase: s } = e, c = n.softness ?? .85, l = n.direction ?? "right", u = l === "right" ? 1 : -1, d = n.intensity ?? fa;
	r.clearRect(0, 0, i, a);
	for (let e of o) {
		let n = ((s * 9 * u * e.depth + e.phase * 17) % (i + 300) + i + 300) % (i + 300) - 150, o = l === "right" ? n : i - n, f = e.y * a + Math.sin(s * .16 + e.phase) * a * .035, p = Math.max(i, a) * e.size, m = r.createRadialGradient(o, f, p * (1 - c), o, f, p);
		m.addColorStop(0, t[e.colorIndex % t.length] ?? t[0] ?? "#fff"), m.addColorStop(1, "transparent"), r.globalAlpha = d * (.12 + e.depth * .15), r.fillStyle = m, r.fillRect(o - p, f - p, p * 2, p * 2);
	}
	r.globalAlpha = 1;
}
function xa(e, t, n, r) {
	let { context: i, width: a, height: o, particles: s } = e, c = (n.angle ?? 8) * Math.PI / 180, l = n.streakLength ?? 16, u = n.dropSpeed ?? 560, d = n.intensity ?? fa, f = t[0] ?? "#fff";
	i.clearRect(0, 0, a, o), i.strokeStyle = f, i.lineWidth = 1;
	for (let e of s) {
		let t = u * e.speed;
		e.y += t * r, e.x += t * r * Math.sin(c), e.y - l > o && (e.y = -Math.random() * Math.max(o, 1), e.x = Math.random() * a), e.x < -l && (e.x = a + l), e.x > a + l && (e.x = -l), i.globalAlpha = d * (.25 + e.depth * .65), i.lineWidth = .5 + e.depth, i.beginPath(), i.moveTo(e.x, e.y), i.lineTo(e.x - Math.sin(c) * l * e.depth, e.y - Math.cos(c) * l * e.depth), i.stroke();
	}
	if (n.surfaceGlow) {
		let e = i.createLinearGradient(0, o * .72, 0, o);
		e.addColorStop(0, "transparent"), e.addColorStop(1, t[1] ?? f), i.globalAlpha = d * .2, i.fillStyle = e, i.fillRect(0, o * .72, a, o * .28);
	}
	i.globalAlpha = 1;
}
function Sa(e, t, n, r) {
	let { context: i, width: a, height: o, particles: s, phase: c } = e, l = n.fallSpeed ?? 48, u = n.wind ?? 8, d = n.drift ?? 12, f = n.size ?? 3, p = n.intensity ?? fa;
	i.clearRect(0, 0, a, o);
	for (let e of s) e.y += l * e.speed * r, e.x += (u * e.depth + Math.sin(c * .8 + e.phase) * d) * r, e.y > o + f && (e.y = -f, e.x = Math.random() * a), e.x < -f && (e.x = a + f), e.x > a + f && (e.x = -f), i.globalAlpha = p * (.35 + e.depth * .65), i.fillStyle = t[Math.floor(e.depth * t.length) % t.length] ?? t[0] ?? "#fff", i.beginPath(), i.arc(e.x, e.y, f * e.size, 0, Math.PI * 2), i.fill();
	i.globalAlpha = 1;
}
function Ca(e, t, n) {
	let { context: r, width: i, height: a, phase: o } = e, s = n.origin ?? {
		x: .5,
		y: .05
	}, c = n.spread ?? 48, l = n.movement ?? 5, u = n.intensity ?? fa, d = Math.sin(o * .35) * l, f = Math.PI / 2 + d * Math.PI / 180, p = c * Math.PI / 360, m = s.x * i, h = s.y * a, g = Math.hypot(i, a) * 1.25;
	r.clearRect(0, 0, i, a);
	for (let e = 0; e < 7; e++) {
		let n = e / 6 - .5, i = f + n * p * 2, a = m + Math.cos(i) * g, o = h + Math.sin(i) * g, s = r.createLinearGradient(m, h, a, o);
		s.addColorStop(0, t[e % t.length] ?? t[0] ?? "#fff"), s.addColorStop(1, "transparent"), r.globalAlpha = u * (.07 + (1 - Math.abs(n) * 2) * .05), r.fillStyle = s, r.beginPath(), r.moveTo(m, h), r.lineTo(m + Math.cos(i - p / 7) * g, h + Math.sin(i - p / 7) * g), r.lineTo(m + Math.cos(i + p / 7) * g, h + Math.sin(i + p / 7) * g), r.closePath(), r.fill();
	}
	r.globalAlpha = 1;
}
function wa(e, t) {
	if (Z("speed", e.speed ?? da, Number.MIN_VALUE), Z("intensity", e.intensity ?? fa, 0, 1), t === "aurora") {
		let t = e;
		ga("waveCount", t.waveCount ?? 4, 1, 8), Z("softness", t.softness ?? 60, 0);
	} else if (t === "fog") {
		let t = e;
		if (ga("density", t.density ?? 6, 1, ha), Z("softness", t.softness ?? .85, 0, 1), t.direction !== void 0 && t.direction !== "left" && t.direction !== "right") throw TypeError(`direction must be "left" or "right", received "${String(t.direction)}"`);
	} else if (t === "rainfall") {
		let t = e;
		if (Z("density", t.density ?? 18, Number.MIN_VALUE), Z("dropSpeed", t.dropSpeed ?? 560, Number.MIN_VALUE), Z("angle", t.angle ?? 8, -60, 60), Z("streakLength", t.streakLength ?? 16, Number.MIN_VALUE), t.surfaceGlow !== void 0 && typeof t.surfaceGlow != "boolean") throw TypeError(`surfaceGlow must be a boolean, received ${String(t.surfaceGlow)}`);
	} else if (t === "snowfall") {
		let t = e;
		Z("density", t.density ?? 12, Number.MIN_VALUE), Z("size", t.size ?? 3, Number.MIN_VALUE), Z("fallSpeed", t.fallSpeed ?? 48, Number.MIN_VALUE), Z("wind", t.wind ?? 8, -Infinity), Z("drift", t.drift ?? 12, 0);
	} else {
		let t = e, n = t.origin ?? {
			x: .5,
			y: .05
		};
		if (typeof n != "object" || !n) throw TypeError("origin must contain normalized x and y values");
		Z("origin.x", n.x, 0, 1), Z("origin.y", n.y, 0, 1), Z("spread", t.spread ?? 48, 5, 120), Z("movement", t.movement ?? 5, 0, 30);
	}
}
function Ta(e, t, n, r) {
	return Math.min(r, Math.max(1, Math.round(t * n / 1e4 * e)));
}
function Ea(e, t, n, r, i) {
	t === "fog" ? ba(e, n, r) : t === "rainfall" ? xa(e, n, r, i) : t === "snowfall" ? Sa(e, n, r, i) : Ca(e, n, r);
}
function Da(e, t = {}) {
	let n = t.effect ?? "aurora";
	if (![
		"aurora",
		"fog",
		"rainfall",
		"snowfall",
		"sunbeams"
	].includes(n)) throw TypeError(`Unknown atmospheric background effect "${String(n)}"`);
	wa(t, n);
	let r = t.colors ?? ua;
	V(r);
	let i = D(e);
	if (i.length === 0) return { destroy: () => void 0 };
	let a = qn(t.palette, r);
	if (V(a), n === "aurora") {
		let n = t, i = ya(e, a, n), o = !1, s = B(t.palette, r, (t) => {
			if (o) return;
			V(t);
			let r = ya(e, t, n);
			i.destroy(), i = r;
		});
		return { destroy: () => {
			o || (o = !0, s(), i.destroy());
		} };
	}
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("atmosphericBackground() requires document.createElement");
	let o = [];
	try {
		for (let e of i) {
			let r = document.createElement("canvas"), i = r.getContext("2d");
			if (!i) throw Error("atmosphericBackground() requires a canvas with a 2D rendering context");
			r.setAttribute("aria-hidden", "true"), r.style.setProperty("position", "absolute"), r.style.setProperty("inset", "0"), r.style.setProperty("width", "100%"), r.style.setProperty("height", "100%"), r.style.setProperty("display", "block"), r.style.setProperty("z-index", "-1"), r.style.setProperty("pointer-events", "none");
			let a = e.getBoundingClientRect(), s = {
				element: e,
				canvas: r,
				context: i,
				width: 0,
				height: 0,
				phase: 0,
				particles: [],
				clouds: []
			};
			if (H(s, a.width, a.height), n === "fog" && (s.clouds = va(t.density ?? 6)), n === "rainfall" || n === "snowfall") {
				let e = t.density ?? (n === "rainfall" ? 18 : 12), r = n === "rainfall" ? pa : ma;
				s.particles = _a(Ta(e, a.width, a.height, r), a.width, a.height, n === "rainfall" ? "rain" : "snow");
			}
			o.push(s);
		}
	} catch (e) {
		for (let e of o) e.canvas.parentElement?.removeChild(e.canvas), U(e.canvas);
		throw e;
	}
	let s = !1, c = t.speed ?? da, l = (e, r = 0) => {
		Ea(e, n, a, t, r);
	}, u = K({
		speed: c,
		animated: !0,
		errorName: "atmosphericBackground()",
		renderStatic: () => o.forEach((e) => l(e)),
		update: (e, t) => {
			e.phase += t, l(e, t);
		}
	}), d = (e, r, i) => {
		if (H(e, r, i), n === "rainfall" || n === "snowfall") {
			let r = t.density ?? (n === "rainfall" ? 18 : 12), i = n === "rainfall" ? pa : ma;
			e.particles = _a(Ta(r, e.width, e.height, i), e.width, e.height, n === "rainfall" ? "rain" : "snow");
		}
		l(e);
	}, f, p;
	try {
		if (typeof IntersectionObserver == "function") f = new IntersectionObserver((e) => {
			for (let t of e) {
				let e = o.find((e) => e.element === t.target);
				e && u.setVisible(e, t.isIntersecting);
			}
		});
		else for (let e of o) u.setVisible(e, !0);
		typeof ResizeObserver == "function" && (p = new ResizeObserver((e) => {
			if (!s) for (let t of e) {
				let e = o.find((e) => e.element === t.target);
				e && d(e, t.contentRect.width, t.contentRect.height);
			}
		}));
	} catch (e) {
		throw u.destroy(), f?.disconnect(), p?.disconnect(), e;
	}
	let m = () => {
		if (!s) for (let e of o) {
			let t = e.element.getBoundingClientRect();
			d(e, t.width, t.height);
		}
	}, h = !p && typeof window < "u";
	h && window.addEventListener("resize", m);
	let g = [], _ = [];
	try {
		for (let e of o) W(e.element), g.push(e.element), e.element.insertBefore(e.canvas, e.element.firstChild), _.push(e), f?.observe(e.element), p?.observe(e.element), l(e);
	} catch (e) {
		u.destroy(), f?.disconnect(), p?.disconnect(), h && window.removeEventListener("resize", m);
		for (let e of _) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas);
		for (let e of g) G(e);
		throw e;
	}
	let v = B(t.palette, r, (e) => {
		if (!s) {
			a = e, V(a);
			for (let e of o) l(e);
		}
	});
	return { destroy: () => {
		if (!s) {
			s = !0, u.destroy(), v(), f?.disconnect(), p?.disconnect(), h && window.removeEventListener("resize", m);
			for (let e of o) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas), U(e.canvas), G(e.element);
		}
	} };
}
// src/backgrounds/energy-effects.ts
var Oa = [
	"#7c3aed",
	"#06b6d4",
	"#ec4899"
], ka = 1, Aa = .75, ja = 64;
function Q(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function Ma(e, t, n, r) {
	if (!Number.isInteger(t) || t < n || t > r) throw RangeError(`${e} must be an integer from ${n} to ${r}, received ${String(t)}`);
}
function $(e, t) {
	let n = Math.sin((e + 1) * 127.1 + t * 311.7) * 43758.5453123;
	return n - Math.floor(n);
}
function Na(e, t, n) {
	return Array.from({ length: e }, (e, r) => ({
		x: $(r, 1) * t,
		y: $(r, 2) * n
	}));
}
function Pa(e, t, n, r, i, a, o, s) {
	let c = [{
		x: t,
		y: n
	}], l = (r - t) / a, u = (i - n) / a;
	for (let e = 1; e < a; e++) {
		let r = ($(s + e, 7) - .5) * 2 * o;
		c.push({
			x: t + l * e + r,
			y: n + u * e
		});
	}
	return c.push({
		x: r,
		y: i
	}), c;
}
function Fa(e, t, n) {
	let { context: r, width: i, height: a, elapsed: o } = e, s = e.lightningAge;
	if (s < 0 || s > .32) return;
	let c = (n.brightness ?? 1) * (1 - s / .32), l = n.branchCount ?? 4, u = i * (.25 + $(Math.floor(o * 4), 3) * .5), d = a * (.65 + $(Math.floor(o * 4), 4) * .3), f = Pa(r, u, 0, u + ($(Math.floor(o * 4), 5) - .5) * i * .35, d, 12, Math.min(i, a) * .09, Math.floor(o * 4));
	r.globalAlpha = c * (n.intensity ?? Aa), r.strokeStyle = t, r.lineWidth = 2.5, r.shadowColor = t, r.shadowBlur = 18 * c, r.beginPath(), r.moveTo(f[0]?.x ?? 0, f[0]?.y ?? 0);
	for (let e of f.slice(1)) r.lineTo(e.x, e.y);
	r.stroke();
	for (let e = 0; e < l; e++) {
		let t = f[2 + e * 2 % Math.max(1, f.length - 3)];
		if (!t) continue;
		let n = {
			x: t.x + ($(e, Math.floor(o * 4) + 10) - .5) * i * .28,
			y: t.y + a * (.08 + $(e, 11) * .2)
		}, s = Pa(r, t.x, t.y, n.x, n.y, 5, Math.min(i, a) * .035, e);
		r.beginPath(), r.moveTo(s[0]?.x ?? t.x, s[0]?.y ?? t.y);
		for (let e of s.slice(1)) r.lineTo(e.x, e.y);
		r.stroke();
	}
	r.shadowBlur = 0, r.globalAlpha = 1;
}
function Ia(e, t, n) {
	let { context: r, width: i, height: a, elapsed: o } = e, s = n.formationCount ?? 5, c = Math.max(i, a) * (n.scale ?? .55), l = n.intensity ?? Aa;
	r.clearRect(0, 0, i, a);
	for (let e = 0; e < s; e++) {
		let n = (.5 + Math.sin(o * .25 + e * 2.3) * .38) * i, s = (.5 + Math.cos(o * .21 + e * 1.7) * .38) * a, u = r.createRadialGradient(n, s, c * .05, n, s, c), d = t[e % t.length] ?? t[0] ?? "#fff";
		u.addColorStop(0, d), u.addColorStop(.35, d), u.addColorStop(1, "transparent"), r.globalAlpha = l * .38, r.fillStyle = u, r.beginPath(), r.ellipse(n, s, c * (.7 + .1 * Math.sin(o + e)), c * .34, o * .12 + e, 0, Math.PI * 2), r.fill();
	}
	r.globalAlpha = 1;
}
function La(e, t, n) {
	let { context: r, width: i, height: a, elapsed: o } = e, s = n.count ?? 8, c = (n.angle ?? -12) * Math.PI / 180, l = n.movement ?? 8, u = n.glow ?? 18, d = n.width ?? 2, f = n.intensity ?? Aa;
	r.clearRect(0, 0, i, a);
	for (let e = 0; e < s; e++) {
		let n = c + Math.sin(o * .35 + e * 1.7) * (l * Math.PI / 180), p = (e + 1) / (s + 1) * a, m = i * .08, h = p - Math.tan(n) * i * .08, g = i * .92, _ = p + Math.tan(n) * i * .82, v = t[e % t.length] ?? t[0] ?? "#fff";
		r.globalAlpha = f * .28, r.strokeStyle = v, r.lineWidth = d + u * .35, r.shadowColor = v, r.shadowBlur = u, r.beginPath(), r.moveTo(m, h), r.lineTo(g, _), r.stroke(), r.globalAlpha = f, r.lineWidth = d, r.shadowBlur = u * .35, r.stroke();
	}
	r.shadowBlur = 0, r.globalAlpha = 1;
}
function Ra(e, t, n) {
	let { context: r, width: i, height: a, rings: o } = e, s = n.origin ?? {
		x: .5,
		y: .5
	}, c = n.pulseSpeed ?? 220, l = n.width ?? 3, u = n.intensity ?? Aa, d = s.x * i, f = s.y * a, p = Math.hypot(i, a);
	r.clearRect(0, 0, i, a), r.strokeStyle = t, r.shadowColor = t, r.shadowBlur = 14;
	for (let e of o) {
		let t = e.age * c;
		t > p || (r.globalAlpha = u * Math.max(0, 1 - t / p), r.lineWidth = l * Math.max(.4, 1 - t / p * .6), r.beginPath(), r.arc(d, f, t, 0, Math.PI * 2), r.stroke());
	}
	r.shadowBlur = 0, r.globalAlpha = 1;
}
function za(e, t, n) {
	let { context: r, width: i, height: a, particles: o, elapsed: s } = e, c = n.density ?? 8, l = n.flicker ?? .65, u = n.branchCount ?? 2, d = n.intensity ?? Aa, f = n.width ?? 1.5;
	r.clearRect(0, 0, i, a), r.shadowBlur = 8;
	for (let e = 0; e < c; e++) {
		let n = o[e * 2], c = o[e * 2 + 1];
		if (!n || !c) continue;
		let p = 1 - l * (.5 + .5 * Math.sin(s * 18 + e * 2.1)), m = t[e % t.length] ?? t[0] ?? "#fff", h = Pa(r, n.x + Math.sin(s * .4 + e) * 14, n.y + Math.cos(s * .35 + e) * 14, c.x + Math.cos(s * .3 + e) * 14, c.y + Math.sin(s * .45 + e) * 14, 8, Math.min(i, a) * (.018 + l * p * .03), e + Math.floor(s * 8));
		r.globalAlpha = d * p, r.strokeStyle = m, r.lineWidth = f, r.shadowColor = m, r.beginPath(), r.moveTo(h[0]?.x ?? 0, h[0]?.y ?? 0);
		for (let e of h.slice(1)) r.lineTo(e.x, e.y);
		r.stroke();
		for (let t = 0; t < u; t++) {
			let n = h[2 + t * 2];
			if (!n) continue;
			let o = n.x + ($(e, t + Math.floor(s * 8)) - .5) * i * .22, c = n.y + ($(t, e + 29) - .5) * a * .24;
			r.beginPath(), r.moveTo(n.x, n.y), r.lineTo(o, c), r.stroke();
		}
	}
	r.shadowBlur = 0, r.globalAlpha = 1;
}
function Ba(e, t, n, r) {
	let i = n[0] ?? "#fff";
	t === "lightning" ? Fa(e, i, r) : t === "plasma-field" ? Ia(e, n, r) : t === "laser-beams" ? La(e, n, r) : t === "energy-pulse" ? Ra(e, i, r) : za(e, n, r);
}
function Va(e, t) {
	if (Q("speed", e.speed ?? ka, 0), Q("intensity", e.intensity ?? Aa, 0, 1), t === "lightning") {
		let t = e;
		Q("frequency", t.frequency ?? 12, 0), Ma("branchCount", t.branchCount ?? 4, 0, 12), Q("brightness", t.brightness ?? 1, 0, 1);
	} else if (t === "plasma-field") {
		let t = e;
		Ma("formationCount", t.formationCount ?? 5, 2, 10), Q("scale", t.scale ?? .55, .1, 1);
	} else if (t === "laser-beams") {
		let t = e;
		Ma("count", t.count ?? 8, 1, 32), Q("angle", t.angle ?? -12, -80, 80), Q("glow", t.glow ?? 18, 0, 80), Q("width", t.width ?? 2, .25, 12), Q("movement", t.movement ?? 8, 0, 45);
	} else if (t === "energy-pulse") {
		let t = e, n = t.origin ?? {
			x: .5,
			y: .5
		};
		if (typeof n != "object" || !n) throw TypeError("origin must contain normalized x and y values");
		Q("origin.x", n.x, 0, 1), Q("origin.y", n.y, 0, 1), Q("interval", t.interval ?? 1.8, Number.MIN_VALUE), Q("pulseSpeed", t.pulseSpeed ?? 220, Number.MIN_VALUE), Q("width", t.width ?? 3, .25, 16);
	} else {
		let t = e;
		Q("density", t.density ?? 8, Number.MIN_VALUE, ja), Q("flicker", t.flicker ?? .65, 0, 1), Ma("branchCount", t.branchCount ?? 2, 0, 8), Q("width", t.width ?? 1.5, .25, 12);
	}
}
function Ha(e, t, n) {
	return Math.min(128, Math.max(2, Math.round(t * n / 1e4 * e) * 2));
}
function Ua(e, t) {
	if (e === "lightning") {
		let e = t.frequency ?? 12;
		return e === 0 ? Infinity : 60 / e;
	}
	return e === "energy-pulse" ? t.interval ?? 1.8 : Infinity;
}
function Wa(e, t = {}) {
	let n = t.effect ?? "lightning";
	if (![
		"lightning",
		"plasma-field",
		"laser-beams",
		"energy-pulse",
		"electric-arcs"
	].includes(n)) throw TypeError(`Unknown energy background effect "${String(n)}"`);
	Va(t, n);
	let r = t.colors ?? Oa;
	V(r);
	let i = D(e);
	if (i.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("energyBackground() requires document.createElement");
	let a = qn(t.palette, r);
	V(a);
	let o = [];
	try {
		for (let e of i) {
			let r = document.createElement("canvas"), i = r.getContext("2d");
			if (!i) throw Error("energyBackground() requires a canvas with a 2D rendering context");
			r.setAttribute("aria-hidden", "true"), r.style.setProperty("position", "absolute"), r.style.setProperty("inset", "0"), r.style.setProperty("width", "100%"), r.style.setProperty("height", "100%"), r.style.setProperty("display", "block"), r.style.setProperty("z-index", "-1"), r.style.setProperty("pointer-events", "none");
			let a = e.getBoundingClientRect(), s = {
				element: e,
				canvas: r,
				context: i,
				width: 0,
				height: 0,
				elapsed: 0,
				particles: [],
				rings: n === "energy-pulse" ? [{ age: .35 }] : [],
				lightningAge: n === "lightning" && t.frequency !== 0 ? 0 : -1,
				nextLightning: Ua(n, t),
				nextPulse: t.interval ?? 1.8
			};
			H(s, a.width, a.height), n === "electric-arcs" && (s.particles = Na(Ha(t.density ?? 8, a.width, a.height), a.width, a.height)), o.push(s);
		}
	} catch (e) {
		for (let e of o) e.canvas.parentElement?.removeChild(e.canvas), U(e.canvas);
		throw e;
	}
	let s = t.speed ?? ka, c = Ua(n, t), l = (e) => Ba(e, n, a, t), u = K({
		speed: s,
		animated: !0,
		errorName: "energyBackground()",
		renderStatic: () => o.forEach(l),
		update: (e, r) => {
			if (e.elapsed += r, n === "lightning") e.lightningAge += r, e.elapsed >= e.nextLightning && c !== Infinity && (e.lightningAge = 0, e.nextLightning = e.elapsed + c);
			else if (n === "energy-pulse") {
				for (let t of e.rings) t.age += r;
				e.elapsed >= e.nextPulse && (e.rings.push({ age: 0 }), e.nextPulse = e.elapsed + c), e.rings = e.rings.filter((n) => n.age * (t.pulseSpeed ?? 220) <= Math.hypot(e.width, e.height));
			}
			l(e);
		}
	}), d = !1, f, p;
	try {
		if (typeof IntersectionObserver == "function") f = new IntersectionObserver((e) => {
			for (let t of e) {
				let e = o.find((e) => e.element === t.target);
				e && u.setVisible(e, t.isIntersecting);
			}
		});
		else for (let e of o) u.setVisible(e, !0);
		typeof ResizeObserver == "function" && (p = new ResizeObserver((e) => {
			if (!d) for (let r of e) {
				let e = o.find((e) => e.element === r.target);
				e && (H(e, r.contentRect.width, r.contentRect.height), n === "electric-arcs" && (e.particles = Na(Ha(t.density ?? 8, e.width, e.height), e.width, e.height)), e.rings = n === "energy-pulse" ? [{ age: .35 }] : [], l(e));
			}
		}));
	} catch (e) {
		throw u.destroy(), f?.disconnect(), p?.disconnect(), e;
	}
	let m = () => {
		if (!d) for (let e of o) {
			let r = e.element.getBoundingClientRect();
			H(e, r.width, r.height), n === "electric-arcs" && (e.particles = Na(Ha(t.density ?? 8, e.width, e.height), e.width, e.height)), e.rings = n === "energy-pulse" ? [{ age: .35 }] : [], l(e);
		}
	}, h = !p && typeof window < "u";
	h && window.addEventListener("resize", m);
	let g = [], _ = [];
	try {
		for (let e of o) W(e.element), g.push(e.element), e.element.insertBefore(e.canvas, e.element.firstChild), _.push(e), f?.observe(e.element), p?.observe(e.element), l(e);
	} catch (e) {
		u.destroy(), f?.disconnect(), p?.disconnect(), h && window.removeEventListener("resize", m);
		for (let e of _) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas);
		for (let e of g) G(e);
		throw e;
	}
	let v = B(t.palette, r, (e) => {
		if (!d) {
			a = e, V(a);
			for (let e of o) l(e);
		}
	});
	return { destroy: () => {
		if (!d) {
			d = !0, u.destroy(), v(), f?.disconnect(), p?.disconnect(), h && window.removeEventListener("resize", m);
			for (let e of o) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas), U(e.canvas), G(e.element);
		}
	} };
}
// src/backgrounds/noise.ts
var Ga = .15, Ka = 1, qa = 0, Ja = .25;
function Ya(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t < 0 || t > 1) throw RangeError(`${e} must be a finite number between 0 and 1, received ${String(t)}`);
}
function Xa(e) {
	let t = document.createElement("canvas"), n = t.getContext("2d");
	if (!n) throw Error("noiseBackground() requires a canvas with a 2D rendering context");
	return t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("width", "100%"), t.style.setProperty("height", "100%"), t.style.setProperty("display", "block"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none"), {
		element: e,
		canvas: t,
		context: n,
		width: 0,
		height: 0
	};
}
function Za(e, t, n) {
	let { context: r, canvas: i, width: a, height: o } = e;
	if (i.width === 0 || i.height === 0) return;
	let s = r.createImageData(i.width, i.height), c = s.data, l = a > 0 ? i.width / a : 1, u = Math.max(1, Math.round(n * l)), d = Math.round(t * 255);
	for (let e = 0; e < i.height; e += u) for (let t = 0; t < i.width; t += u) {
		let n = Math.random() >= .5 ? 255 : 0, r = Math.round(Math.random() * d), a = Math.min(e + u, i.height), o = Math.min(t + u, i.width);
		for (let s = e; s < a; s++) for (let e = t; e < o; e++) {
			let t = (s * i.width + e) * 4;
			c[t] = n, c[t + 1] = n, c[t + 2] = n, c[t + 3] = r;
		}
	}
	r.putImageData(s, 0, 0);
}
function Qa(e, t = {}) {
	let { intensity: n = Ga, scale: r = Ka, speed: i = qa, opacity: a = Ja } = t;
	if (Ya("intensity", n), Ya("opacity", a), typeof r != "number" || !Number.isFinite(r) || r <= 0) throw RangeError(`scale must be a finite number > 0, received ${String(r)}`);
	if (typeof i != "number" || !Number.isFinite(i) || i < 0) throw RangeError(`speed must be a finite number >= 0, received ${String(i)}`);
	let o = D(e);
	if (o.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("noiseBackground() requires document.createElement, which is not available in this environment");
	let s = b();
	if (i > 0 && (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function")) throw Error("noiseBackground() requires requestAnimationFrame and cancelAnimationFrame when speed is positive");
	let c = o.map(Xa), l = new Map(c.map((e) => [e.element, e])), u = (e, t, i) => {
		H(e, t, i), Za(e, n, r);
	};
	for (let e of c) {
		let t = e.element.getBoundingClientRect();
		u(e, t.width, t.height), e.canvas.style.setProperty("opacity", String(a));
	}
	let d = !1, f = typeof document > "u" || !document.hidden, p = null, m = null, h = i > 0 ? 1e3 / i : Infinity, g = () => {
		p !== null && (cancelAnimationFrame(p), p = null, m = null);
	}, _ = (e) => {
		if (p = null, !(d || s || !f || i === 0)) {
			if (m === null || e - m >= h) {
				for (let e of c) Za(e, n, r);
				m = e;
			}
			p = requestAnimationFrame(_);
		}
	}, v = () => {
		d || s || !f || i === 0 || p !== null || (p = requestAnimationFrame(_));
	}, y = () => {
		f = !document.hidden, f ? (m = null, v()) : g();
	}, x = typeof document < "u" && typeof document.addEventListener == "function" && typeof document.removeEventListener == "function", S;
	typeof ResizeObserver == "function" && (S = new ResizeObserver((e) => {
		if (!d) for (let t of e) {
			let e = l.get(t.target);
			e && u(e, t.contentRect.width, t.contentRect.height);
		}
	}));
	let w = () => {
		if (!d) for (let e of c) {
			let t = e.element.getBoundingClientRect();
			u(e, t.width, t.height);
		}
	}, T = !S && typeof window < "u", E = (e) => {
		if (!d) {
			if (s = e, s) {
				g();
				for (let e of c) Za(e, n, r);
			} else m = null, v();
		}
	}, O = () => void 0, k = [], A = [];
	try {
		for (let e of c) W(e.element), k.push(e.element), e.element.insertBefore(e.canvas, e.element.firstChild), A.push(e), S?.observe(e.element);
		T && window.addEventListener("resize", w), x && document.addEventListener("visibilitychange", y);
	} catch (e) {
		g(), S?.disconnect(), T && window.removeEventListener("resize", w), x && document.removeEventListener("visibilitychange", y);
		for (let e of A) e.element.removeChild(e.canvas), U(e.canvas);
		for (let e of k) G(e);
		throw e;
	}
	return O = C(E), v(), { destroy: () => {
		if (!d) {
			d = !0, g(), O(), S?.disconnect(), T && window.removeEventListener("resize", w), x && document.removeEventListener("visibilitychange", y);
			for (let e of c) e.canvas.parentElement === e.element && e.element.removeChild(e.canvas), U(e.canvas), G(e.element);
		}
	} };
}
// src/backgrounds/wave.ts
var $a = ["#7c3aed", "#06b6d4"], eo = 30, to = 2, no = 8, ro = .6, io = 1e3, ao = 300, oo = 0;
function so(e) {
	if (!Array.isArray(e) || e.length === 0) throw TypeError("colors must be an array containing at least one CSS color");
	for (let t of e) {
		if (typeof t != "string" || t.trim() === "") throw TypeError("each color must be a non-empty CSS color string");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", t)) throw TypeError(`Invalid CSS color "${t}"`);
	}
}
function co(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function lo(e, t) {
	let n = ao / 2, r = Math.max(24, Math.ceil(t * 24)), i = [`M 0 ${n}`];
	for (let a = 0; a <= r; a++) {
		let o = io * a / r, s = n + Math.sin(Math.PI * 2 * t * a / r) * e;
		i.push(`L ${o.toFixed(2)} ${s.toFixed(2)}`);
	}
	return i.push(`L ${io} ${ao}`, `L 0 ${ao}`, "Z"), i.join(" ");
}
function uo(e, t) {
	let n = document.createElement("style"), r = Math.max(1, t);
	n.textContent = `
@keyframes ${e} {
  0%, 100% { transform: translateY(-${r}px); }
  50% { transform: translateY(${r}px); }
}`;
	let i = document.head ?? document.documentElement;
	if (!i) throw Error("waveBackground() requires a document head or document element");
	return i.appendChild(n), n;
}
function fo(e, t = {}) {
	let { colors: n = $a, amplitude: r = eo, frequency: i = to, speed: a = no, opacity: o = ro } = t;
	so(n), co("amplitude", r, 0), co("frequency", i, Number.MIN_VALUE, 100), co("speed", a, 0), co("opacity", o, 0, 1);
	let s = D(e);
	if (s.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElementNS != "function") throw Error("waveBackground() requires document.createElementNS, which is not available in this environment");
	let c = `af-motion-wave-${++oo}`, l = uo(c, r), u = b(), d = [], f = [], p = !1, m = lo(r, i);
	try {
		for (let e = 0; e < s.length; e++) {
			let t = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			t.setAttribute("aria-hidden", "true"), t.setAttribute("viewBox", `0 0 ${io} ${ao}`), t.setAttribute("preserveAspectRatio", "none"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("width", "100%"), t.style.setProperty("height", "100%"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none"), t.style.setProperty("overflow", "hidden"), t.style.setProperty("opacity", String(o)), n.forEach((e, i) => {
				let o = document.createElementNS("http://www.w3.org/2000/svg", "path");
				o.setAttribute("d", m), o.setAttribute("fill", e), o.style.setProperty("transform-box", "fill-box"), o.style.setProperty("transform-origin", "center"), a > 0 && r > 0 && !u && o.style.setProperty("animation", `${c} ${a}s ease-in-out ${-(a * i) / n.length}s infinite`), t.appendChild(o);
			});
			let i = s[e];
			i && (W(i), f.push(i), i.insertBefore(t, i.firstChild), d.push(t));
		}
	} catch (e) {
		for (let e of d) e.parentElement?.removeChild(e);
		for (let e of f) G(e);
		throw l.parentElement?.removeChild(l), e;
	}
	let h = C((e) => {
		if (!p) for (let t of d) for (let i of Array.from(t.children)) if (e || a === 0 || r === 0) i.style.removeProperty("animation");
		else {
			let e = Array.from(t.children).indexOf(i);
			i.style.setProperty("animation", `${c} ${a}s ease-in-out ${-(a * e) / n.length}s infinite`);
		}
	});
	return { destroy: () => {
		if (!p) {
			p = !0, h();
			for (let e = 0; e < d.length; e++) {
				let t = d[e], n = s[e];
				t && n && (t.parentElement === n && n.removeChild(t), G(n));
			}
			l.parentElement?.removeChild(l);
		}
	} };
}
// src/backgrounds/grid.ts
var po = "#7c3aed", mo = 40, ho = 1, go = .25, _o = 0, vo = 0;
function yo(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function bo(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function xo(e, t) {
	let n = document.createElement("style"), r = Math.min(t / 4, 12);
	n.textContent = `
@keyframes ${e} {
  0%, 100% { background-position: 0 0, 0 0; }
  50% { background-position: ${r}px ${r}px, ${-r}px ${-r}px; }
}`;
	let i = document.head ?? document.documentElement;
	if (!i) throw Error("gridBackground() requires a document head or document element");
	return i.appendChild(n), n;
}
function So(e, t = {}) {
	let { color: n = po, cellSize: r = mo, lineWidth: i = ho, opacity: a = go, speed: o = _o } = t;
	if (bo(n), yo("cellSize", r, Number.MIN_VALUE), yo("lineWidth", i, Number.MIN_VALUE), i > r) throw RangeError(`lineWidth must be no larger than cellSize, received ${String(i)}`);
	yo("opacity", a, 0, 1), yo("speed", o, 0);
	let s = D(e);
	if (s.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("gridBackground() requires document.createElement, which is not available in this environment");
	let c = `af-motion-grid-${++vo}`, l = xo(c, r), u = b(), d = [], f = [], p = !1, m = `linear-gradient(to right, ${n} 0, ${n} ${i}px, transparent ${i}px), linear-gradient(to bottom, ${n} 0, ${n} ${i}px, transparent ${i}px)`;
	try {
		for (let e of s) {
			let t = document.createElement("div");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none"), t.style.setProperty("background-image", m), t.style.setProperty("background-size", `${r}px ${r}px`), t.style.setProperty("background-repeat", "repeat"), t.style.setProperty("opacity", String(a)), o > 0 && !u && t.style.setProperty("animation", `${c} ${o}s ease-in-out infinite`), W(e), f.push(e), d.push(t), e.insertBefore(t, e.firstChild);
		}
	} catch (e) {
		for (let e of d) e.parentElement?.removeChild(e);
		for (let e of f) G(e);
		throw l.parentElement?.removeChild(l), e;
	}
	let h = C((e) => {
		if (!p) for (let t of d) e || o === 0 ? t.style.removeProperty("animation") : t.style.setProperty("animation", `${c} ${o}s ease-in-out infinite`);
	});
	return { destroy: () => {
		if (!p) {
			p = !0, h();
			for (let e = 0; e < d.length; e++) {
				let t = d[e], n = s[e];
				t && n && (t.parentElement === n && n.removeChild(t), G(n));
			}
			l.parentElement?.removeChild(l);
		}
	} };
}
// src/backgrounds/spotlight.ts
var Co = "#7c3aed", wo = 300, To = .35, Eo = .15;
function Do(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function Oo(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function ko(e, t, n, r, i) {
	let a = document.createElement("div"), o = document.createElement("div");
	return a.setAttribute("aria-hidden", "true"), a.style.setProperty("position", "absolute"), a.style.setProperty("inset", "0"), a.style.setProperty("z-index", "-1"), a.style.setProperty("overflow", "hidden"), a.style.setProperty("pointer-events", "none"), o.style.setProperty("position", "absolute"), o.style.setProperty("left", "var(--af-motion-spotlight-x, 50%)"), o.style.setProperty("top", "var(--af-motion-spotlight-y, 50%)"), o.style.setProperty("width", `var(--af-motion-spotlight-diameter, ${n * 2}px)`), o.style.setProperty("height", `var(--af-motion-spotlight-diameter, ${n * 2}px)`), o.style.setProperty("transform", "translate(-50%, -50%)"), o.style.setProperty("border-radius", "50%"), o.style.setProperty("background", `radial-gradient(circle, var(--af-motion-spotlight-color, ${t}) 0%, transparent 70%)`), o.style.setProperty("opacity", `var(--af-motion-spotlight-intensity, ${r})`), o.style.setProperty("transition", `left ${i}s ease-out, top ${i}s ease-out`), o.style.setProperty("pointer-events", "none"), o.style.setProperty("--af-motion-spotlight-x", "50%"), o.style.setProperty("--af-motion-spotlight-y", "50%"), o.style.setProperty("--af-motion-spotlight-diameter", `${n * 2}px`), o.style.setProperty("--af-motion-spotlight-color", t), o.style.setProperty("--af-motion-spotlight-intensity", String(r)), a.appendChild(o), {
		element: e,
		layer: a,
		glow: o,
		onPointerMove: (t) => {
			let n = e.getBoundingClientRect();
			if (n.width <= 0 || n.height <= 0) return;
			let r = Math.min(Math.max(t.clientX - n.left, 0), n.width), i = Math.min(Math.max(t.clientY - n.top, 0), n.height);
			o.style.setProperty("--af-motion-spotlight-x", `${r}px`), o.style.setProperty("--af-motion-spotlight-y", `${i}px`);
		},
		onPointerLeave: () => {
			o.style.setProperty("--af-motion-spotlight-x", "50%"), o.style.setProperty("--af-motion-spotlight-y", "50%");
		}
	};
}
function Ao(e, t = {}) {
	let { color: n = Co, radius: r = wo, intensity: i = To, smoothing: a = Eo } = t;
	Do(n), Oo("radius", r, Number.MIN_VALUE), Oo("intensity", i, 0, 1), Oo("smoothing", a, 0, 1);
	let o = D(e);
	if (o.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("spotlightBackground() requires document.createElement, which is not available in this environment");
	let s = b(), c = o.map((e) => ko(e, n, r, i, a)), l = [], u = [], d = !1;
	try {
		for (let e of c) W(e.element), u.push(e.element), e.element.insertBefore(e.layer, e.element.firstChild), l.push(e), s || (e.element.addEventListener("pointermove", e.onPointerMove), e.element.addEventListener("pointerleave", e.onPointerLeave), e.element.addEventListener("pointercancel", e.onPointerLeave));
	} catch (e) {
		for (let e of l) e.element.removeEventListener("pointermove", e.onPointerMove), e.element.removeEventListener("pointerleave", e.onPointerLeave), e.element.removeEventListener("pointercancel", e.onPointerLeave), e.layer.parentElement === e.element && e.element.removeChild(e.layer);
		for (let e of u) G(e);
		throw e;
	}
	let f = C((e) => {
		if (!d) {
			s = e;
			for (let e of c) s ? (e.element.removeEventListener("pointermove", e.onPointerMove), e.element.removeEventListener("pointerleave", e.onPointerLeave), e.element.removeEventListener("pointercancel", e.onPointerLeave), e.onPointerLeave()) : (e.element.addEventListener("pointermove", e.onPointerMove), e.element.addEventListener("pointerleave", e.onPointerLeave), e.element.addEventListener("pointercancel", e.onPointerLeave));
		}
	});
	return { destroy: () => {
		if (!d) {
			d = !0, f();
			for (let e of c) e.element.removeEventListener("pointermove", e.onPointerMove), e.element.removeEventListener("pointerleave", e.onPointerLeave), e.element.removeEventListener("pointercancel", e.onPointerLeave), e.layer.parentElement === e.element && e.element.removeChild(e.layer), G(e.element);
		}
	} };
}
// src/effects/count-up.ts
var jo = 0, Mo = 100, No = 1e3, Po = 0, Fo = "", Io = "", Lo = (e) => e;
function Ro(e, t = {}) {
	let { from: r = jo, to: i = Mo, duration: a = No, decimals: o = Po, prefix: s = Fo, suffix: c = Io, easing: l = Lo } = t;
	if (typeof r != "number" || !Number.isFinite(r)) throw RangeError(`from must be a finite number, received ${String(r)}`);
	if (typeof i != "number" || !Number.isFinite(i)) throw RangeError(`to must be a finite number, received ${String(i)}`);
	if (typeof a != "number" || !Number.isFinite(a) || a < 0) throw RangeError(`duration must be a finite number >= 0, received ${String(a)}`);
	if (!Number.isInteger(o) || o < 0 || o > 20) throw RangeError(`decimals must be an integer between 0 and 20, received ${String(o)}`);
	if (typeof s != "string") throw TypeError("prefix must be a string");
	if (typeof c != "string") throw TypeError("suffix must be a string");
	let u;
	if (typeof l == "string") {
		let e = Object.prototype.hasOwnProperty.call(n, l) ? n[l] : void 0;
		if (!e) throw TypeError(`Unknown easing "${l}"`);
		u = e;
	} else if (typeof l == "function") u = l;
	else throw TypeError("easing must be a registered easing name or a function");
	if (!Number.isFinite(u(0))) throw TypeError("easing must return a finite number");
	let d = D(e);
	if (d.length === 0) return { destroy: () => void 0 };
	let f = d.map((e) => ({
		element: e,
		original: e.textContent ?? ""
	})), p = (e) => `${s}${e.toFixed(o)}${c}`, m = !1, h = null, g = null, _ = () => void 0, v = (e) => {
		let t = p(e);
		for (let e of f) e.element.textContent = t;
	}, y = () => {
		h !== null && (cancelAnimationFrame(h), h = null);
	}, x = () => {
		for (let e of f) e.element.textContent = e.original;
	};
	if (b() || a === 0) return v(i), { destroy: () => {
		m || (m = !0, x());
	} };
	if (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function") throw Error("countUp() requires requestAnimationFrame and cancelAnimationFrame");
	v(r);
	let S = (e) => {
		if (h = null, m) return;
		g === null && (g = e);
		let t = Math.min(Math.max((e - g) / a, 0), 1), n = u(t);
		if (!Number.isFinite(n)) throw y(), m = !0, x(), _(), TypeError("easing must return a finite number");
		v(t === 1 ? i : r + (i - r) * n), t < 1 ? h = requestAnimationFrame(S) : _();
	};
	return _ = C((e) => {
		e && !m && (y(), v(i), _());
	}), h = requestAnimationFrame(S), { destroy: () => {
		m || (m = !0, y(), _(), x());
	} };
}
// src/effects/text-highlight.ts
var zo = "marker", Bo = "#a3e635", Vo = 700, Ho = "immediate";
function Uo(e) {
	return e === "box" ? "100% 100%" : e === "underline" ? "100% 0.12em" : "100% 0.75em";
}
function Wo(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function Go(e, t, n) {
	e.style.setProperty("box-decoration-break", "clone"), e.style.setProperty("-webkit-box-decoration-break", "clone"), e.style.setProperty("background-repeat", "no-repeat"), e.style.setProperty("background-position", t === "box" ? "left center" : "left bottom"), t === "marker" ? (e.style.setProperty("background-image", `linear-gradient(${n}, ${n})`), e.style.setProperty("background-size", "0% 0.75em")) : t === "underline" ? (e.style.setProperty("background-image", `linear-gradient(${n}, ${n})`), e.style.setProperty("background-size", "0% 0.12em")) : (e.style.setProperty("background-image", `linear-gradient(${n}, ${n})`), e.style.setProperty("background-size", "0% 100%"), e.style.setProperty("padding", "0.08em 0.12em"), e.style.setProperty("border-radius", "0.12em"));
}
function Ko(e, t = {}) {
	let { style: n = zo, color: r = Bo, duration: i = Vo, trigger: a = Ho } = t;
	if (n !== "marker" && n !== "underline" && n !== "box") throw TypeError(`style must be "marker", "underline", or "box", received ${String(n)}`);
	if (Wo(r), typeof i != "number" || !Number.isFinite(i) || i < 0) throw RangeError(`duration must be a finite number >= 0, received ${String(i)}`);
	if (a !== "scroll" && a !== "immediate") throw TypeError(`trigger must be "scroll" or "immediate", received ${String(a)}`);
	let o = D(e);
	if (o.length === 0) return { destroy: () => void 0 };
	if (a === "scroll" && typeof IntersectionObserver > "u") throw Error("textHighlight() with trigger 'scroll' requires IntersectionObserver");
	let s = b() || i === 0;
	if (!s && (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function")) throw Error("textHighlight() requires requestAnimationFrame and cancelAnimationFrame when motion is enabled");
	let c = o.map((e) => {
		let t = document.createElement("span");
		return t.setAttribute("data-af-motion-highlight", ""), Go(t, n, r), t.style.setProperty("transition", `background-size ${i}ms ease-out`), {
			element: e,
			wrapper: t,
			originalChildren: Array.from(e.childNodes),
			started: !1,
			frameId: null
		};
	}), l = !1, u, d = new Map(c.map((e) => [e.element, e])), f = (e) => {
		if (e.frameId !== null && (cancelAnimationFrame(e.frameId), e.frameId = null), e.wrapper.parentNode === e.element) {
			for (let t of e.originalChildren) e.element.insertBefore(t, e.wrapper);
			e.element.removeChild(e.wrapper);
		}
	}, p = (e) => {
		l || e.started || (e.started = !0, s ? e.wrapper.style.setProperty("background-size", Uo(n)) : (e.wrapper.getBoundingClientRect(), e.frameId = requestAnimationFrame(() => {
			e.frameId = null, !l && e.wrapper.style.setProperty("background-size", Uo(n));
		})));
	}, m = [];
	try {
		for (let e of c) {
			for (let t of e.originalChildren) e.wrapper.appendChild(t);
			e.element.insertBefore(e.wrapper, e.element.firstChild), m.push(e);
		}
		if (a === "scroll" && !s) {
			u = new IntersectionObserver((e) => {
				if (!l) for (let t of e) {
					if (!t.isIntersecting) continue;
					let e = d.get(t.target);
					e && (p(e), u?.unobserve(e.element));
				}
			});
			for (let e of c) u.observe(e.element);
		} else for (let e of c) p(e);
	} catch (e) {
		u?.disconnect();
		for (let e of m) f(e);
		throw e;
	}
	let h = () => void 0;
	return h = C((e) => {
		if (e && !l) {
			for (let e of c) e.frameId !== null && (cancelAnimationFrame(e.frameId), e.frameId = null), e.started = !0, e.wrapper.style.setProperty("background-size", Uo(n));
			u?.disconnect(), h();
		}
	}), { destroy: () => {
		if (!l) {
			l = !0, u?.disconnect(), h();
			for (let e of c) f(e);
		}
	} };
}
// src/effects/split-text.ts
var qo = "words", Jo = "af-split";
function Yo(e, t) {
	if (t === "words") return e.match(/\s+|\S+/gu) ?? [];
	if (t !== "characters") return [e];
	let n = Reflect.get(Intl, "Segmenter");
	if (typeof n == "function") {
		let t = n;
		return Array.from(new t(void 0, { granularity: "grapheme" }).segment(e), (e) => e.segment);
	}
	return Array.from(e);
}
function Xo(e) {
	return /^\s+$/u.test(e);
}
function Zo(e) {
	let t = [], n = [], r = (e) => {
		if (e.nodeType === Node.TEXT_NODE) {
			n.push({
				node: e,
				data: e.textContent ?? ""
			});
			return;
		}
		if (e.nodeType !== Node.ELEMENT_NODE && e.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
		let i = e.nodeType === Node.ELEMENT_NODE ? e.tagName.toLowerCase() : "";
		if (i === "script" || i === "style") return;
		let a = Array.from(e.childNodes);
		t.push({
			parent: e,
			children: a
		});
		for (let e of a) r(e);
	};
	return r(e), {
		parents: t,
		texts: n
	};
}
function Qo(e, t, n) {
	let r = 0, i = [...e.texts];
	for (let { node: a, data: o } of i) {
		let i = a.parentNode;
		if (!i || o.length === 0) continue;
		let s = document.createDocumentFragment(), c = Yo(o, t === "lines" ? "words" : t);
		for (let i of c) {
			if (Xo(i)) {
				s.appendChild(document.createTextNode(i));
				continue;
			}
			let a = document.createElement("span");
			a.className = `${n} ${n}--${t}`;
			let o = t === "characters" ? "data-af-character" : t === "words" ? "data-af-word" : "data-af-line";
			a.setAttribute(o, String(r++)), a.appendChild(document.createTextNode(i)), e.units.push(a), s.appendChild(a);
		}
		i.insertBefore(s, a), i.removeChild(a);
	}
}
function $o(e) {
	let t = [];
	for (let n of e.units) {
		let e = n.getBoundingClientRect().top, r = t.findIndex((t) => Math.abs(t - e) < 1);
		r === -1 && (r = t.length, t.push(e)), n.setAttribute("data-af-line", String(r));
	}
}
function es(e) {
	for (let { parent: t, children: n } of e.parents) {
		for (; t.firstChild;) t.removeChild(t.firstChild);
		for (let e of n) t.appendChild(e);
	}
	for (let { node: t, data: n } of e.texts) t.data = n;
}
function ts(e, t = {}) {
	let { by: n = qo, className: r = Jo } = t;
	if (n !== "characters" && n !== "words" && n !== "lines") throw TypeError(`by must be "characters", "words", or "lines", received ${String(n)}`);
	if (typeof r != "string" || r.trim() === "") throw TypeError("className must be a non-empty string");
	let i = D(e);
	if (i.length === 0) return { destroy: () => void 0 };
	let a = i.map((e) => {
		let t = Zo(e);
		return {
			element: e,
			parents: t.parents,
			texts: t.texts,
			units: []
		};
	}), o = !1, s, c = () => {
		if (!(o || n !== "lines")) for (let e of a) $o(e);
	}, l = n === "lines" && typeof window < "u";
	try {
		for (let e of a) Qo(e, n, r);
		if (n === "lines") {
			for (let e of a) $o(e);
			if (typeof ResizeObserver == "function") {
				s = new ResizeObserver(() => c());
				for (let e of i) s.observe(e);
			} else l && window.addEventListener("resize", c);
		}
	} catch (e) {
		s?.disconnect(), l && typeof ResizeObserver != "function" && window.removeEventListener("resize", c);
		for (let e of a) es(e);
		throw e;
	}
	return { destroy: () => {
		if (!o) {
			o = !0, s?.disconnect(), l && !s && window.removeEventListener("resize", c);
			for (let e of a) es(e);
		}
	} };
}
// src/effects/text-reveal.ts
var ns = "words", rs = 600, is = 50, as = "up", os = "immediate", ss = 0;
function cs(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t < 0) throw RangeError(`${e} must be a finite number >= 0, received ${String(t)}`);
}
function ls(e) {
	if (typeof e == "string") {
		let t = e.trim();
		if (t === "") throw TypeError("easing must be a non-empty CSS timing function or function");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("transition-timing-function", t)) throw TypeError(`Invalid CSS timing function "${t}"`);
		return t;
	}
	if (typeof e != "function") throw TypeError("easing must be a CSS timing function or function");
	return `linear(${Array.from({ length: 21 }, (t, n) => {
		let r = n / 20, i = e(r);
		if (typeof i != "number" || !Number.isFinite(i)) throw TypeError(`easing must return finite numbers, received ${String(i)} at ${r}`);
		return `${i} ${r * 100}%`;
	}).join(", ")})`;
}
function us(e) {
	switch (e) {
		case "up": return "translateY(1em)";
		case "down": return "translateY(-1em)";
		case "left": return "translateX(1em)";
		case "right": return "translateX(-1em)";
		case "none": return "none";
	}
}
function ds(e, t) {
	let n = [], r = (e) => {
		for (let i of Array.from(e.childNodes)) i instanceof HTMLElement && i.classList.contains(t) && n.push(i), r(i);
	};
	return r(e), n;
}
function fs(e, t, n, r) {
	e.units.forEach((e, i) => {
		e.style.setProperty("transition", `opacity ${t}ms ${r} ${i * n}ms, transform ${t}ms ${r} ${i * n}ms`);
	}), e.element.getBoundingClientRect();
	for (let t of e.units) t.style.setProperty("opacity", "1"), t.style.setProperty("transform", "none");
}
function ps(e, t = {}) {
	let { by: n = ns, duration: r = rs, stagger: i = is, easing: a = "ease", direction: o = as, trigger: s = os } = t;
	if (n !== "characters" && n !== "words") throw TypeError(`by must be "characters" or "words", received ${String(n)}`);
	if (cs("duration", r), cs("stagger", i), o !== "up" && o !== "down" && o !== "left" && o !== "right" && o !== "none") throw TypeError(`direction must be "up", "down", "left", "right", or "none", received ${String(o)}`);
	if (s !== "scroll" && s !== "immediate") throw TypeError(`trigger must be "scroll" or "immediate", received ${String(s)}`);
	let c = ls(a), l = D(e);
	if (l.length === 0) return { destroy: () => void 0 };
	let u = b();
	if (!u && (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function")) throw Error("textReveal() requires requestAnimationFrame and cancelAnimationFrame when motion is enabled");
	if (!u && s === "scroll" && typeof IntersectionObserver > "u") throw Error("textReveal() with trigger 'scroll' requires IntersectionObserver");
	let d = `af-text-reveal-${ss++}`, f = ts(e, {
		by: n,
		className: d
	}), p = [];
	try {
		for (let e of l) p.push({
			element: e,
			units: ds(e, d),
			started: !1
		});
	} catch (e) {
		throw f.destroy(), e;
	}
	let m = us(o), h = !1, g, _ = /* @__PURE__ */ new Set(), v = new Map(p.map((e) => [e.element, e])), y = (e) => {
		if (h || e.started) return;
		if (e.started = !0, u) {
			for (let t of e.units) t.style.setProperty("opacity", "1"), t.style.setProperty("transform", "none");
			return;
		}
		e.element.getBoundingClientRect();
		for (let t of e.units) t.style.setProperty("transition", `opacity ${r}ms ${c}, transform ${r}ms ${c}`);
		let t = requestAnimationFrame(() => {
			_.delete(t), !h && fs(e, r, i, c);
		});
		_.add(t);
	}, x = () => void 0, S = () => {
		for (let e of _) cancelAnimationFrame(e);
		_.clear(), g?.disconnect();
		for (let e of p) {
			e.started = !0;
			for (let t of e.units) t.style.setProperty("transition", "none"), t.style.setProperty("opacity", "1"), t.style.setProperty("transform", "none");
		}
		x();
	};
	try {
		for (let e of p) for (let [t, n] of e.units.entries()) n.style.setProperty("display", "inline-block"), n.style.setProperty("opacity", u ? "1" : "0"), n.style.setProperty("transform", u ? "none" : m), n.style.setProperty("transition", "none"), n.style.setProperty("will-change", u ? "auto" : "opacity, transform"), n.style.setProperty("transition-delay", `${t * i}ms`);
		if (u) for (let e of p) y(e);
		else if (s === "scroll") {
			g = new IntersectionObserver((e) => {
				if (!h) for (let t of e) {
					if (!t.isIntersecting) continue;
					let e = v.get(t.target);
					e && (y(e), g?.unobserve(e.element));
				}
			});
			for (let e of p) g.observe(e.element);
		} else for (let e of p) y(e);
	} catch (e) {
		g?.disconnect();
		for (let e of _) cancelAnimationFrame(e);
		throw f.destroy(), e;
	}
	return u || (x = C((e) => {
		e && !h && S();
	})), { destroy: () => {
		if (!h) {
			h = !0, g?.disconnect(), x();
			for (let e of _) cancelAnimationFrame(e);
			_.clear(), f.destroy();
		}
	} };
}
// src/effects/text-mask.ts
var ms = 900, hs = "up", gs = "immediate", _s = "currentColor";
function vs(e) {
	if (typeof e != "number" || !Number.isFinite(e) || e < 0) throw RangeError(`duration must be a finite number >= 0, received ${String(e)}`);
}
function ys(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function bs(e) {
	if (typeof e == "string") {
		let t = e.trim();
		if (t === "") throw TypeError("easing must be a non-empty CSS timing function or function");
		if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("transition-timing-function", t)) throw TypeError(`Invalid CSS timing function "${t}"`);
		return t;
	}
	if (typeof e != "function") throw TypeError("easing must be a CSS timing function or function");
	return `linear(${Array.from({ length: 21 }, (t, n) => {
		let r = n / 20, i = e(r);
		if (typeof i != "number" || !Number.isFinite(i)) throw TypeError(`easing must return finite numbers, received ${String(i)} at ${r}`);
		return `${i} ${r * 100}%`;
	}).join(", ")})`;
}
function xs(e) {
	switch (e) {
		case "up": return "inset(100% 0 0 0)";
		case "down": return "inset(0 0 100% 0)";
		case "left": return "inset(0 0 0 100%)";
		case "right": return "inset(0 100% 0 0)";
	}
}
function Ss(e) {
	let t = e.wrapper.parentNode;
	if (t) {
		for (let n of e.originalChildren) t.insertBefore(n, e.wrapper);
		t.removeChild(e.wrapper);
	} else {
		for (; e.element.firstChild;) e.element.removeChild(e.element.firstChild);
		for (let t of e.originalChildren) e.element.appendChild(t);
	}
}
function Cs(e, t = {}) {
	let { duration: n = ms, easing: r = "ease", direction: i = hs, color: a = _s, trigger: o = gs } = t;
	vs(n), ys(a);
	let s = bs(r);
	if (i !== "up" && i !== "down" && i !== "left" && i !== "right") throw TypeError(`direction must be "up", "down", "left", or "right", received ${String(i)}`);
	if (o !== "scroll" && o !== "immediate") throw TypeError(`trigger must be "scroll" or "immediate", received ${String(o)}`);
	let c = D(e);
	if (c.length === 0) return { destroy: () => void 0 };
	let l = b() || n === 0;
	if (!l && (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function")) throw Error("textMask() requires requestAnimationFrame and cancelAnimationFrame when motion is enabled");
	if (!l && o === "scroll" && typeof IntersectionObserver > "u") throw Error("textMask() with trigger 'scroll' requires IntersectionObserver");
	let u = c.map((e) => {
		let t = document.createElement("span");
		return t.setAttribute("data-af-motion-mask", ""), t.style.setProperty("display", "inline-block"), t.style.setProperty("max-width", "100%"), t.style.setProperty("vertical-align", "bottom"), t.style.setProperty("color", a), t.style.setProperty("clip-path", l ? "inset(0)" : xs(i)), t.style.setProperty("transition", "none"), t.style.setProperty("will-change", l ? "auto" : "clip-path"), {
			element: e,
			wrapper: t,
			originalChildren: Array.from(e.childNodes),
			started: !1,
			frameId: null
		};
	}), d = new Map(u.map((e) => [e.element, e])), f = !1, p, m = () => void 0, h = (e) => {
		f || e.started || (e.started = !0, l ? e.wrapper.style.setProperty("clip-path", "inset(0)") : (e.wrapper.getBoundingClientRect(), e.wrapper.style.setProperty("transition", `clip-path ${n}ms ${s}`), e.frameId = requestAnimationFrame(() => {
			e.frameId = null, !f && e.wrapper.style.setProperty("clip-path", "inset(0)");
		})));
	}, g = () => {
		p?.disconnect();
		for (let e of u) e.frameId !== null && (cancelAnimationFrame(e.frameId), e.frameId = null), e.started = !0, e.wrapper.style.setProperty("transition", "none"), e.wrapper.style.setProperty("clip-path", "inset(0)");
		m();
	}, _ = [];
	try {
		for (let e of u) {
			_.push(e);
			for (let t of e.originalChildren) e.wrapper.appendChild(t);
			e.element.insertBefore(e.wrapper, e.element.firstChild);
		}
		if (!l && o === "scroll") {
			p = new IntersectionObserver((e) => {
				if (!f) for (let t of e) {
					if (!t.isIntersecting) continue;
					let e = d.get(t.target);
					e && (h(e), p?.unobserve(e.element));
				}
			});
			for (let e of u) p.observe(e.element);
		} else for (let e of u) h(e);
	} catch (e) {
		p?.disconnect();
		for (let e of u) e.frameId !== null && cancelAnimationFrame(e.frameId);
		for (let e of _) Ss(e);
		throw e;
	}
	return l || (m = C((e) => {
		e && !f && g();
	})), { destroy: () => {
		if (!f) {
			f = !0, p?.disconnect(), m();
			for (let e of u) e.frameId !== null && (cancelAnimationFrame(e.frameId), e.frameId = null), Ss(e);
		}
	} };
}
// src/effects/glow.ts
var ws = "#8b5cf6", Ts = .7, Es = 24, Ds = "static", Os = 2e3, ks = "immediate";
function As(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function js(e, t) {
	return e === "" || e === "none" ? t : `${e}, ${t}`;
}
function Ms(e, t, n) {
	let r = n * t * .35, i = `color-mix(in srgb, ${e} ${t * 100}%, transparent)`;
	return `0 0 ${n * t}px ${r}px ${i}`;
}
function Ns(e, t) {
	e.element.style.setProperty("box-shadow", js(e.originalShadow, t));
}
function Ps(e, t = {}) {
	let { color: n = ws, intensity: r = Ts, blur: i = Es, mode: a = Ds, duration: o = Os, trigger: s = ks } = t;
	if (As(n), typeof r != "number" || !Number.isFinite(r) || r < 0 || r > 1) throw RangeError(`intensity must be a finite number between 0 and 1, received ${String(r)}`);
	if (typeof i != "number" || !Number.isFinite(i) || i < 0) throw RangeError(`blur must be a finite number >= 0, received ${String(i)}`);
	if (typeof o != "number" || !Number.isFinite(o) || o <= 0) throw RangeError(`duration must be a finite number > 0, received ${String(o)}`);
	if (a !== "static" && a !== "pulse" && a !== "hover") throw TypeError(`mode must be "static", "pulse", or "hover", received ${String(a)}`);
	if (s !== "immediate" && s !== "hover") throw TypeError(`trigger must be "immediate" or "hover", received ${String(s)}`);
	let c = D(e);
	if (c.length === 0) return { destroy: () => void 0 };
	let l = b(), u = s === "hover" || a === "hover", d = a === "pulse";
	if (!l && d && !c.every((e) => typeof e.animate == "function")) throw Error("glow() pulse mode requires the Web Animations API when motion is enabled");
	let f = Ms(n, r, i), p = Ms(n, r, i * 1.5), m = c.map((e) => ({
		element: e,
		originalShadow: e.style.getPropertyValue("box-shadow"),
		originalShadowPriority: e.style.getPropertyPriority("box-shadow"),
		originalTransition: e.style.getPropertyValue("transition"),
		originalTransitionPriority: e.style.getPropertyPriority("transition"),
		animation: null,
		hovered: !1,
		onPointerEnter: () => void 0,
		onPointerLeave: () => void 0
	})), h = !1, g = l, _ = (e) => {
		e.animation?.cancel(), e.animation = null;
	}, v = (e) => {
		_(e), u && !e.hovered ? e.element.style.setProperty("box-shadow", e.originalShadow, e.originalShadowPriority) : (Ns(e, f), d && !g && (e.animation = e.element.animate([
			{ boxShadow: js(e.originalShadow, f) },
			{ boxShadow: js(e.originalShadow, p) },
			{ boxShadow: js(e.originalShadow, f) }
		], {
			duration: o,
			iterations: Infinity,
			easing: "ease-in-out"
		})));
	}, y = (e) => {
		_(e), e.element.removeEventListener("pointerenter", e.onPointerEnter), e.element.removeEventListener("pointerleave", e.onPointerLeave), e.originalShadow === "" ? e.element.style.removeProperty("box-shadow") : e.element.style.setProperty("box-shadow", e.originalShadow, e.originalShadowPriority), e.originalTransition === "" ? e.element.style.removeProperty("transition") : e.element.style.setProperty("transition", e.originalTransition, e.originalTransitionPriority);
	};
	try {
		for (let e of m) u && (e.element.style.setProperty("transition", e.originalTransition === "" ? "box-shadow 180ms ease" : `${e.originalTransition}, box-shadow 180ms ease`), e.onPointerEnter = (t) => {
			h || t.pointerType !== "" && t.pointerType !== "mouse" && t.pointerType !== "pen" || (e.hovered = !0, v(e));
		}, e.onPointerLeave = () => {
			h || (e.hovered = !1, v(e));
		}, e.element.addEventListener("pointerenter", e.onPointerEnter), e.element.addEventListener("pointerleave", e.onPointerLeave)), v(e);
	} catch (e) {
		for (let e of m) y(e);
		throw e;
	}
	let x = C((e) => {
		if (!(h || e === g)) {
			g = e;
			for (let t of m) e ? (_(t), (!u || t.hovered) && Ns(t, f)) : v(t);
		}
	});
	return { destroy: () => {
		if (!h) {
			h = !0, x();
			for (let e of m) y(e);
		}
	} };
}
// src/effects/border-beam.ts
var Fs = "#8b5cf6", Is = 120, Ls = 3e3, Rs = 1, zs = 16, Bs = /* @__PURE__ */ new WeakMap();
function Vs(e, t) {
	return {
		value: e.style.getPropertyValue(t),
		priority: e.style.getPropertyPriority(t)
	};
}
function Hs(e, t, n) {
	n.value === "" ? e.style.removeProperty(t) : e.style.setProperty(t, n.value, n.priority);
}
function Us(e) {
	let t = Bs.get(e);
	if (t) {
		t.count++;
		return;
	}
	let n = Vs(e, "position"), r = Vs(e, "isolation"), i = typeof getComputedStyle == "function" ? getComputedStyle(e) : void 0, a = (i?.position ?? (n.value || "static")) === "static", o = (i?.isolation ?? r.value) !== "isolate";
	a && e.style.setProperty("position", "relative"), o && e.style.setProperty("isolation", "isolate"), Bs.set(e, {
		count: 1,
		position: n,
		isolation: r,
		restorePosition: a,
		restoreIsolation: o
	});
}
function Ws(e) {
	let t = Bs.get(e);
	t && (t.count--, !(t.count > 0) && (Bs.delete(e), t.restorePosition && Hs(e, "position", t.position), t.restoreIsolation && Hs(e, "isolation", t.isolation)));
}
function Gs(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function Ks(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function qs(e, t) {
	return `conic-gradient(from 0deg, transparent 0deg ${360 - t}deg, ${e} ${360 - t * .35}deg, transparent 360deg)`;
}
function Js(e, t) {
	e.style.setProperty("background-image", `linear-gradient(${t}, ${t})`), e.style.setProperty("opacity", "0.2"), e.style.removeProperty("transform");
}
function Ys(e, t) {
	e.animation ||= e.layer.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
		duration: t,
		iterations: Infinity,
		easing: "linear"
	});
}
function Xs(e) {
	e.animation?.cancel(), e.animation = null;
}
function Zs(e, t = {}) {
	let { color: n = Fs, size: r = Is, duration: i = Ls, borderWidth: a = Rs, radius: o = zs, paused: s = !1 } = t;
	if (Ks(n), Gs("size", r, Number.MIN_VALUE, 360), Gs("duration", i, Number.MIN_VALUE), Gs("borderWidth", a, Number.MIN_VALUE), Gs("radius", o, 0), typeof s != "boolean") throw TypeError("paused must be a boolean");
	let c = D(e);
	if (c.length === 0) return {
		pause: () => void 0,
		resume: () => void 0,
		destroy: () => void 0
	};
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("borderBeam() requires document.createElement, which is not available in this environment");
	let l = b();
	if (!l && !s && c.some((e) => typeof e.animate != "function")) throw Error("borderBeam() requires the Web Animations API when motion is enabled");
	let u = qs(n, r), d = [], f = [], p = !1, m = s;
	try {
		for (let e of c) {
			let t = document.createElement("div");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "0"), t.style.setProperty("z-index", "-1"), t.style.setProperty("pointer-events", "none"), t.style.setProperty("box-sizing", "border-box"), t.style.setProperty("border-radius", `${o}px`), t.style.setProperty("padding", `${a}px`), t.style.setProperty("background-image", u), t.style.setProperty("opacity", "1"), t.style.setProperty("mask", "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)"), t.style.setProperty("mask-composite", "exclude"), t.style.setProperty("-webkit-mask", "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)"), t.style.setProperty("-webkit-mask-composite", "xor"), Us(e), f.push(e), d.push({
				element: e,
				layer: t,
				animation: null
			}), e.insertBefore(t, e.firstChild);
		}
		if (l) for (let e of d) Js(e.layer, n);
		else if (!m) for (let e of d) Ys(e, i);
	} catch (e) {
		for (let e of d) Xs(e), e.layer.parentElement === e.element && e.element.removeChild(e.layer);
		for (let e of f) Ws(e);
		throw e;
	}
	let h = C((e) => {
		if (!p) {
			if (e) for (let e of d) Xs(e), Js(e.layer, n);
			else if (!m) for (let e of d) e.layer.style.setProperty("background-image", u), e.layer.style.setProperty("opacity", "1"), Ys(e, i);
		}
	});
	return {
		pause: () => {
			if (!(p || m)) {
				m = !0;
				for (let e of d) e.animation && e.animation.pause();
			}
		},
		resume: () => {
			if (!p && m && (m = !1, !b())) for (let e of d) e.animation ? e.animation.play() : (e.layer.style.setProperty("background-image", u), e.layer.style.setProperty("opacity", "1"), Ys(e, i));
		},
		destroy: () => {
			if (!p) {
				p = !0, h();
				for (let e of d) Xs(e), e.layer.parentElement === e.element && e.element.removeChild(e.layer), Ws(e.element);
			}
		}
	};
}
// src/effects/shine.ts
var Qs = "rgba(255, 255, 255, 0.5)", $s = 120, ec = 1200, tc = .7, nc = "hover", rc = /* @__PURE__ */ new WeakMap();
function ic(e, t) {
	return {
		value: e.style.getPropertyValue(t),
		priority: e.style.getPropertyPriority(t)
	};
}
function ac(e, t, n) {
	n.value === "" ? e.style.removeProperty(t) : e.style.setProperty(t, n.value, n.priority);
}
function oc(e) {
	let t = rc.get(e);
	if (t) {
		t.count++;
		return;
	}
	let n = ic(e, "position"), r = ic(e, "isolation"), i = typeof getComputedStyle == "function" ? getComputedStyle(e) : void 0, a = (i?.position ?? (n.value || "static")) === "static", o = (i?.isolation ?? r.value) !== "isolate";
	a && e.style.setProperty("position", "relative"), o && e.style.setProperty("isolation", "isolate"), rc.set(e, {
		count: 1,
		position: n,
		isolation: r,
		restorePosition: a,
		restoreIsolation: o
	});
}
function sc(e) {
	let t = rc.get(e);
	t && (t.count--, !(t.count > 0) && (rc.delete(e), t.restorePosition && ac(e, "position", t.position), t.restoreIsolation && ac(e, "isolation", t.isolation)));
}
function cc(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function lc(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function uc(e) {
	e.animation?.cancel(), e.animation = null, e.overlay.style.setProperty("background-position", "150% 0");
}
function dc(e, t) {
	uc(e), e.animation = e.overlay.animate([{ backgroundPosition: "150% 0" }, { backgroundPosition: "-150% 0" }], {
		duration: t,
		iterations: 1,
		easing: "ease-out",
		fill: "none"
	}), e.animation.onfinish = () => {
		e.animation = null, e.overlay.style.setProperty("background-position", "150% 0"), e.overlay.style.setProperty("opacity", "0");
	};
}
function fc(e, t) {
	uc(e), e.overlay.style.setProperty("opacity", String(Math.min(t, .2))), e.overlay.style.setProperty("background-position", "50% 0");
}
function pc(e, t = {}) {
	let { color: n = Qs, angle: r = $s, duration: i = ec, intensity: a = tc, trigger: o = nc } = t;
	if (cc(n), lc("angle", r, -Infinity), lc("duration", i, Number.MIN_VALUE), lc("intensity", a, 0, 1), o !== "hover" && o !== "continuous" && o !== "click") throw TypeError(`trigger must be "hover", "continuous", or "click", received ${String(o)}`);
	let s = D(e);
	if (s.length === 0) return { destroy: () => void 0 };
	let c = b();
	if (!c && s.some((e) => typeof e.animate != "function")) throw Error("shine() requires the Web Animations API when motion is enabled");
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("shine() requires document.createElement, which is not available in this environment");
	let l = `linear-gradient(${r}deg, transparent 38%, ${n} 50%, transparent 62%)`, u = [], d = [], f = !1, p = c, m = (e) => {
		p ? fc(e, a) : o === "continuous" ? (e.overlay.style.setProperty("opacity", String(a)), e.animation = e.overlay.animate([{ backgroundPosition: "150% 0" }, { backgroundPosition: "-150% 0" }], {
			duration: i,
			iterations: Infinity,
			easing: "linear"
		})) : e.overlay.style.setProperty("opacity", "0");
	};
	try {
		for (let e of s) {
			let t = document.createElement("div");
			t.setAttribute("aria-hidden", "true"), t.style.setProperty("position", "absolute"), t.style.setProperty("inset", "-1px"), t.style.setProperty("z-index", "1"), t.style.setProperty("pointer-events", "none"), t.style.setProperty("overflow", "hidden"), t.style.setProperty("border-radius", "inherit"), t.style.setProperty("background-image", l), t.style.setProperty("background-size", "250% 100%"), t.style.setProperty("background-position", "150% 0"), t.style.setProperty("opacity", "0");
			let n = {
				target: e,
				overlay: t,
				animation: null,
				onPointerEnter: () => void 0,
				onPointerLeave: () => void 0,
				onClick: () => void 0
			};
			o === "hover" ? (n.onPointerEnter = (e) => {
				f || p || e.pointerType !== "" && e.pointerType !== "mouse" && e.pointerType !== "pen" || (t.style.setProperty("opacity", String(a)), dc(n, i));
			}, n.onPointerLeave = () => {
				f || p || (uc(n), t.style.setProperty("opacity", "0"));
			}) : o === "click" && (n.onClick = () => {
				f || p || (t.style.setProperty("opacity", String(a)), dc(n, i));
			}), oc(e), d.push(e), u.push(n), e.insertBefore(t, e.firstChild), o === "hover" ? (e.addEventListener("pointerenter", n.onPointerEnter), e.addEventListener("pointerleave", n.onPointerLeave)) : o === "click" && e.addEventListener("click", n.onClick), m(n);
		}
	} catch (e) {
		for (let e of u) uc(e), e.target.removeEventListener("pointerenter", e.onPointerEnter), e.target.removeEventListener("pointerleave", e.onPointerLeave), e.target.removeEventListener("click", e.onClick), e.overlay.parentElement === e.target && e.target.removeChild(e.overlay);
		for (let e of d) sc(e);
		throw e;
	}
	let h = C((e) => {
		if (!(f || e === p)) {
			p = e;
			for (let t of u) e ? fc(t, a) : (uc(t), t.overlay.style.setProperty("opacity", o === "continuous" ? String(a) : "0"), o === "continuous" && (t.animation = t.overlay.animate([{ backgroundPosition: "150% 0" }, { backgroundPosition: "-150% 0" }], {
				duration: i,
				iterations: Infinity,
				easing: "linear"
			})));
		}
	});
	return { destroy: () => {
		if (!f) {
			f = !0, h();
			for (let e of u) uc(e), e.target.removeEventListener("pointerenter", e.onPointerEnter), e.target.removeEventListener("pointerleave", e.onPointerLeave), e.target.removeEventListener("click", e.onClick), e.overlay.parentElement === e.target && e.target.removeChild(e.overlay), sc(e.target);
		}
	} };
}
// src/effects/ripple.ts
var mc = "rgba(255, 255, 255, 0.35)", hc = 600, gc = 2, _c = "pointer", vc = /* @__PURE__ */ new WeakMap();
function yc(e, t) {
	return {
		value: e.style.getPropertyValue(t),
		priority: e.style.getPropertyPriority(t)
	};
}
function bc(e, t, n) {
	n.value === "" ? e.style.removeProperty(t) : e.style.setProperty(t, n.value, n.priority);
}
function xc(e) {
	let t = vc.get(e);
	if (t) {
		t.count++;
		return;
	}
	let n = yc(e, "position"), r = yc(e, "isolation"), i = typeof getComputedStyle == "function" ? getComputedStyle(e) : void 0, a = (i?.position ?? (n.value || "static")) === "static", o = (i?.isolation ?? r.value) !== "isolate";
	a && e.style.setProperty("position", "relative"), o && e.style.setProperty("isolation", "isolate"), vc.set(e, {
		count: 1,
		position: n,
		isolation: r,
		restorePosition: a,
		restoreIsolation: o
	});
}
function Sc(e) {
	let t = vc.get(e);
	t && (t.count--, !(t.count > 0) && (vc.delete(e), t.restorePosition && bc(e, "position", t.position), t.restoreIsolation && bc(e, "isolation", t.isolation)));
}
function Cc(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function wc(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t <= 0) throw RangeError(`${e} must be a finite number > 0, received ${String(t)}`);
}
function Tc(e) {
	for (let t of e.waves) t.animation.cancel(), t.element.parentElement === e.element && e.element.removeChild(t.element);
	e.waves.clear();
}
function Ec(e, t, n, r, i, a) {
	let o = e.element.getBoundingClientRect(), s = a === "center" || t.detail === 0 ? o.width / 2 : t.clientX - o.left, c = a === "center" || t.detail === 0 ? o.height / 2 : t.clientY - o.top, l = Math.max(Math.hypot(s, c), Math.hypot(o.width - s, c), Math.hypot(s, o.height - c), Math.hypot(o.width - s, o.height - c)), u = Math.max(1, l * 2 / i), d = document.createElement("span");
	d.setAttribute("aria-hidden", "true"), d.style.setProperty("position", "absolute"), d.style.setProperty("left", `${s}px`), d.style.setProperty("top", `${c}px`), d.style.setProperty("width", `${u}px`), d.style.setProperty("height", `${u}px`), d.style.setProperty("border-radius", "50%"), d.style.setProperty("pointer-events", "none"), d.style.setProperty("z-index", "-1"), d.style.setProperty("background-color", n), d.style.setProperty("opacity", "0"), d.style.setProperty("transform", "translate(-50%, -50%) scale(0)"), d.style.setProperty("will-change", "transform, opacity"), e.element.insertBefore(d, e.element.firstChild);
	let f;
	try {
		f = d.animate([{
			transform: "translate(-50%, -50%) scale(0)",
			opacity: .6
		}, {
			transform: `translate(-50%, -50%) scale(${i})`,
			opacity: 0
		}], {
			duration: r,
			easing: "ease-out",
			fill: "forwards"
		});
	} catch (t) {
		throw e.element.removeChild(d), t;
	}
	let p = {
		element: d,
		animation: f
	};
	e.waves.add(p), f.onfinish = () => {
		e.waves.delete(p), d.parentElement === e.element && e.element.removeChild(d);
	};
}
function Dc(e, t = {}) {
	let { color: n = mc, duration: r = hc, scale: i = gc, origin: a = _c } = t;
	if (Cc(n), wc("duration", r), wc("scale", i), a !== "pointer" && a !== "center") throw TypeError(`origin must be "pointer" or "center", received ${String(a)}`);
	let o = D(e);
	if (o.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("ripple() requires document.createElement, which is not available in this environment");
	if (o.some((e) => typeof e.animate != "function")) throw Error("ripple() requires the Web Animations API");
	let s = b(), c = o.map((e) => ({
		element: e,
		waves: /* @__PURE__ */ new Set(),
		acquired: !1,
		onClick: () => void 0
	})), l = !1, u = (e) => {
		e.acquired ||= (xc(e.element), !0);
	}, d = (e) => {
		e.acquired &&= (Sc(e.element), !1);
	};
	for (let e of c) e.onClick = (t) => {
		l || s || (e.acquired || u(e), Ec(e, t, n, r, i, a));
	};
	if (!s) {
		let e = [];
		try {
			for (let t of c) u(t), e.push(t);
		} catch (t) {
			for (let t of e) d(t);
			throw t;
		}
	}
	try {
		for (let e of c) e.element.addEventListener("click", e.onClick);
	} catch (e) {
		for (let e of c) e.element.removeEventListener("click", e.onClick);
		for (let e of c) d(e);
		throw e;
	}
	let f = C((e) => {
		if (!(l || e === s)) {
			if (s = e, e) for (let e of c) Tc(e), d(e);
			else for (let e of c) u(e);
		}
	});
	return { destroy: () => {
		if (!l) {
			l = !0, f();
			for (let e of c) e.element.removeEventListener("click", e.onClick), Tc(e), d(e);
		}
	} };
}
// src/effects/spotlight.ts
var Oc = "rgba(255, 255, 255, 0.18)", kc = 180, Ac = .6, jc = .12, Mc = /* @__PURE__ */ new WeakMap();
function Nc(e, t) {
	return {
		value: e.style.getPropertyValue(t),
		priority: e.style.getPropertyPriority(t)
	};
}
function Pc(e, t, n) {
	n.value === "" ? e.style.removeProperty(t) : e.style.setProperty(t, n.value, n.priority);
}
function Fc(e) {
	let t = Mc.get(e);
	if (t) {
		t.count++;
		return;
	}
	let n = Nc(e, "position"), r = Nc(e, "isolation"), i = typeof getComputedStyle == "function" ? getComputedStyle(e) : void 0, a = (i?.position ?? (n.value || "static")) === "static", o = (i?.isolation ?? r.value) !== "isolate";
	a && e.style.setProperty("position", "relative"), o && e.style.setProperty("isolation", "isolate"), Mc.set(e, {
		count: 1,
		position: n,
		isolation: r,
		restorePosition: a,
		restoreIsolation: o
	});
}
function Ic(e) {
	let t = Mc.get(e);
	t && (t.count--, !(t.count > 0) && (Mc.delete(e), t.restorePosition && Pc(e, "position", t.position), t.restoreIsolation && Pc(e, "isolation", t.isolation)));
}
function Lc(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function Rc(e, t, n, r = Infinity) {
	if (typeof t != "number" || !Number.isFinite(t) || t < n || t > r) {
		let i = r === Infinity ? `>= ${n}` : `between ${n} and ${r}`;
		throw RangeError(`${e} must be a finite number ${i}, received ${String(t)}`);
	}
}
function zc(e, t, n) {
	e.overlay.style.setProperty("--af-motion-spotlight-x", t), e.overlay.style.setProperty("--af-motion-spotlight-y", n);
}
function Bc(e, t) {
	e.listening !== t && (e.listening = t, t ? (e.element.addEventListener("pointermove", e.onPointerMove), e.element.addEventListener("pointerleave", e.onPointerLeave)) : (e.element.removeEventListener("pointermove", e.onPointerMove), e.element.removeEventListener("pointerleave", e.onPointerLeave), zc(e, "50%", "50%")));
}
function Vc(e, t, n, r, i, a) {
	let o = document.createElement("div");
	o.setAttribute("aria-hidden", "true"), o.style.setProperty("position", "absolute"), o.style.setProperty("inset", "0"), o.style.setProperty("z-index", "-1"), o.style.setProperty("overflow", "hidden"), o.style.setProperty("pointer-events", "none"), o.style.setProperty("background", `radial-gradient(circle ${n}px at var(--af-motion-spotlight-x, 50%) var(--af-motion-spotlight-y, 50%), ${t} 0%, transparent 70%)`), o.style.setProperty("opacity", String(a ? Math.min(r, .2) : r)), o.style.setProperty("transition", `background-position ${i}s ease-out`), o.style.setProperty("--af-motion-spotlight-x", "50%"), o.style.setProperty("--af-motion-spotlight-y", "50%");
	let s = {
		element: e,
		overlay: o,
		onPointerMove: () => void 0,
		onPointerLeave: () => void 0,
		listening: !1
	};
	return s.onPointerMove = (t) => {
		if (t.pointerType === "touch") return;
		let n = e.getBoundingClientRect();
		if (n.width <= 0 || n.height <= 0) return;
		let r = Math.min(Math.max(t.clientX - n.left, 0), n.width), i = Math.min(Math.max(t.clientY - n.top, 0), n.height);
		zc(s, `${r}px`, `${i}px`);
	}, s.onPointerLeave = () => zc(s, "50%", "50%"), s;
}
function Hc(e, t = {}) {
	let { color: n = Oc, radius: r = kc, intensity: i = Ac, smoothing: a = jc } = t;
	Lc(n), Rc("radius", r, Number.MIN_VALUE), Rc("intensity", i, 0, 1), Rc("smoothing", a, 0, 1);
	let o = D(e);
	if (o.length === 0) return { destroy: () => void 0 };
	if (typeof document > "u" || typeof document.createElement != "function") throw Error("spotlight() requires document.createElement, which is not available in this environment");
	let s = b(), c = o.map((e) => Vc(e, n, r, i, a, s)), l = !1, u = [], d = [];
	try {
		for (let e of c) Fc(e.element), d.push(e.element), e.element.insertBefore(e.overlay, e.element.firstChild), u.push(e), Bc(e, !s);
	} catch (e) {
		for (let e of u) Bc(e, !1), e.overlay.parentElement === e.element && e.element.removeChild(e.overlay);
		for (let e of d) Ic(e);
		throw e;
	}
	let f = C((e) => {
		if (!(l || e === s)) {
			s = e;
			for (let t of c) t.overlay.style.setProperty("opacity", String(e ? Math.min(i, .2) : i)), Bc(t, !e);
		}
	});
	return { destroy: () => {
		if (!l) {
			l = !0, f();
			for (let e of c) Bc(e, !1), e.overlay.parentElement === e.element && e.element.removeChild(e.overlay), Ic(e.element);
		}
	} };
}
var Uc = Hc, Wc = "#8b5cf6", Gc = 12, Kc = 6, qc = 500;
function Jc(e) {
	if (typeof e != "string" || e.trim() === "") throw TypeError("color must be a non-empty CSS color string");
	if (typeof CSS < "u" && typeof CSS.supports == "function" && !CSS.supports("color", e)) throw TypeError(`Invalid CSS color "${e}"`);
}
function Yc(e, t) {
	if (typeof t != "number" || !Number.isFinite(t) || t <= 0) throw RangeError(`${e} must be a finite number > 0, received ${String(t)}`);
}
function Xc(e) {
	if (!Number.isInteger(e) || e <= 0) throw RangeError(`particleCount must be a positive integer, received ${String(e)}`);
}
function Zc(e = {}) {
	let { color: t = Wc, particleCount: n = Gc, size: r = Kc, duration: i = qc, target: a } = e;
	if (Jc(t), Xc(n), Yc("size", r), Yc("duration", i), typeof document > "u") throw Error("cursorTrail() requires document, which is not available in this environment");
	let o;
	if (o = a === void 0 || a === document ? [document] : D(a), o.length === 0) return { destroy: () => void 0 };
	let s = b();
	if (!s && typeof document.createElement != "function") throw Error("cursorTrail() requires document.createElement, which is not available in this environment");
	if (!s && typeof document.createElement("span").animate != "function") throw Error("cursorTrail() requires the Web Animations API when motion is enabled");
	let c = s, l = !1, u = null, d = [], f = /* @__PURE__ */ new WeakSet(), p = (e) => {
		let t = d.indexOf(e);
		t >= 0 && d.splice(t, 1), e.animation.cancel(), e.element.parentElement === u && u?.removeChild(e.element);
	}, m = () => {
		for (let e of [...d]) p(e);
	}, h = () => {
		m(), u?.parentElement && u.parentElement.removeChild(u), u = null;
	}, g = () => {
		if (u) return u;
		let e = document.createElement("div");
		e.setAttribute("aria-hidden", "true"), e.style.setProperty("position", "fixed"), e.style.setProperty("inset", "0"), e.style.setProperty("overflow", "hidden"), e.style.setProperty("pointer-events", "none"), e.style.setProperty("z-index", "2147483647");
		let t = document.body ?? document.documentElement;
		if (!t) throw Error("cursorTrail() requires a document body or document element");
		return t.appendChild(e), u = e, e;
	}, _ = (e) => {
		if (l || c || e.pointerType === "touch" || f.has(e)) return;
		f.add(e);
		let o = e.currentTarget;
		if (a !== void 0 && a !== document && o instanceof HTMLElement) {
			let t = o.getBoundingClientRect();
			if (e.clientX < t.left || e.clientX > t.right || e.clientY < t.top || e.clientY > t.bottom) return;
		}
		let s = g();
		if (typeof s.animate != "function") throw Error("cursorTrail() requires the Web Animations API to animate particles");
		for (; d.length >= n;) {
			let e = d[0];
			e && p(e);
		}
		let m = document.createElement("span");
		m.style.setProperty("position", "absolute"), m.style.setProperty("left", `${e.clientX}px`), m.style.setProperty("top", `${e.clientY}px`), m.style.setProperty("width", `${r}px`), m.style.setProperty("height", `${r}px`), m.style.setProperty("margin-left", `${-r / 2}px`), m.style.setProperty("margin-top", `${-r / 2}px`), m.style.setProperty("border-radius", "50%"), m.style.setProperty("background-color", t), m.style.setProperty("pointer-events", "none"), m.style.setProperty("will-change", "transform, opacity"), s.appendChild(m);
		let h;
		try {
			h = m.animate([{
				opacity: .9,
				transform: "scale(1)"
			}, {
				opacity: 0,
				transform: "scale(0.2)"
			}], {
				duration: i,
				easing: "ease-out",
				fill: "forwards"
			});
		} catch (e) {
			throw s.removeChild(m), e;
		}
		let _ = {
			element: m,
			animation: h
		};
		d.push(_), h.onfinish = () => {
			let e = d.indexOf(_);
			e >= 0 && d.splice(e, 1), m.parentElement === u && u?.removeChild(m);
		};
	}, v = [];
	try {
		for (let e of o) e.addEventListener("pointermove", _), v.push(e);
	} catch (e) {
		for (let e of v) e.removeEventListener("pointermove", _);
		throw e;
	}
	let y = C((e) => {
		l || e === c || (c = e, e && h());
	});
	return { destroy: () => {
		if (!l) {
			l = !0, y();
			for (let e of v) e.removeEventListener("pointermove", _);
			h();
		}
	} };
}
// src/effects/scroll-animate.ts
function Qc(e, t, n = {}) {
	let { scrollTarget: r, easing: i, reverse: a = !1, onUpdate: o } = n;
	if (typeof a != "boolean") throw TypeError(`reverse must be a boolean, received ${String(a)}`);
	if (o !== void 0 && typeof o != "function") throw TypeError("onUpdate must be a function");
	let s = y(e, t, {
		duration: 0,
		respectReducedMotion: !1,
		...i === void 0 ? {} : { easing: i }
	});
	s.pause();
	let c = 0, l = !1, u = !1, d = (e) => {
		if (c = e, u || l) return;
		let t = a ? 1 - e : e;
		s.seek(t), s.pause(), o?.(e);
	}, f;
	try {
		f = E({
			target: r,
			onUpdate: ({ progress: e }) => d(e)
		});
	} catch (e) {
		throw s.cancel(), e;
	}
	return {
		pause: () => {
			l = !0;
		},
		resume: () => {
			!u && l && (l = !1, d(c));
		},
		getProgress: () => c,
		destroy: () => {
			u || (u = !0, f.destroy(), s.cancel());
		}
	};
}
// src/effects/scroll-direction.ts
var $c = 12;
function el(e) {
	if (typeof e != "number" || !Number.isFinite(e) || e < 0) throw RangeError(`threshold must be a finite number >= 0, received ${String(e)}`);
}
function tl(e) {
	if (typeof Window < "u" && e instanceof Window) {
		let t = document.documentElement, n = document.body;
		return Math.max(0, e.scrollY ?? e.pageYOffset ?? t.scrollTop ?? n?.scrollTop ?? 0);
	}
	return Math.max(0, e.scrollTop);
}
function nl(e) {
	if (typeof e != "object" || !e) throw TypeError("options must be an object");
	let { threshold: t = $c, target: n, onChange: r } = e;
	if (el(t), typeof r != "function") throw TypeError("onChange must be a function");
	let i = null, a;
	if (n === void 0) {
		if (typeof window > "u") throw Error("scrollDirection() requires window when no target is provided");
		a = window;
	} else if (typeof Window < "u" && n instanceof Window) a = n;
	else {
		let e = D(n);
		if (e.length > 1) throw RangeError("scrollDirection() target must resolve to exactly one element");
		if (i = e[0] ?? null, !i) return { destroy: () => void 0 };
		a = typeof window > "u" ? {} : window;
	}
	if (!i && typeof document > "u") throw Error("scrollDirection() requires document scroll metrics");
	if (typeof requestAnimationFrame != "function" || typeof cancelAnimationFrame != "function") throw Error("scrollDirection() requires requestAnimationFrame and cancelAnimationFrame");
	let o = i ?? a, s = !1, c = null, l = tl(o), u = "idle", d = () => {
		if (c = null, s) return;
		let e = tl(o);
		if (e <= t && u !== "idle") {
			l = e, u = "idle", r(u);
			return;
		}
		let n = e - l;
		if (Math.abs(n) < t || t === 0 && n === 0) return;
		l = e;
		let i = n > 0 ? "down" : "up";
		i !== u && (u = i, r(u));
	}, f = () => {
		s || c !== null || (c = requestAnimationFrame(d));
	};
	return o.addEventListener("scroll", f, { passive: !0 }), { destroy: () => {
		s || (s = !0, c !== null && cancelAnimationFrame(c), c = null, o.removeEventListener("scroll", f));
	} };
}
// src/core/palette-styles.ts
var rl = Object.freeze({
	primary: "--af-motion-color-primary",
	secondary: "--af-motion-color-secondary",
	accent: "--af-motion-color-accent",
	background: "--af-motion-color-background",
	surface: "--af-motion-color-surface",
	text: "--af-motion-color-text",
	muted: "--af-motion-color-muted",
	border: "--af-motion-color-border",
	success: "--af-motion-color-success",
	warning: "--af-motion-color-warning",
	error: "--af-motion-color-error",
	info: "--af-motion-color-info"
});
function il(e) {
	if (typeof e != "object" || !e || e.style === null || typeof e.style != "object" || typeof e.style.getPropertyValue != "function" || typeof e.style.getPropertyPriority != "function" || typeof e.style.setProperty != "function" || typeof e.style.removeProperty != "function") throw TypeError("Palette target must be a DOM element with an inline style declaration");
	return e.style;
}
function al(e) {
	let t = /* @__PURE__ */ new Map();
	for (let n of Object.values(rl)) t.set(n, {
		value: e.getPropertyValue(n),
		priority: e.getPropertyPriority(n)
	});
	return t;
}
function ol(e, t) {
	for (let n of Object.keys(rl)) e.setProperty(rl[n], t[n]);
}
function sl(e, t, n) {
	for (let [r, i] of t) n.has(r) && (i.value === "" ? e.removeProperty(r) : e.setProperty(r, i.value, i.priority));
}
function cl(e, t, n) {
	let r = il(e), i = al(r), a = /* @__PURE__ */ new Set(), o = !1, s = (e) => {
		if (!o) {
			if (e) {
				ol(r, e.tokens);
				for (let e of Object.values(rl)) a.add(e);
			} else sl(r, i, a);
		}
	};
	t && s(t);
	let c = n ? Un(s) : () => void 0;
	return () => {
		o || (o = !0, c(), sl(r, i, a));
	};
}
function ll(e, t) {
	let n = R(t);
	if (!n) throw TypeError(`Unknown palette "${t}"`);
	return cl(e, n, !1);
}
function ul(e, t = {}) {
	if (typeof t != "object" || !t || Array.isArray(t)) throw TypeError("Active palette options must be an object");
	if (t.subscribe !== void 0 && typeof t.subscribe != "boolean") throw TypeError("Active palette subscribe option must be a boolean");
	return cl(e, z(), t.subscribe === !0);
}
// src/core/palette-colors.ts
function dl(e, t) {
	if (t !== void 0) {
		if (!Array.isArray(t) || t.length === 0) throw TypeError(`${e} must be a non-empty array of colors`);
		for (let [n, r] of t.entries()) if (typeof r != "string" || r.trim() === "") throw TypeError(`${e}[${n}] must be a non-empty color string`);
	}
}
function fl(e) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("Palette color options must be an object");
	if (e.palette !== void 0 && (typeof e.palette != "string" || e.palette.trim() === "" || e.palette !== e.palette.trim())) throw TypeError("palette must be a registered palette name or \"active\"");
	if (dl("colors", e.colors), dl("fallback", e.fallback), e.palette === void 0 && e.colors === void 0 && e.fallback === void 0) throw TypeError("Palette color options must include a palette, colors, or fallback");
}
function pl(e) {
	let t = e === "active" ? z() : R(e);
	if (!t && e !== "active") throw TypeError(`Unknown palette "${e}"`);
	return t ? [
		t.tokens.primary,
		t.tokens.secondary,
		t.tokens.accent
	] : [];
}
function ml(e) {
	return Object.freeze([...e]);
}
function hl(e) {
	fl(e);
	let t = e.palette === void 0 ? [] : pl(e.palette);
	if (e.colors) return ml(e.colors);
	if (t.length > 0) return ml(t);
	if (e.fallback) return ml(e.fallback);
	throw TypeError("No active palette is available and no fallback colors were provided");
}
function gl(e, t) {
	if (fl(e), typeof t != "function") throw TypeError("Palette colors listener must be a function");
	if (e.colors !== void 0 || e.palette !== "active") return e.palette !== void 0 && e.palette !== "active" && pl(e.palette), () => void 0;
	if (e.fallback === void 0) throw TypeError("Active palette subscriptions require fallback colors");
	let n = e.fallback;
	return Un((e) => {
		t(ml(e ? [
			e.tokens.primary,
			e.tokens.secondary,
			e.tokens.accent
		] : n));
	});
}
export { rl as PALETTE_CSS_VARIABLES, Hn as activatePalette, vr as advancedGradientBackground, y as animate, de as animateInertia, xt as animateParallel, He as animatePreset, Ue as animatePresetSequence, f as animateProgress, we as animateSequence, ae as animateSpring, Be as animationPresetRegistry, Ve as animationSequencePresetRegistry, ul as applyActivePalette, P as applyMotionDNA, ll as applyPalette, Da as atmosphericBackground, ar as aurora, Zs as borderBeam, at as composeEffects, Mi as cosmicBackground, Ro as countUp, dt as createMotionChoreography, mt as createMotionRecipe, yt as createMotionStates, Se as createTimeline, Zc as cursorTrail, dn as drag, Pt as drawSVG, h as easeInCubic, m as easeInOutCubic, c as easeInOutQuad, O as easeInOutSine, ee as easeInQuad, u as easeInSine, A as easeOutBack, o as easeOutCubic, t as easeOutExpo, k as easeOutQuad, s as easeOutSine, r as easingRegistry, n as easings, Wa as energyBackground, Mr as floatingOrbs, la as fluidBackground, cn as followPointer, qi as geometricBackground, z as getActivePalette, Pe as getAnimationPreset, Fe as getAnimationSequencePreset, a as getEasing, Je as getMotionDNA, R as getPalette, Ps as glow, Vr as gradientBackground, l as gradientText, So as gridBackground, an as hoverMotion, x as inView, v as linear, Bn as listPalettes, Qt as magnetic, $t as magneticElement, Ut as morphSVG, Ze as motionDNARegistry, Qa as noiseBackground, Gn as paletteRegistry, wn as parallax, mi as particleBackground, $r as particleField, Uc as pointerGlow, Ie as registerAnimationPreset, Le as registerAnimationSequencePreset, e as registerEasing, Ye as registerMotionDNA, zn as registerPalette, Re as removeAnimationPreset, ze as removeAnimationSequencePreset, _ as removeEasing, Xe as removeMotionDNA, Wn as removePalette, nt as resolveAdaptiveMotion, hl as resolvePaletteColors, d as reveal, Dc as ripple, ht as runMotionRecipe, Qc as scrollAnimate, nl as scrollDirection, g as scrollProgress, w as scrollTrigger, E as scrollVelocity, pc as shine, ts as splitText, Hc as spotlight, Ao as spotlightBackground, Et as stagger, Un as subscribeToPaletteChanges, gl as subscribeToPaletteColors, Ko as textHighlight, Cs as textMask, ps as textReveal, T as textScramble, yn as tilt, S as typewriter, fo as waveBackground };

//# sourceMappingURL=index.js.map