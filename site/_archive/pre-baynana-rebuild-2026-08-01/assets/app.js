/* =============================================================================
   خريطة الذات والعلاقات — محرك الاختبارات
   -----------------------------------------------------------------------------
   محرك واحد يخدم كل الاختبارات المعرَّفة في data/tests.js. لا توجد نسخة منفصلة
   لأي اختبار، ولا توجد مكتبات خارجية ولا خطوة بناء.

   الحساب
   ------
   • درجة البُعد الخام = مجموع إجابات أسئلته الثلاثة (0..6)
   • نسبة البُعد        = round(الخام / 6 × 100)
   • المستوى الصحي      = النسبة نفسها في الأبعاد الموجبة، و(100 − النسبة) في
                          الأبعاد السالبة. الترتيب والتفسير يعتمدان عليه دائمًا.
   • المجموع المعدَّل    = مجموع الخام للأبعاد الموجبة + (6 − الخام) للسالبة
   • النسبة الكلية      = round(المجموع المعدَّل / 36 × 100)
   • نسب الأبعاد مستقلة ولا يُشترط أن يكون مجموعها 100٪.

   الخصوصية
   --------
   لا يوجد أي طلب شبكة في هذا الملف. كل شيء في localStorage، وكود المشاركة
   يُبنى ويُقرأ محليًا ولا يحتوي على إجابات خام.
   ========================================================================== */
(function () {
"use strict";

var DATA = window.APP_DATA;
var TESTS = DATA.TESTS;
var CATEGORIES = DATA.CATEGORIES;
var GLOBAL_DISCLAIMER = DATA.GLOBAL_DISCLAIMER;

var CODE_PREFIX = "MRT1.";
var CODE_VERSION = 1;
var NOISE_FLOOR = 17;          /* ثلاثة بنود لكل بُعد: أقل من ١٧ نقطة ضجيج */
var STRONG_CUT = 70;           /* حد اعتبار البُعد قويًا */
var K = {
  theme:    "mcr:theme",
  name:     "mcr:name",
  progress: function (id) { return "mcr:progress:" + id; },
  result:   function (id) { return "mcr:result:" + id; }
};

var app = document.getElementById("app");
var live = document.getElementById("live-region");
var pendingPeerCode = null;    /* كود شريك وصل عبر الرابط قبل أن ينهي المستخدم اختباره */

/* ---------------------------------------------------------------- أدوات DOM */
function h(tag, opts, kids) {
  var n = document.createElement(tag);
  opts = opts || {};
  if (opts.class) n.className = opts.class;
  if (opts.text !== undefined && opts.text !== null) n.textContent = String(opts.text);
  if (opts.html) n.innerHTML = opts.html;              /* نصوص ثابتة من الشيفرة فقط */
  Object.keys(opts).forEach(function (k) {
    if (k === "class" || k === "text" || k === "html") return;
    if (k === "onclick") { n.addEventListener("click", opts[k]); return; }
    if (opts[k] === false || opts[k] === null || opts[k] === undefined) return;
    n.setAttribute(k, opts[k] === true ? "" : String(opts[k]));
  });
  (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
  return n;
}
function svgEl(tag, attrs) {
  var n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, String(attrs[k])); });
  return n;
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
function say(msg) { if (live) live.textContent = msg; }
function pct(n) { return n + "٪"; }

/* ---------------------------------------------------------- تخزين محلي آمن */
function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, val); return true; } catch (e) { return false; } }
function lsDel(key) { try { localStorage.removeItem(key); } catch (e) {} }
function jsonGet(key) {
  var raw = lsGet(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { lsDel(key); return null; }
}

/* درجات الأبعاد المحفوظة قد تكون قديمة أو تالفة، فتُفحص قبل استعمالها
   حتى لا تظهر نتائج مثل NaN٪ أو ١٥٠٪. */
function validRaws(d) {
  if (!Array.isArray(d) || d.length !== 6) return false;
  for (var i = 0; i < 6; i++) {
    var v = d[i];
    if (typeof v !== "number" || !isFinite(v) || v < 0 || v > 6 || v % 1 !== 0) return false;
  }
  return true;
}
function savedResult(testId) {
  var s = jsonGet(K.result(testId));
  if (!s || !validRaws(s.d)) {
    if (s) lsDel(K.result(testId));
    return null;
  }
  return s;
}

function getTest(id) {
  for (var i = 0; i < TESTS.length; i++) if (TESTS[i].id === id) return TESTS[i];
  return null;
}
function dimsOf(test) { return test.dimensions; }
function questionsOfDim(test, dimId) {
  return test.questions.filter(function (q) { return q.dim === dimId; });
}

/* --------------------------------------------------------------- الحسابات */
function scoreFromRaws(test, raws) {
  var dims = dimsOf(test).map(function (d, i) {
    var raw = raws[i];
    var p = Math.round(100 * raw / 6);
    return {
      id: d.id, name: d.name, short: d.short, desc: d.desc,
      polarity: d.polarity, order: i, raw: raw, pct: p,
      healthy: d.polarity === "negative" ? 100 - p : p,
      def: d
    };
  });
  var adjusted = dims.reduce(function (s, d) {
    return s + (d.polarity === "negative" ? 6 - d.raw : d.raw);
  }, 0);
  var overall = Math.round(100 * adjusted / 36);
  var band = test.bands.filter(function (b) { return overall >= b.min && overall <= b.max; })[0] || test.bands[0];
  var healths = dims.map(function (d) { return d.healthy; });
  return {
    dims: dims, raws: raws, adjusted: adjusted, overall: overall, band: band,
    spread: Math.max.apply(null, healths) - Math.min.apply(null, healths)
  };
}

function levelKey(healthy) {
  if (healthy <= 39) return "low";
  if (healthy <= 69) return "developing";
  return "strong";
}

function rankDims(score) {
  var byHigh = score.dims.slice().sort(function (a, b) { return b.healthy - a.healthy || a.order - b.order; });
  var byLow = score.dims.slice().sort(function (a, b) { return a.healthy - b.healthy || a.order - b.order; });
  var strengths = byHigh.slice(0, 2);
  var taken = {};
  strengths.forEach(function (d) { taken[d.id] = true; });
  var growth = byLow.filter(function (d) { return d.healthy < STRONG_CUT && !taken[d.id]; }).slice(0, 2);
  return { strengths: strengths, growth: growth };
}

/* الملاحظات الشرطية المعرَّفة في بيانات الاختبار */
function evalNotes(test, score) {
  if (!test.notes) return [];
  var byId = {};
  score.dims.forEach(function (d) { byId[d.id] = d.healthy; });
  byId.overall = score.overall;
  return test.notes.filter(function (note) {
    return note.when.every(function (c) {
      var v = byId[c.dim];
      if (typeof v !== "number") return false;
      if (c.op === ">=") return v >= c.value;
      if (c.op === "<=") return v <= c.value;
      if (c.op === ">") return v > c.value;
      if (c.op === "<") return v < c.value;
      return false;
    });
  }).map(function (n) { return n.text; });
}

/* -------------------------------------------------- كود المشاركة (بدون إجابات) */
function b64urlEncode(str) {
  var bytes = new TextEncoder().encode(str);
  var bin = "";
  for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  var t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  var bin = atob(t);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function cleanName(v) {
  return String(v == null ? "" : v)
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 24);
}
/* الكود يحمل: رقم النسخة + معرّف الاختبار + الاسم + درجات الأبعاد المجمّعة فقط */
function encodeCode(testId, name, raws) {
  return CODE_PREFIX + b64urlEncode(JSON.stringify({ v: CODE_VERSION, t: testId, n: name, d: raws }));
}
function decodeCode(input) {
  var m = String(input == null ? "" : input).match(/MRT1\.([A-Za-z0-9\-_]{8,})/);
  if (!m) return { ok: false, why: "لم أجد كودًا صحيحًا. الكود يبدأ بـ MRT1. — انسخه كاملًا والصقه هنا." };
  var obj;
  try { obj = JSON.parse(b64urlDecode(m[1])); }
  catch (e) { return { ok: false, why: "الكود غير مكتمل أو تغيّر أثناء النسخ. اطلب إرساله مرة أخرى كاملًا." }; }
  if (!obj || obj.v !== CODE_VERSION) return { ok: false, why: "هذا الكود من نسخة مختلفة من الموقع." };
  var test = getTest(obj.t);
  if (!test) return { ok: false, why: "الكود يخص اختبارًا غير موجود." };
  if (!Array.isArray(obj.d) || obj.d.length !== 6) return { ok: false, why: "الكود لا يحتوي على درجات ستة أبعاد." };
  for (var i = 0; i < 6; i++) {
    if (typeof obj.d[i] !== "number" || obj.d[i] < 0 || obj.d[i] > 6 || obj.d[i] % 1 !== 0) {
      return { ok: false, why: "الكود يحتوي على درجات غير صالحة." };
    }
  }
  return { ok: true, rec: { testId: obj.t, name: cleanName(obj.n), raws: obj.d } };
}

function shareUrlFor(testId, code) {
  var base = location.origin === "null"
    ? location.href.split("#")[0]
    : location.origin + location.pathname;
  return base + "#/t/" + testId + (code ? "/p/" + code.slice(CODE_PREFIX.length) : "");
}

function copyText(text, statusEl, okMsg) {
  function fallback() {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    setStatus(statusEl, ok ? okMsg : "لم ينجح النسخ التلقائي. حدّد النص وانسخه يدويًا.", !ok);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      setStatus(statusEl, okMsg, false);
    }, fallback);
  } else fallback();
}
function setStatus(el, msg, isError) {
  if (!el) return;
  el.textContent = msg;
  el.className = "status" + (isError ? " status--error" : "");
  say(msg);
}

/* ------------------------------------------------------------ الرسوم البيانية */
/* رادار سداسي. الاتجاه عكس عقارب الساعة ليتقدم مع اتجاه القراءة العربية. */
function radarChart(series, dims, labelText) {
  var W = 440, H = 380, cx = W / 2, cy = 184, maxR = 100, labelR = 130;
  var n = dims.length, step = (2 * Math.PI) / n, start = -Math.PI / 2;
  function at(i, r) {
    var a = start - i * step;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }
  var svg = svgEl("svg", {
    "class": "chart", viewBox: "0 0 " + W + " " + H,
    role: "img", "aria-label": labelText
  });
  [0.25, 0.5, 0.75, 1].forEach(function (f) {
    var pts = [];
    for (var i = 0; i < n; i++) pts.push(at(i, maxR * f).join(","));
    svg.appendChild(svgEl("polygon", {
      points: pts.join(" "), fill: "none",
      stroke: "var(--line)", "stroke-width": f === 1 ? 1.3 : 0.9
    }));
  });
  for (var i = 0; i < n; i++) {
    var p = at(i, maxR);
    svg.appendChild(svgEl("line", { x1: cx, y1: cy, x2: p[0], y2: p[1], stroke: "var(--line)", "stroke-width": 0.9 }));
  }
  series.forEach(function (s) {
    var pts = [];
    for (var i = 0; i < n; i++) pts.push(at(i, (s.values[i] / 100) * maxR).join(","));
    svg.appendChild(svgEl("polygon", {
      points: pts.join(" "),
      fill: s.fill ? s.color : "none",
      "fill-opacity": s.fill ? 0.16 : 0,
      stroke: s.color, "stroke-width": 2.2,
      "stroke-dasharray": s.dash || "none",
      "stroke-linejoin": "round"
    }));
    for (var j = 0; j < n; j++) {
      var q = at(j, (s.values[j] / 100) * maxR);
      if (s.square) {
        svg.appendChild(svgEl("rect", { x: q[0] - 3.6, y: q[1] - 3.6, width: 7.2, height: 7.2, fill: s.color }));
      } else {
        svg.appendChild(svgEl("circle", { cx: q[0], cy: q[1], r: 3.8, fill: s.color }));
      }
    }
  });
  var solo = series.length === 1;
  for (var k = 0; k < n; k++) {
    var lp = at(k, labelR);
    var t = svgEl("text", {
      x: lp[0], y: lp[1] + (solo ? -4 : 4), "text-anchor": "middle",
      "font-size": "12.5", fill: "var(--muted)", direction: "rtl"
    });
    t.textContent = dims[k].short;
    svg.appendChild(t);
    if (solo) {
      var v = svgEl("text", {
        x: lp[0], y: lp[1] + 14, "text-anchor": "middle",
        "font-size": "12", "font-weight": "600", fill: series[0].color
      });
      v.textContent = pct(series[0].values[k]);
      svg.appendChild(v);
    }
  }
  return svg;
}

/* النسخة النصية المصاحبة لكل رسم */
function chartTable(dims, cols, rows) {
  var table = h("table", { "class": "chart-table" }, [
    h("caption", { text: "النسخة النصية للرسم البياني" }),
    h("thead", {}, [h("tr", {}, [h("th", { scope: "col", text: "البُعد" })].concat(
      cols.map(function (c) { return h("th", { scope: "col", text: c }); })
    ))]),
    h("tbody", {}, dims.map(function (d, i) {
      return h("tr", {}, [h("th", { scope: "row", text: d.name })].concat(
        rows.map(function (r) { return h("td", { text: r[i] }); })
      ));
    }))
  ]);
  return h("details", { "class": "reveal" }, [
    h("summary", { text: "اعرض النسخة النصية للرسم البياني" }),
    h("div", { "class": "reveal__body table-scroll" }, [table])
  ]);
}

/* ----------------------------------------------------------------- التوجيه */
function parseHash() {
  var raw = (location.hash || "#/").replace(/^#/, "");
  var parts = raw.split("/").filter(function (p) { return p.length; });
  if (!parts.length) return { name: "home" };
  if (parts[0] === "t" && parts[1]) {
    return { name: "test", id: decodeURIComponent(parts[1]), sub: parts[2] || "", arg: parts.slice(3).join("/") };
  }
  return { name: "home" };
}
function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  var route = parseHash();
  clear(app);
  window.scrollTo({ top: 0, behavior: "auto" });
  if (route.name === "test") {
    var test = getTest(route.id);
    if (!test) { app.appendChild(viewNotFound()); return; }
    if (route.sub === "p" && route.arg) {
      var res = decodeCode(CODE_PREFIX + route.arg);
      if (res.ok && res.rec.testId === test.id) pendingPeerCode = res.rec;
      app.appendChild(viewResultOrIntro(test));
      return;
    }
    if (route.sub === "q") { app.appendChild(viewQuiz(test)); return; }
    if (route.sub === "r") { app.appendChild(viewResultOrIntro(test)); return; }
    app.appendChild(viewIntro(test));
    return;
  }
  app.appendChild(viewHome());
}

function viewNotFound() {
  return h("div", { "class": "wrap wrap--quiz view-enter" }, [
    h("div", { "class": "card stack" }, [
      h("h1", { text: "الصفحة غير موجودة" }),
      h("p", { "class": "lede", text: "الرابط الذي فتحته لا يشير إلى اختبار موجود." }),
      h("div", {}, [h("a", { "class": "btn", href: "#/", text: "العودة إلى قائمة الاختبارات" })])
    ])
  ]);
}

/* ------------------------------------------------------------ الصفحة الرئيسية */
var homeState = { cat: "all", q: "" };

function viewHome() {
  var root = h("div", { "class": "wrap wrap--landing view-enter" });

  root.appendChild(h("section", { "class": "hero" }, [
    h("h1", { text: "خريطة الذات والعلاقات" }),
    h("p", { "class": "lede", text: "اختبارات نفسية وعاطفية إرشادية تساعدك على فهم نفسك وعلاقاتك بصورة أوضح." })
  ]));

  var grid = h("div", { "class": "grid", id: "test-grid" });

  var searchInput = h("input", {
    type: "text", id: "test-search", autocomplete: "off",
    placeholder: "ابحث باسم الاختبار…", "aria-label": "ابحث باسم الاختبار"
  });
  searchInput.value = homeState.q;
  searchInput.addEventListener("input", function () {
    homeState.q = searchInput.value;
    paintGrid(grid);
  });

  var searchIcon = svgEl("svg", {
    "class": "search__icon", viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", "stroke-width": "1.8", "aria-hidden": "true"
  });
  searchIcon.appendChild(svgEl("circle", { cx: "11", cy: "11", r: "6.5" }));
  searchIcon.appendChild(svgEl("path", { d: "M20 20l-4.2-4.2", "stroke-linecap": "round" }));

  var filters = h("div", { "class": "filters", role: "group", "aria-label": "تصفية حسب الفئة" });
  [{ id: "all", name: "كل الاختبارات" }].concat(CATEGORIES).forEach(function (c) {
    var b = h("button", {
      type: "button", "class": "chip", "aria-pressed": homeState.cat === c.id ? "true" : "false", text: c.name
    });
    b.addEventListener("click", function () {
      homeState.cat = c.id;
      filters.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      b.setAttribute("aria-pressed", "true");
      paintGrid(grid);
    });
    filters.appendChild(b);
  });

  root.appendChild(h("div", { "class": "controls" }, [
    h("div", { "class": "search" }, [searchIcon, searchInput]),
    filters
  ]));

  root.appendChild(h("h2", { "class": "sr-only", text: "قائمة الاختبارات" }));
  root.appendChild(grid);
  paintGrid(grid);
  return root;
}

function paintGrid(grid) {
  clear(grid);
  var q = homeState.q.trim();
  var list = TESTS.filter(function (t) {
    if (homeState.cat !== "all" && t.category !== homeState.cat) return false;
    if (!q) return true;
    return (t.title + " " + t.short).indexOf(q) !== -1;
  });
  if (!list.length) {
    grid.appendChild(h("p", { "class": "empty", text: "لا يوجد اختبار مطابق. جرّب كلمة أخرى أو اختر «كل الاختبارات»." }));
    say("لا توجد نتائج بحث");
    return;
  }
  list.forEach(function (t) { grid.appendChild(testCard(t)); });
  say(list.length + " اختبارًا معروضًا");
}

function testCard(test) {
  var catName = (CATEGORIES.filter(function (c) { return c.id === test.category; })[0] || {}).name || "";
  var saved = savedResult(test.id);
  var progress = jsonGet(K.progress(test.id));
  var answered = progress && progress.a ? Object.keys(progress.a).length : 0;

  var badges = h("div", { "class": "row", style: "gap:6px" }, [
    h("span", {
      "class": "badge " + (test.partner ? "badge--partner" : ""),
      text: test.partner ? "مقارنة مع شريك" : "فردي"
    })
  ]);
  if (saved) badges.appendChild(h("span", { "class": "badge badge--done", text: "نتيجة محفوظة" }));

  var actionLabel = saved ? "اعرض نتيجتك" :
    (answered > 0 && answered < test.questions.length ? "أكمل الاختبار" : "ابدأ الاختبار");

  return h("article", { "class": "test-card" }, [
    h("div", { "class": "test-card__top" }, [
      h("h3", { text: test.title }),
      h("span", { "class": "badge", text: catName })
    ]),
    h("p", { text: test.short }),
    badges,
    h("div", { "class": "test-card__meta" }, [
      h("span", { "class": "num", text: test.questions.length + " سؤالًا" }),
      h("span", { "class": "num", text: "نحو " + test.minutes + " دقائق" })
    ]),
    h("a", {
      "class": "btn", href: "#/t/" + test.id,
      "aria-label": actionLabel + ": " + test.title,
      text: actionLabel
    })
  ]);
}

/* ------------------------------------------------------------- شاشة التعريف */
function viewIntro(test) {
  var root = h("div", { "class": "wrap wrap--quiz view-enter stack-l" });
  var saved = savedResult(test.id);
  var progress = jsonGet(K.progress(test.id));
  var answered = progress && progress.a ? Object.keys(progress.a).length : 0;
  var resumable = answered > 0 && answered < test.questions.length;

  var head = h("div", { "class": "stack" }, [
    h("p", { "class": "eyebrow" }, [
      h("a", { href: "#/", text: "كل الاختبارات" }),
      document.createTextNode(" ← " + ((CATEGORIES.filter(function (c) { return c.id === test.category; })[0] || {}).name || ""))
    ]),
    h("h1", { text: test.title }),
    h("p", { "class": "lede", text: test.short }),
    h("div", { "class": "test-card__meta" }, [
      h("span", { "class": "num", text: test.questions.length + " سؤالًا" }),
      h("span", { text: "٦ أبعاد" }),
      h("span", { "class": "num", text: "نحو " + test.minutes + " دقائق" }),
      h("span", { text: test.partner ? "يدعم مقارنة الشريك" : "اختبار فردي" })
    ])
  ]);

  var instructions = h("div", { "class": "card stack" }, [
    h("h2", { text: "قبل أن تبدأ" }),
    h("ol", { "class": "stack-s", style: "padding-inline-start:20px;list-style:decimal" },
      test.instructions.map(function (t) { return h("li", { text: t }); }))
  ]);

  var disclaimer = h("div", { "class": "panel" }, [
    h("p", { text: test.disclaimer }),
    h("p", { style: "margin-top:8px", text: GLOBAL_DISCLAIMER })
  ]);

  var actions = h("div", { "class": "card stack" });
  if (saved) {
    actions.appendChild(h("p", { "class": "foot-note", text: "لديك نتيجة محفوظة لهذا الاختبار على هذا الجهاز." }));
    actions.appendChild(h("div", { "class": "row" }, [
      h("a", { "class": "btn", href: "#/t/" + test.id + "/r", text: "اعرض نتيجتك" }),
      restartButton(test, "ابدأ من جديد")
    ]));
  } else if (resumable) {
    actions.appendChild(h("p", { "class": "foot-note", text: "توقفت عند السؤال " + (answered + 1) + " من " + test.questions.length + "." }));
    actions.appendChild(h("div", { "class": "row" }, [
      h("a", { "class": "btn", href: "#/t/" + test.id + "/q", text: "أكمل من حيث توقفت" }),
      restartButton(test, "ابدأ من جديد")
    ]));
  } else {
    actions.appendChild(h("a", { "class": "btn", href: "#/t/" + test.id + "/q", text: "ابدأ الاختبار" }));
  }

  root.appendChild(head);
  root.appendChild(instructions);
  root.appendChild(disclaimer);
  root.appendChild(actions);
  return root;
}

/* زر إعادة البدء بتأكيد من خطوتين */
function restartButton(test, label) {
  var wrap = h("span", { "class": "row", style: "gap:8px" });
  var btn = h("button", { type: "button", "class": "btn btn--quiet", text: label });
  btn.addEventListener("click", function () {
    clear(wrap);
    wrap.appendChild(h("span", { "class": "foot-note", text: "سيُمسح تقدّمك ونتيجتك المحفوظة." }));
    var yes = h("button", { type: "button", "class": "btn btn--sm", text: "تأكيد" });
    var no = h("button", { type: "button", "class": "btn btn--quiet btn--sm", text: "تراجع" });
    yes.addEventListener("click", function () {
      lsDel(K.progress(test.id));
      lsDel(K.result(test.id));
      quiz = null;
      say("تم مسح النتيجة السابقة");
      go("#/t/" + test.id + "/q");
    });
    no.addEventListener("click", function () { render(); });
    wrap.appendChild(yes);
    wrap.appendChild(no);
    yes.focus();
  });
  wrap.appendChild(btn);
  return wrap;
}

/* ---------------------------------------------------------------- الاختبار */
var quiz = null;   /* { test, answers, order, index } */

function shuffledIndexes(len) {
  var a = [];
  for (var i = 0; i < len; i++) a.push(i);
  for (var j = a.length - 1; j > 0; j--) {
    var r = Math.floor(Math.random() * (j + 1));
    var t = a[j]; a[j] = a[r]; a[r] = t;
  }
  return a;
}

function loadQuiz(test) {
  var saved = jsonGet(K.progress(test.id));
  var order = (saved && saved.o) || {};
  var answers = (saved && saved.a) || {};
  /* ترتيب الاختيارات يُبنى مرة واحدة ويُحفظ، فيبقى ثابتًا عند الرجوع للخلف */
  test.questions.forEach(function (q) {
    if (!Array.isArray(order[q.id]) || order[q.id].length !== q.options.length) {
      order[q.id] = shuffledIndexes(q.options.length);
    }
  });
  var index = saved && typeof saved.i === "number" ? saved.i : 0;
  if (index < 0 || index >= test.questions.length) index = 0;
  var firstUnanswered = -1;
  for (var i = 0; i < test.questions.length; i++) {
    if (answers[test.questions[i].id] === undefined) { firstUnanswered = i; break; }
  }
  if (firstUnanswered !== -1 && answers[test.questions[index].id] !== undefined) index = firstUnanswered;
  quiz = { test: test, answers: answers, order: order, index: index };
  saveQuiz();
}
function saveQuiz() {
  if (!quiz) return;
  lsSet(K.progress(quiz.test.id), JSON.stringify({
    a: quiz.answers, o: quiz.order, i: quiz.index, ts: Date.now()
  }));
}

function viewQuiz(test) {
  loadQuiz(test);
  var root = h("div", { "class": "wrap wrap--quiz view-enter" });

  var fill = h("i", { "class": "progress__fill", id: "pfill" });
  var posLabel = h("span", { "class": "num", id: "ppos" });
  var pctLabel = h("span", { "class": "num", id: "ppct" });
  root.appendChild(h("div", { "class": "progress" }, [
    h("div", {
      "class": "progress__bar", role: "progressbar",
      "aria-valuemin": "0", "aria-valuemax": test.questions.length,
      "aria-valuenow": "0", id: "pbar",
      "aria-label": "تقدّمك في الاختبار"
    }, [fill]),
    h("div", { "class": "progress__labels" }, [posLabel, pctLabel])
  ]));

  var card = h("div", { "class": "card", id: "qcard" });
  root.appendChild(card);
  root.appendChild(h("p", {
    "class": "kbd-hint",
    html: 'اختصارات: <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> لاختيار الإجابة، <kbd>Enter</kbd> للتالي، <kbd>Backspace</kbd> للسابق.'
  }));

  /* تُحفظ المراجع مباشرة لأن الشجرة لم تُضف إلى المستند بعد،
     فلا يصلح البحث عنها عبر document في أول رسم. */
  quiz.els = {
    card: card,
    fill: fill,
    bar: root.querySelector("#pbar"),
    pos: posLabel,
    pct: pctLabel
  };
  paintQuestion();
  return root;
}

function paintQuestion() {
  var els = quiz.els;
  var card = els.card;
  var test = quiz.test;
  var q = test.questions[quiz.index];
  var total = test.questions.length;
  var answeredCount = Object.keys(quiz.answers).length;
  var chosen = quiz.answers[q.id];

  var percent = Math.round((answeredCount / total) * 100);
  if (els.fill) els.fill.style.width = percent + "%";
  if (els.bar) {
    els.bar.setAttribute("aria-valuenow", String(answeredCount));
    els.bar.setAttribute("aria-valuetext", "أجبت على " + answeredCount + " من " + total + " أسئلة، أي " + percent + " بالمئة");
  }
  if (els.pos) els.pos.textContent = "سؤال " + (quiz.index + 1) + " من " + total;
  if (els.pct) els.pct.textContent = "أُنجز " + pct(percent);

  clear(card);
  card.appendChild(h("h1", { "class": "sr-only", text: test.title }));
  card.appendChild(h("p", { "class": "qprompt", id: "qprompt", text: q.prompt }));

  var group = h("div", { "class": "options", role: "radiogroup", "aria-labelledby": "qprompt" });
  quiz.order[q.id].forEach(function (optIdx, position) {
    var opt = q.options[optIdx];
    var btn = h("button", {
      type: "button", "class": "option", role: "radio",
      "aria-checked": chosen === opt.s ? "true" : "false",
      "data-score": opt.s
    }, [
      h("span", { "class": "option__mark", "aria-hidden": "true" }),
      h("span", { "class": "option__text", text: opt.t })
    ]);
    btn.addEventListener("click", function () {
      quiz.answers[q.id] = opt.s;
      saveQuiz();
      /* لا انتقال تلقائي: يبقى الاختيار ظاهرًا حتى يضغط المستخدم «التالي» */
      paintQuestion(card);
      say("اخترت الإجابة رقم " + (position + 1));
    });
    group.appendChild(btn);
  });
  card.appendChild(group);

  var isLast = quiz.index === test.questions.length - 1;
  var back = h("button", { type: "button", "class": "btn btn--quiet", text: "السابق" });
  back.disabled = quiz.index === 0;
  back.addEventListener("click", goPrev);

  var next = h("button", {
    type: "button", "class": "btn", id: "btn-next",
    text: isLast ? "اعرض النتيجة" : "التالي"
  });
  next.disabled = chosen === undefined;
  next.addEventListener("click", goNext);

  card.appendChild(h("div", { "class": "qnav" }, [back, next]));
}

function goNext() {
  var test = quiz.test;
  if (quiz.answers[test.questions[quiz.index].id] === undefined) return;
  if (quiz.index < test.questions.length - 1) {
    quiz.index++;
    saveQuiz();
    paintQuestion();
  } else {
    finishQuiz();
  }
}
function goPrev() {
  if (quiz && quiz.index > 0) {
    quiz.index--;
    saveQuiz();
    paintQuestion();
  }
}

function finishQuiz() {
  var test = quiz.test;
  var missing = test.questions.filter(function (q) { return quiz.answers[q.id] === undefined; });
  if (missing.length) {
    for (var i = 0; i < test.questions.length; i++) {
      if (test.questions[i].id === missing[0].id) { quiz.index = i; break; }
    }
    saveQuiz();
    paintQuestion();
    say("بقي سؤال بلا إجابة");
    return;
  }
  var raws = dimsOf(test).map(function (d) {
    return questionsOfDim(test, d.id).reduce(function (s, q) { return s + quiz.answers[q.id]; }, 0);
  });
  var name = cleanName(lsGet(K.name) || "");
  lsSet(K.result(test.id), JSON.stringify({ n: name, d: raws, ts: Date.now() }));
  lsDel(K.progress(test.id));
  quiz = null;
  go("#/t/" + test.id + "/r");
}

/* ----------------------------------------------------------------- النتيجة */
function viewResultOrIntro(test) {
  var saved = savedResult(test.id);
  if (!saved) {
    var intro = viewIntro(test);
    if (pendingPeerCode && pendingPeerCode.testId === test.id) {
      var note = h("div", { "class": "panel panel--accent" }, [
        h("p", { text: (pendingPeerCode.name || "شريكك") + " أرسل لك نتيجته في هذا الاختبار. أجب أنت على الأسئلة أولًا، وستظهر المقارنة بينكما مباشرة بعد نتيجتك." })
      ]);
      intro.insertBefore(note, intro.children[1] || null);
    }
    return intro;
  }
  return viewResult(test, saved);
}

function viewResult(test, saved) {
  var score = scoreFromRaws(test, saved.d);
  var ranked = rankDims(score);
  var root = h("div", { "class": "wrap wrap--result view-enter stack-l" });

  /* --- العنوان والنسبة الكلية --- */
  var head = h("section", { "class": "card stack" }, [
    h("p", { "class": "eyebrow" }, [h("a", { href: "#/", text: "كل الاختبارات" })]),
    h("h1", { text: test.title }),
    h("div", { "class": "score" }, [
      h("span", { "class": "score__value num", text: pct(score.overall) }),
      h("span", { "class": "score__band", text: score.band.label })
    ]),
    h("p", { "class": "lede", text: score.band.summary }),
    h("p", { "class": "foot-note", text: "النسبة تعبّر عن درجتك داخل بنود هذا الاختبار فقط، والنطاقات وصفية أولية وليست نقاط قطع سريرية." })
  ]);
  root.appendChild(head);

  /* --- كتلة خاصة: نمط التعلق --- */
  if (test.extra === "attachment") root.appendChild(attachmentBlock(test, score));

  /* --- الرسم البياني --- */
  var labels = score.dims.map(function (d) { return d.name + " " + pct(d.pct); }).join("، ");
  var chart = radarChart(
    [{ values: score.dims.map(function (d) { return d.pct; }), color: "var(--primary)", fill: true }],
    score.dims,
    "رسم بياني سداسي لنتائجك: " + labels
  );
  root.appendChild(h("section", { "class": "card stack" }, [
    h("h2", { text: "خريطة الأبعاد الستة" }),
    chart,
    chartTable(score.dims, ["النسبة"], [score.dims.map(function (d) { return pct(d.pct); })])
  ]));

  /* --- أقوى بُعدين --- */
  var strengthCards = ranked.strengths.map(function (d) {
    return h("div", { "class": "callout callout--strength" }, [
      h("span", { "class": "callout__tag", text: "نقطة قوة" }),
      h("h3", {}, [
        document.createTextNode(d.name + " — "),
        h("span", { "class": "num", text: pct(d.pct) }),
        d.polarity === "negative" ? h("span", { "class": "dim__flag", text: " (كلما قلّت النسبة كان أفضل)" }) : null
      ]),
      h("p", { text: d.def.interp[levelKey(d.healthy)] })
    ]);
  });
  var strengthSection = h("section", { "class": "card stack" }, [
    h("h2", { text: "أقوى جانبين عندك" })
  ].concat(strengthCards).concat([
    h("p", { "class": "foot-note", text: score.band.strength }),
    score.spread < NOISE_FLOOR
      ? h("p", { "class": "foot-note", text: "الفروق بين أبعادك كلها أصغر من ١٧ نقطة، وهي أقل من أن تُقرأ كترتيب حاسم. اعتبر النتيجة مستوى عامًا واحدًا." })
      : null
  ]));
  root.appendChild(strengthSection);

  /* --- أولويات التطوير مع اقتراح عملي لكل واحدة --- */
  if (ranked.growth.length) {
    var growthCards = ranked.growth.map(function (d) {
      return h("div", { "class": "callout callout--growth" }, [
        h("span", { "class": "callout__tag", text: "أولوية للتطوير" }),
        h("h3", {}, [
          document.createTextNode(d.name + " — "),
          h("span", { "class": "num", text: pct(d.pct) }),
          d.polarity === "negative" ? h("span", { "class": "dim__flag", text: " (كلما قلّت النسبة كان أفضل)" }) : null
        ]),
        h("p", { text: d.def.interp[levelKey(d.healthy)] }),
        h("p", { style: "margin-top:4px" }, [
          h("strong", { text: "خطوة عملية: " }),
          document.createTextNode(d.def.tip)
        ])
      ]);
    });
    root.appendChild(h("section", { "class": "card stack" }, [
      h("h2", { text: "الجوانب الأولى بالتطوير" })
    ].concat(growthCards).concat([
      h("p", { "class": "foot-note", text: score.band.growth })
    ])));
  }

  /* --- تفصيل الأبعاد الستة --- */
  var list = h("div", { "class": "dim-list" });
  score.dims.forEach(function (d) {
    var meter = h("i");
    meter.style.width = d.pct + "%";
    if (d.polarity === "negative") meter.className = "is-accent";
    list.appendChild(h("div", { "class": "dim" }, [
      h("div", { "class": "dim__head" }, [
        h("span", { "class": "dim__name", text: d.name }),
        h("span", { "class": "dim__value num", text: pct(d.pct) })
      ]),
      h("div", { "class": "dim__meter", "aria-hidden": "true" }, [meter]),
      d.polarity === "negative" ? h("span", { "class": "dim__flag", text: "كلما قلّت النسبة كان أفضل" }) : null,
      h("p", { "class": "dim__desc", text: d.def.interp[levelKey(d.healthy)] })
    ]));
  });
  root.appendChild(h("section", { "class": "card stack" }, [
    h("h2", { text: "تحليل الأبعاد الستة" }),
    list
  ]));

  /* --- ملاحظات شرطية --- */
  var notes = evalNotes(test, score);
  if (notes.length) {
    root.appendChild(h("section", { "class": "card stack" }, [
      h("h2", { text: "ملاحظات تستحق الانتباه" })
    ].concat(notes.map(function (t) {
      return h("div", { "class": "callout callout--note" }, [h("p", { text: t })]);
    }))));
  }

  /* --- المشاركة والمقارنة --- */
  root.appendChild(shareSection(test, saved, score));
  if (test.partner) root.appendChild(compareSection(test, saved, score));

  /* --- التنبيه والأزرار --- */
  root.appendChild(h("section", { "class": "card stack" }, [
    h("div", { "class": "panel" }, [
      h("p", { text: test.disclaimer }),
      h("p", { style: "margin-top:8px", text: GLOBAL_DISCLAIMER })
    ]),
    h("div", { "class": "row" }, [
      restartButton(test, "إعادة الاختبار"),
      h("a", { "class": "btn btn--ghost", href: "#/", text: "اختبار آخر" })
    ])
  ]));

  return root;
}

/* كتلة نمط التعلق: قلق، تجنب، مؤشر أمان، وميل موصوف بحذر */
function attachmentBlock(test, score) {
  var cfg = test.extraConfig;
  var by = {};
  score.dims.forEach(function (d) { by[d.id] = d; });

  function mean(list) {
    return Math.round(list.reduce(function (a, b) { return a + b; }, 0) / list.length);
  }
  var anxiety = mean(cfg.anxietyDims.map(function (id) { return by[id].pct; }));
  var avoidance = mean(cfg.avoidanceDims.map(function (id) {
    return cfg.invertInAvoidance.indexOf(id) !== -1 ? 100 - by[id].pct : by[id].pct;
  }));
  var security = mean(cfg.securityDims.map(function (id) { return by[id].pct; }).concat([100 - anxiety, 100 - avoidance]));

  var hiA = anxiety >= cfg.threshold, hiV = avoidance >= cfg.threshold;
  var key = hiA && hiV ? "fearful" : hiA ? "anxious" : hiV ? "avoidant" : "secure";
  var tend = cfg.tendencies[key];
  var borderline = Math.abs(anxiety - cfg.threshold) <= cfg.borderline ||
                   Math.abs(avoidance - cfg.threshold) <= cfg.borderline;

  return h("section", { "class": "card stack" }, [
    h("h2", { text: "قراءة إضافية لنمط التعلق" }),
    h("div", { "class": "stat-row" }, [
      h("div", { "class": "stat" }, [
        h("span", { "class": "stat__label", text: "قلق التعلق" }),
        h("span", { "class": "stat__value num", text: pct(anxiety) })
      ]),
      h("div", { "class": "stat" }, [
        h("span", { "class": "stat__label", text: "تجنّب التعلق" }),
        h("span", { "class": "stat__value num", text: pct(avoidance) })
      ]),
      h("div", { "class": "stat" }, [
        h("span", { "class": "stat__label", text: "مؤشر الأمان المشتق" }),
        h("span", { "class": "stat__value num", text: pct(security) })
      ])
    ]),
    h("div", { "class": "callout callout--note" }, [
      h("span", { "class": "callout__tag", text: "الميل الحالي" }),
      h("h3", { text: tend.label }),
      h("p", { text: tend.text }),
      borderline ? h("p", { style: "margin-top:6px", text: cfg.borderlineText }) : null
    ]),
    h("p", { "class": "foot-note", text: "قلق التعلق وتجنّبه بُعدان مستقلان، لذلك يمكن أن يرتفعا معًا أو ينخفضا معًا. الوصف أعلاه ميل في هذه المرحلة وليس هوية ثابتة، ويتغير باختلاف الشخص الذي أمامك وباختلاف الظروف." })
  ]);
}

/* --------------------------------------------------- المشاركة ونسخ الملخص */
function summaryText(test, score) {
  var lines = [];
  lines.push(test.title);
  lines.push("النتيجة العامة: " + pct(score.overall) + " — " + score.band.label);
  lines.push("");
  score.dims.forEach(function (d) {
    lines.push("• " + d.name + ": " + pct(d.pct) + (d.polarity === "negative" ? " (كلما قلّت كان أفضل)" : ""));
  });
  lines.push("");
  lines.push("تقييم ذاتي إرشادي من موقع «خريطة الذات والعلاقات» — ليس تشخيصًا ولا بديلًا عن مختص.");
  return lines.join("\n");
}

function shareSection(test, saved, score) {
  var status = h("p", { "class": "status", role: "status", "aria-live": "polite" });

  var shareBtn = h("button", { type: "button", "class": "btn btn--ghost", text: "شارك الاختبار" });
  shareBtn.addEventListener("click", function () {
    var url = shareUrlFor(test.id, null);
    if (navigator.share) {
      navigator.share({ title: test.title, text: test.short, url: url })
        .then(function () { setStatus(status, "تمت المشاركة.", false); })
        .catch(function () { copyText(url, status, "تم نسخ رابط الاختبار."); });
    } else {
      copyText(url, status, "تم نسخ رابط الاختبار.");
    }
  });

  var copyBtn = h("button", { type: "button", "class": "btn btn--ghost", text: "انسخ ملخص النتيجة" });
  copyBtn.addEventListener("click", function () {
    copyText(summaryText(test, score), status, "تم نسخ ملخص نتيجتك كنص.");
  });

  return h("section", { "class": "card stack" }, [
    h("h2", { text: "المشاركة" }),
    h("div", { "class": "row" }, [shareBtn, copyBtn]),
    status,
    h("p", { "class": "foot-note", text: "رابط المشاركة يفتح الاختبار نفسه ولا يحتوي على نتيجتك. ملخص النتيجة يُنسخ كنص إلى الحافظة، وأنت من يقرر أين تلصقه." })
  ]);
}

/* ------------------------------------------------------------ مقارنة الشريك */
function compareSection(test, saved, score) {
  var myCode = encodeCode(test.id, cleanName(saved.n), saved.d);
  var status = h("p", { "class": "status", role: "status", "aria-live": "polite" });
  var out = h("div", { "class": "stack-l", id: "compare-out" });

  var nameInput = h("input", {
    type: "text", maxlength: "24", autocomplete: "off",
    placeholder: "اسمك كما يظهر في المقارنة", id: "cmp-name"
  });
  nameInput.value = cleanName(saved.n);
  var codeBox = h("div", { "class": "code-box", id: "my-code", text: myCode });

  function refreshCode() {
    var nm = cleanName(nameInput.value);
    saved.n = nm;
    lsSet(K.result(test.id), JSON.stringify({ n: nm, d: saved.d, ts: Date.now() }));
    lsSet(K.name, nm);
    codeBox.textContent = encodeCode(test.id, nm, saved.d);
  }
  nameInput.addEventListener("input", refreshCode);

  var copyCode = h("button", { type: "button", "class": "btn btn--ghost", text: "انسخ كودي" });
  copyCode.addEventListener("click", function () {
    copyText(codeBox.textContent, status, "تم نسخ كودك. أرسله لشريكك.");
  });
  var copyLink = h("button", { type: "button", "class": "btn btn--ghost", text: "انسخ رابطًا يحمل كودي" });
  copyLink.addEventListener("click", function () {
    copyText(shareUrlFor(test.id, codeBox.textContent), status, "تم نسخ الرابط. من يفتحه يستطيع مقارنة نتيجته بنتيجتك.");
  });

  var peerInput = h("textarea", {
    "class": "code-input", spellcheck: "false", id: "peer-code",
    placeholder: "MRT1.…", "aria-label": "الصق كود شريكك هنا"
  });
  var pairBtn = h("button", { type: "button", "class": "btn", text: "اعرض المقارنة" });

  function runCompare(rec) {
    clear(out);
    out.appendChild(comparisonView(test, saved, score, rec));
    setStatus(status, "تمت قراءة نتيجة " + (rec.name || "شريكك") + ".", false);
    out.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  pairBtn.addEventListener("click", function () {
    var res = decodeCode(peerInput.value);
    if (!res.ok) { setStatus(status, res.why, true); return; }
    if (res.rec.testId !== test.id) {
      setStatus(status, "هذا الكود يخص اختبارًا آخر: " + (getTest(res.rec.testId) || {}).title + ".", true);
      return;
    }
    if (res.rec.raws.join(",") === saved.d.join(",") && res.rec.name === cleanName(saved.n)) {
      setStatus(status, "هذا كودك أنت. الصق الكود الذي أرسله لك شريكك.", true);
      return;
    }
    runCompare(res.rec);
  });

  var section = h("section", { "class": "card stack" }, [
    h("h2", { text: "المقارنة مع شريكك" }),
    h("p", { "class": "foot-note", text: "كل واحد منكما يجيب بمفرده، ثم تتبادلان الكود. الكود يحتوي على اسمك ودرجات الأبعاد الستة فقط، ولا يحتوي على إجاباتك على الأسئلة." }),
    h("label", { "class": "field" }, [document.createTextNode("الاسم الظاهر"), nameInput]),
    h("h3", { text: "كودك" }),
    codeBox,
    h("div", { "class": "row" }, [copyCode, copyLink]),
    h("h3", { text: "كود شريكك" }),
    peerInput,
    h("div", { "class": "row" }, [pairBtn]),
    status,
    h("p", { "class": "foot-note", text: "الكود مُرمَّز لتسهيل النقل، لكنه غير مشفّر: من يحصل عليه يستطيع فك قراءته. شاركه مع من تثق به فقط." }),
    out
  ]);

  if (pendingPeerCode && pendingPeerCode.testId === test.id) {
    var pending = pendingPeerCode;
    pendingPeerCode = null;
    setTimeout(function () { runCompare(pending); }, 0);
  }
  return section;
}

function comparisonView(test, saved, score, peer) {
  var peerScore = scoreFromRaws(test, peer.raws);
  var nameA = cleanName(saved.n) || "أنت";
  var nameB = peer.name || "شريكك";

  var rows = score.dims.map(function (d, i) {
    var a = d.pct, b = peerScore.dims[i].pct;
    return {
      i: i, id: d.id, name: d.name, def: d.def, a: a, b: b,
      gap: Math.abs(a - b),
      avgHealthy: (d.healthy + peerScore.dims[i].healthy) / 2
    };
  });
  var byGap = rows.slice().sort(function (x, y) { return y.gap - x.gap || x.i - y.i; });
  var aligned = rows.slice().sort(function (x, y) { return x.gap - y.gap || y.avgHealthy - x.avgHealthy || x.i - y.i; });

  var wrap = h("div", { "class": "stack-l" });

  /* رسم مزدوج */
  var chart = radarChart([
    { values: score.dims.map(function (d) { return d.pct; }), color: "var(--primary)", fill: true },
    { values: peerScore.dims.map(function (d) { return d.pct; }), color: "var(--accent)", fill: false, dash: "5 4", square: true }
  ], score.dims, "رسم بياني يقارن نتيجتي " + nameA + " و" + nameB + " في الأبعاد الستة");

  var legend = h("div", { "class": "legend" }, [
    h("span", {}, [
      (function () { var i = h("i"); i.style.borderTopColor = "var(--primary)"; i.style.borderTopStyle = "solid"; return i; })(),
      document.createTextNode(nameA + " — " + pct(score.overall) + " (" + score.band.label + ")")
    ]),
    h("span", {}, [
      (function () { var i = h("i"); i.style.borderTopColor = "var(--accent)"; i.style.borderTopStyle = "dashed"; return i; })(),
      document.createTextNode(nameB + " — " + pct(peerScore.overall) + " (" + peerScore.band.label + ")")
    ])
  ]);

  wrap.appendChild(h("section", { "class": "card stack" }, [
    h("h2", { text: "خريطتكما معًا" }),
    test.extra === "compatibility"
      ? h("p", { "class": "foot-note", text: "لا يوجد اختبار يتنبأ بنجاح علاقة أو فشلها. ما تراه هنا وصف لمدى وضوح الاتفاق بينكما في ستة مجالات كما يراه كل طرف، والهدف منه فتح حوار محدد لا إصدار حكم." })
      : h("p", { "class": "foot-note", text: "هذه ليست نسبة توافق ولا حكمًا على العلاقة. الفروق توضح أين تختلف طريقتكما، لا من الأفضل." }),
    chart,
    legend,
    chartTable(score.dims, [nameA, nameB, "الفرق"], [
      rows.map(function (r) { return pct(r.a); }),
      rows.map(function (r) { return pct(r.b); }),
      rows.map(function (r) { return pct(r.gap); })
    ])
  ]));

  /* صفوف الفروق */
  var rowsBox = h("div", {});
  byGap.forEach(function (r) {
    var lo = Math.min(r.a, r.b), hi = Math.max(r.a, r.b);
    var span = h("span", { "class": "track__span" });
    span.style.insetInlineStart = lo + "%";
    span.style.width = (hi - lo) + "%";
    var pinA = h("span", { "class": "track__pin track__pin--a", title: nameA + ": " + pct(r.a) });
    pinA.style.insetInlineStart = r.a + "%";
    var pinB = h("span", { "class": "track__pin track__pin--b", title: nameB + ": " + pct(r.b) });
    pinB.style.insetInlineStart = r.b + "%";

    rowsBox.appendChild(h("div", { "class": "pair-row" }, [
      h("div", { "class": "pair-row__head" }, [
        h("span", { "class": "dim__name", text: r.name }),
        h("span", { "class": "pair-row__gap", text: r.gap === 0 ? "لا فرق" : (r.gap < NOISE_FLOOR ? "فرق ضئيل " + pct(r.gap) : "فرق " + pct(r.gap)) })
      ]),
      h("div", { "class": "track", "aria-hidden": "true" }, [span, pinA, pinB]),
      h("p", { "class": "pair-row__values", text: nameA + " " + pct(r.a) + " · " + nameB + " " + pct(r.b) })
    ]));
  });
  wrap.appendChild(h("section", { "class": "card stack" }, [
    h("h2", { text: "الفروق بينكما، بُعدًا ببُعد" }),
    h("p", { "class": "foot-note", text: "الصفر على اليمين والمئة على اليسار، وطول الخط بين النقطتين هو حجم الفرق. الترتيب من أكبر فرق إلى أصغره." }),
    rowsBox,
    h("p", { "class": "foot-note", text: "كل بُعد مبني على ثلاثة أسئلة فقط، لذلك أي فرق أقل من ١٧ نقطة لا يُقرأ كاختلاف حقيقي." })
  ]));

  /* أقوى مجالات التوافق */
  var strongAlign = aligned.filter(function (r) { return r.gap < NOISE_FLOOR && r.avgHealthy >= 60; }).slice(0, 2);
  var alignBox = h("div", { "class": "stack-s" });
  if (strongAlign.length) {
    strongAlign.forEach(function (r) {
      alignBox.appendChild(h("div", { "class": "callout callout--strength" }, [
        h("span", { "class": "callout__tag", text: "تقارب واضح" }),
        h("h3", { text: r.name }),
        h("p", { text: r.def.pair.bothHigh })
      ]));
    });
  } else {
    var closest = aligned[0];
    alignBox.appendChild(h("div", { "class": "callout callout--strength" }, [
      h("span", { "class": "callout__tag", text: "أقرب مجال بينكما" }),
      h("h3", { text: closest.name }),
      h("p", { text: "هذا أقل مجال فيه فرق بينكما (" + pct(closest.gap) + "). لا يوجد مجال يجتمع فيه التقارب مع مستوى مرتفع عند الاثنين، وهذا في حد ذاته معلومة تستحق الحديث." })
    ]));
  }
  wrap.appendChild(h("section", { "class": "card stack" }, [
    h("h2", { text: "أقوى مجالات التوافق" }),
    alignBox
  ]));

  /* مجالات تحتاج حوارًا + مقترحات محايدة */
  var talkBox = h("div", { "class": "stack-s" });
  var used = {};
  var widest = byGap[0];
  if (widest.gap >= NOISE_FLOOR) {
    used[widest.id] = true;
    talkBox.appendChild(h("div", { "class": "callout callout--growth" }, [
      h("span", { "class": "callout__tag", text: widest.gap >= 34 ? "أكبر اختلاف بينكما" : "أوضح اختلاف، وهو محدود" }),
      h("h3", { text: widest.name }),
      h("p", { text: widest.def.pair.gap })
    ]));
  } else {
    talkBox.appendChild(h("div", { "class": "callout callout--growth" }, [
      h("span", { "class": "callout__tag", text: "لا يوجد اختلاف واضح" }),
      h("h3", { text: "الأبعاد الستة" }),
      h("p", { text: "كل الفروق بينكما أقل من ١٧ نقطة، أي أن طريقتكما متقاربة. اقرآ الجوانب التالية كمسؤولية مشتركة لا كفرق بينكما." })
    ]));
  }
  var weakest = rows.slice().sort(function (x, y) { return x.avgHealthy - y.avgHealthy || x.i - y.i; })
    .filter(function (r) { return !used[r.id]; })[0];
  if (weakest && weakest.avgHealthy < STRONG_CUT) {
    talkBox.appendChild(h("div", { "class": "callout callout--growth" }, [
      h("span", { "class": "callout__tag", text: "أضعف جانب عند الاثنين" }),
      h("h3", { text: weakest.name }),
      h("p", { text: weakest.def.pair.bothLow })
    ]));
  }
  wrap.appendChild(h("section", { "class": "card stack" }, [
    h("h2", { text: "مجالات تستحق حوارًا" }),
    talkBox,
    h("p", { "class": "foot-note", text: "هذه مقترحات للحوار لا أحكامًا. اقرآها معًا واختارا واحدة فقط تبدآن بها." })
  ]));

  return wrap;
}

/* ------------------------------------------------------------------ السمة */
function applyTheme(mode) {
  if (mode === "light" || mode === "dark") {
    document.documentElement.setAttribute("data-theme", mode);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  var btn = document.getElementById("theme-toggle");
  if (btn) {
    var isDark = mode === "dark" ||
      (!mode && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    btn.setAttribute("aria-label", isDark ? "التبديل إلى المظهر الفاتح" : "التبديل إلى المظهر الداكن");
  }
}
function currentTheme() {
  var stored = lsGet(K.theme);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
/* اسم الموقع في الأعلى: يعود دائمًا إلى الصفحة الرئيسية ويصعد لأعلى الصفحة.
   بدون هذا المعالج لا يحدث شيء عند الضغط عليه ونحن على الصفحة الرئيسية أصلًا،
   لأن المتصفح لا يطلق hashchange عندما يكون العنوان هو نفسه. */
var brandLink = document.querySelector(".brand");
if (brandLink) {
  brandLink.addEventListener("click", function (e) {
    e.preventDefault();
    homeState.cat = "all";
    homeState.q = "";
    go("#/");
    window.scrollTo({ top: 0, behavior: "auto" });
  });
}

var themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    lsSet(K.theme, next);
    applyTheme(next);
    say(next === "dark" ? "تم تفعيل المظهر الداكن" : "تم تفعيل المظهر الفاتح");
  });
}
applyTheme(lsGet(K.theme));

/* ------------------------------------------------------- اختصارات لوحة المفاتيح */
document.addEventListener("keydown", function (e) {
  if (!quiz) return;
  var tag = (e.target && e.target.tagName) || "";
  var editing = tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable);
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  var map = { "1": 0, "2": 1, "3": 2, "١": 0, "٢": 1, "٣": 2 };
  if (!editing && Object.prototype.hasOwnProperty.call(map, e.key)) {
    var group = document.querySelector("#qcard .options");
    if (group && group.children[map[e.key]]) {
      group.children[map[e.key]].click();
      e.preventDefault();
    }
    return;
  }
  if (e.key === "Enter" && !editing) {
    var next = document.getElementById("btn-next");
    if (next && !next.disabled) { next.click(); e.preventDefault(); }
    return;
  }
  /* Backspace يرجع للسابق فقط خارج حقول الإدخال */
  if (e.key === "Backspace" && !editing) {
    goPrev();
    e.preventDefault();
  }
});

/* --------------------------------------------------------------- الإقلاع */
window.addEventListener("hashchange", function () { quiz = null; render(); });
render();

})();
