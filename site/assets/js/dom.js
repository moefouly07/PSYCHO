/*
 * Shared DOM helpers.
 *
 * Every node is built with createElement and textContent. User-controlled text
 * (nicknames, codes, imported values) is never written through innerHTML.
 */

/*
 * SVG elements must be created in the SVG namespace. document.createElement()
 * produces an unknown HTML element instead, which renders nothing and collapses
 * to zero height — which is why inline icons and the hero motif were invisible.
 */
const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set([
  "svg", "path", "circle", "rect", "line", "polyline", "polygon", "ellipse",
  "g", "defs", "linearGradient", "radialGradient", "stop", "use", "text", "tspan", "title"
]);

export function element(tag, attributes = {}, children = []) {
  const node = SVG_TAGS.has(tag)
    ? document.createElementNS(SVG_NS, tag)
    : document.createElement(tag);
  Object.entries(attributes).forEach(([name, value]) => {
    if (name === "class") node.setAttribute("class", value);
    else if (name === "text") node.textContent = String(value ?? "");
    else if (name.startsWith("on") && typeof value === "function") node.addEventListener(name.slice(2).toLowerCase(), value);
    else if (value !== null && value !== undefined && value !== false) node.setAttribute(name, value === true ? "" : String(value));
  });
  children.flat(Infinity).forEach((child) => {
    if (child === null || child === undefined || child === false) return;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return node;
}

export function clear(node) {
  node.replaceChildren();
}

export function announce(message) {
  const liveRegion = document.querySelector("#live-region");
  if (!liveRegion) return;
  liveRegion.textContent = "";
  window.setTimeout(() => { liveRegion.textContent = message; }, 20);
}

export function statusNode() {
  return element("p", { class: "status-message", role: "status", "aria-live": "polite" });
}

export function setStatus(node, message, isError = false) {
  node.textContent = message;
  node.className = `status-message${isError ? " is-error" : ""}`;
  announce(message);
}

export function sectionHeading(eyebrow, title, description) {
  return element("div", { class: "section-heading" }, [
    element("p", { class: "eyebrow", text: eyebrow }),
    element("h2", { text: title }),
    description ? element("p", { text: description }) : null
  ]);
}

export function breadcrumbs(items) {
  const nav = element("nav", { class: "breadcrumbs", "aria-label": "مسار الصفحة" });
  items.forEach((item, index) => {
    if (index) nav.append(element("span", { "aria-hidden": "true", text: "←" }));
    nav.append(item.href
      ? element("a", { href: item.href, text: item.label })
      : element("span", { "aria-current": "page", text: item.label }));
  });
  return nav;
}

export async function copyText(value, status, successMessage) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = element("textarea", { readonly: true });
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("Copy failed");
    }
    setStatus(status, successMessage);
  } catch {
    setStatus(status, "لم ينجح النسخ التلقائي. حدّد النص وانسخه يدويًا.", true);
  }
}

export function exportText(filename, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = element("a", { href: url, download: filename });
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function confirmAction({ title, message, confirmLabel = "تأكيد", danger = false }) {
  return new Promise((resolve) => {
    if (typeof HTMLDialogElement === "undefined") {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }
    const previouslyFocused = document.activeElement;
    const dialog = element("dialog", { class: "confirm-dialog" });
    const cancel = element("button", { type: "button", class: "button button--secondary", text: "تراجع" });
    const confirm = element("button", {
      type: "button",
      class: `button ${danger ? "button--danger" : "button--primary"}`,
      text: confirmLabel
    });
    dialog.append(element("div", { class: "dialog-body stack" }, [
      element("h2", { text: title }),
      element("p", { text: message }),
      element("div", { class: "cluster" }, [confirm, cancel])
    ]));
    const finish = (value) => {
      dialog.close();
      dialog.remove();
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
      resolve(value);
    };
    cancel.addEventListener("click", () => finish(false));
    confirm.addEventListener("click", () => finish(true));
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); finish(false); });
    document.body.append(dialog);
    dialog.showModal();
    confirm.focus();
  });
}

/*
 * Arabic-aware search normalization.
 *
 * Folds the common Alef forms, Alef Maqsura, Ta Marbuta, Tatweel, and optional
 * diacritics so that a query typed without them still matches. It is applied to
 * a COPY used for matching only; the displayed source text is never mutated.
 */
export function normalizeArabic(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[ً-ٰٟ]/g, "")
    .replace(/ـ/g, "")
    .replace(/[آأإٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ی/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("ar");
}

/* Wraps Latin/technical text so bidirectional rendering stays correct in RTL. */
export function isolatedCode(text, extra = {}) {
  return element("bdi", { dir: "ltr", ...extra, text });
}
