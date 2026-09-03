import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/*
 * A minimal DOM shim, written here rather than pulled in as a dependency.
 *
 * It is deliberately small: enough to actually execute the view modules and
 * catch wiring errors (missing exports, bad selectors, undefined helpers),
 * without adding a headless browser to a project that has zero runtime
 * dependencies. It is NOT a browser and does not attempt layout or CSS.
 */

class ClassList {
  constructor(node) { this.node = node; }
  get set() {
    return new Set(String(this.node.className || "").split(/\s+/).filter(Boolean));
  }
  write(set) { this.node.className = Array.from(set).join(" "); }
  add(...names) { const s = this.set; names.forEach((n) => s.add(n)); this.write(s); }
  remove(...names) { const s = this.set; names.forEach((n) => s.delete(n)); this.write(s); }
  contains(name) { return this.set.has(name); }
  toggle(name, force) {
    const s = this.set;
    const shouldAdd = force === undefined ? !s.has(name) : Boolean(force);
    if (shouldAdd) s.add(name); else s.delete(name);
    this.write(s);
    return shouldAdd;
  }
}

class Node {
  constructor(tagName) {
    this.tagName = String(tagName || "").toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.className = "";
    this._text = "";
    this.style = {};
    this.dataset = new Proxy({}, {
      get: (_, key) => this.attributes.get(`data-${camelToDash(String(key))}`),
      set: (_, key, value) => { this.attributes.set(`data-${camelToDash(String(key))}`, String(value)); return true; }
    });
    this.classList = new ClassList(this);
    this.disabled = false;
    this.hidden = false;
    this.checked = false;
    this.selected = false;
    this.value = "";
  }

  get textContent() {
    if (this.children.length) return this.children.map((child) => child.textContent).join("");
    return this._text;
  }
  set textContent(value) {
    this.children = [];
    this._text = String(value ?? "");
  }

  get firstElementChild() { return this.children.find((child) => child instanceof Node) || null; }

  setAttribute(name, value) {
    if (name === "class") { this.className = String(value); return; }
    this.attributes.set(name, String(value));
    if (name === "hidden") this.hidden = true;
    if (name === "disabled") this.disabled = true;
  }
  getAttribute(name) {
    if (name === "class") return this.className;
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
  removeAttribute(name) { this.attributes.delete(name); }
  hasAttribute(name) { return this.attributes.has(name); }

  append(...nodes) {
    nodes.forEach((child) => {
      const node = child instanceof Node ? child : textNode(String(child));
      node.parentNode = this;
      this.children.push(node);
    });
  }
  appendChild(child) { this.append(child); return child; }
  replaceChildren(...nodes) { this.children = []; this._text = ""; this.append(...nodes); }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    this.parentNode = null;
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  removeEventListener(type, handler) {
    const list = this.listeners.get(type) || [];
    this.listeners.set(type, list.filter((entry) => entry !== handler));
  }
  dispatchEvent(event) {
    const handlers = this.listeners.get(event.type) || [];
    handlers.forEach((handler) => handler.call(this, { ...event, currentTarget: this, target: this, preventDefault() {} }));
    return true;
  }
  /*
   * Anchors behave like real anchors.
   *
   * A click dispatches listeners first; if nothing called preventDefault, the
   * default action runs. In-page hash links assign location.hash (which fires
   * hashchange), while modified clicks, target="_blank", download links, and
   * external/mailto/tel links keep native behaviour and never route.
   */
  click(options = {}) {
    let defaultPrevented = false;
    const event = {
      type: "click",
      currentTarget: this,
      target: this,
      button: options.button ?? 0,
      ctrlKey: Boolean(options.ctrlKey),
      metaKey: Boolean(options.metaKey),
      shiftKey: Boolean(options.shiftKey),
      altKey: Boolean(options.altKey),
      preventDefault() { defaultPrevented = true; }
    };
    (this.listeners.get("click") || []).forEach((handler) => handler.call(this, event));

    let node = this;
    while (node && node.tagName !== "A") node = node.parentNode;
    if (!node || defaultPrevented) return { defaultPrevented, navigated: false };

    const href = node.getAttribute("href");
    if (!href) return { defaultPrevented, navigated: false };
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return { defaultPrevented, navigated: false, reason: "modified click" };
    }
    if (node.getAttribute("target") === "_blank") return { defaultPrevented, navigated: false, reason: "new tab" };
    if (node.hasAttribute("download")) return { defaultPrevented, navigated: false, reason: "download" };
    if (/^(https?:|mailto:|tel:)/i.test(href)) return { defaultPrevented, navigated: false, reason: "external" };

    if (href.startsWith("#")) {
      const globalWindow = globalThis.window;
      if (href.startsWith("#/")) globalWindow.location.hash = href;
      // A bare fragment moves focus natively and does not route.
      return { defaultPrevented, navigated: href.startsWith("#/"), reason: href.startsWith("#/") ? "route" : "fragment" };
    }
    return { defaultPrevented, navigated: false };
  }
  /* Tracked so tests can assert where focus landed after navigation. */
  focus() { activeElement = this; }
  blur() { if (activeElement === this) activeElement = null; }
  scrollIntoView() {}
  select() {}
  showModal() { this.setAttribute("open", ""); }
  close() { this.removeAttribute("open"); }

  closest(selector) {
    let node = this;
    while (node) {
      if (node instanceof Node && matches(node, selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  descendants() {
    const out = [];
    const walk = (node) => node.children.forEach((child) => {
      if (!(child instanceof Node)) return;
      out.push(child);
      walk(child);
    });
    walk(this);
    return out;
  }

  querySelectorAll(selector) {
    return this.descendants().filter((node) => matches(node, selector));
  }
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

/*
 * Text nodes must be real Node instances: browser code branches on
 * `child instanceof Node`, and a plain object would be stringified instead.
 */
function textNode(text) {
  const node = new Node("#text");
  node._text = String(text);
  return node;
}
function camelToDash(value) { return value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`); }

/*
 * Supports the selector shapes the app actually uses:
 * "tag", ".class", "#id", "[attr]", "tag[attr]", "[attr=value]"
 */
function matches(node, selector) {
  if (!(node instanceof Node)) return false;
  return String(selector).split(",").map((part) => part.trim()).some((part) => {
    /* Supports [attr], [attr=v], [attr^=v], [attr$=v], [attr*=v]. */
    const attrMatch = part.match(/^([a-zA-Z-]*)\[([a-zA-Z-]+)(?:([~^$*]?=)["']?([^\]"']*)["']?)?\]$/);
    if (attrMatch) {
      const [, tag, attr, op, value] = attrMatch;
      if (tag && node.tagName !== tag.toUpperCase()) return false;
      if (!node.attributes.has(attr)) return false;
      if (op === undefined) return true;
      const actual = node.attributes.get(attr);
      if (op === "^=") return actual.startsWith(value);
      if (op === "$=") return actual.endsWith(value);
      if (op === "*=") return actual.includes(value);
      return actual === value;
    }
    if (part.startsWith(".")) return node.classList.contains(part.slice(1));
    if (part.startsWith("#")) return node.attributes.get("id") === part.slice(1);
    return node.tagName === part.toUpperCase();
  });
}


/*
 * A very small HTML parser, used only to build the real page shell from
 * index.html so the tests exercise the shipped header, nav, and footer markup
 * instead of a hand-written copy that could drift out of sync.
 *
 * It handles the subset index.html actually uses: elements, quoted attributes,
 * void elements, comments, and text. It is not a general HTML parser.
 */
let activeElement = null;

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr"
]);

export function parseHtml(html, into) {
  const root = into || new Node("div");
  const stack = [root];
  const tokenizer = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let match;

  while ((match = tokenizer.exec(html)) !== null) {
    const [full, closeTag, openTag, attrString, selfClose, text] = match;
    if (full.startsWith("<!--")) continue;

    if (closeTag) {
      for (let i = stack.length - 1; i > 0; i -= 1) {
        if (stack[i].tagName === closeTag.toUpperCase()) { stack.length = i; break; }
      }
      continue;
    }

    if (openTag) {
      const el = new Node(openTag);
      const attrRe = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
      let attr;
      while ((attr = attrRe.exec(attrString || "")) !== null) {
        const name = attr[1];
        const value = attr[2] ?? attr[3] ?? attr[4] ?? "";
        el.setAttribute(name, value);
      }
      stack[stack.length - 1].append(el);
      if (!selfClose && !VOID_ELEMENTS.has(openTag.toLowerCase())) stack.push(el);
      continue;
    }

    if (text && text.trim()) {
      stack[stack.length - 1].append(textNode(text.replace(/\s+/g, " ")));
    }
  }
  return root;
}

export function installDom({ hash = "#/" } = {}) {
  globalThis.HashChangeEvent = class { constructor(type) { this.type = type; } };
  const documentElement = new Node("html");
  const body = new Node("body");
  documentElement.append(body);

  const document = {
    documentElement,
    body,
    title: "",
    get activeElement() { return activeElement; },
    createElement(tag) { return new Node(tag); },
    /* The app creates SVG nodes in their namespace; the shim treats them alike. */
    createElementNS(_ns, tag) { return new Node(tag); },
    createTextNode(text) { return textNode(text); },
    querySelector(selector) {
      return matches(documentElement, selector) ? documentElement : documentElement.querySelector(selector);
    },
    querySelectorAll(selector) { return documentElement.querySelectorAll(selector); },
    addEventListener(type, handler) { documentElement.addEventListener(type, handler); },
    removeEventListener(type, handler) { documentElement.removeEventListener(type, handler); },
    dispatchEvent(event) { return documentElement.dispatchEvent(event); }
  };
  documentElement.dataset; // touch the proxy so data-theme writes work

  /*
   * The real shell, parsed from index.html: header, navigation, mobile menu,
   * main, live region, and footer. Scripts are stripped because app.js is
   * imported by the test itself.
   */
  const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const bodyHtml = indexHtml
    .slice(indexHtml.indexOf("<body>") + 6, indexHtml.lastIndexOf("</body>"))
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<noscript>[\s\S]*?<\/noscript>/g, "")
    .replace(/<svg[\s\S]*?<\/svg>/g, "");
  parseHtml(bodyHtml, body);

  const menuToggle = body.querySelector("#menu-toggle");
  if (menuToggle && !menuToggle.hasAttribute("aria-expanded")) {
    menuToggle.setAttribute("aria-expanded", "false");
  }
  const mobileMenu = body.querySelector("#mobile-menu");
  if (mobileMenu) mobileMenu.hidden = true;

  const listeners = new Map();
  const storageFactory = () => {
    const map = new Map();
    return {
      get length() { return map.size; },
      key(index) { return Array.from(map.keys())[index] ?? null; },
      getItem(key) { return map.has(key) ? map.get(key) : null; },
      setItem(key, value) { map.set(key, String(value)); },
      removeItem(key) { map.delete(key); },
      clear() { map.clear(); }
    };
  };

  /*
   * Assigning location.hash dispatches hashchange, exactly as a browser does.
   * Without this, navigate() would silently fail to re-render and the smoke
   * tests would pass against a stale view.
   */
  let currentHash = hash;
  const historyStack = [hash];
  let historyIndex = 0;

  /* Back/Forward move through the stack and fire hashchange, as a browser does. */
  function go(delta) {
    const next = historyIndex + delta;
    if (next < 0 || next >= historyStack.length) return;
    historyIndex = next;
    currentHash = historyStack[historyIndex];
    locationStub.href = `https://example.test/${currentHash}`;
    window.dispatchEvent(new globalThis.HashChangeEvent("hashchange"));
  }

  const locationStub = {
    origin: "https://example.test",
    pathname: "/",
    href: `https://example.test/${hash}`,
    get hash() { return currentHash; },
    set hash(value) {
      const next = String(value).startsWith("#") ? String(value) : `#${value}`;
      if (next === currentHash) return;
      currentHash = next;
      // Assignment pushes a history entry, exactly like a browser.
      historyStack.length = historyIndex + 1;
      historyStack.push(next);
      historyIndex = historyStack.length - 1;
      this.href = `https://example.test/${next}`;
      window.dispatchEvent(new globalThis.HashChangeEvent("hashchange"));
    },
    replace(url) {
      this.href = String(url);
      if (String(url).startsWith("#")) currentHash = String(url);
    }
  };

  const window = {
    document,
    location: locationStub,
    history: {
      replaceState(_state, _title, url) {
        /* replaceState does not fire hashchange; the caller dispatches it. */
        if (typeof url === "string" && url.startsWith("#")) {
          if (historyStack.length) historyStack[historyIndex] = url;
          currentHash = url;
          locationStub.href = `https://example.test/${url}`;
        }
      },
      back() { go(-1); },
      forward() { go(1); },
      go
    },
    localStorage: storageFactory(),
    sessionStorage: storageFactory(),
    matchMedia() { return { matches: false, addEventListener() {}, removeEventListener() {} }; },
    scrollTo() {},
    getComputedStyle() { return {}; },
    setTimeout: (fn) => { fn(); return 0; },
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
    confirm: () => true,
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    dispatchEvent(event) {
      (listeners.get(event.type) || []).forEach((handler) => handler(event));
      return true;
    }
  };

  globalThis.window = window;
  globalThis.document = document;
  globalThis.location = window.location;
  globalThis.navigator = { clipboard: { writeText: async () => {} } };

  globalThis.Node = Node;
  globalThis.Blob = class {};
  globalThis.URL = { createObjectURL: () => "blob:stub", revokeObjectURL() {} };
  /* Left undefined on purpose: confirmAction then uses window.confirm. */
  globalThis.HTMLDialogElement = undefined;
  globalThis.HTMLElement = Node;

  return { window, document, body, app: document.querySelector("#app") };
}
