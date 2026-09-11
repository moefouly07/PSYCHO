import { storage } from "./storage.js";
import { element } from "./dom.js";
import { navigate } from "./router.js";

// Acceptance is per activity and per tab; clearing a session revokes it.
export function sensitiveGate(id, message, returnPath) {
  const key = `${storage.sessionKey.prefix}gate:${id}`;
  if (storage.readSession(key) === true) return null;
  const consent = element("input", { type: "checkbox" });
  const proceed = element("button", { type: "button", class: "button button--primary", text: "متابعة باختياري" });
  proceed.disabled = true;
  consent.addEventListener("change", () => { proceed.disabled = !consent.checked; });
  proceed.addEventListener("click", () => {
    if (!consent.checked) return;
    storage.writeSession(key, true);
    navigate(window.location.hash);
  });
  return element("section", { class: "container narrow-page page-section stack--lg view-enter" }, [
    element("h1", { text: "قبل الدخول إلى محتوى حساس" }),
    element("p", { class: "lede", text: "خذ وقتك واختر مكانًا تشعر فيه بالخصوصية. المشاركة اختيارية، ويمكنك التوقف في أي وقت." }),
    element("div", { class: "notice stack" }, [
      element("p", { text: message || "هذه أسئلة للتأمل في سلوكك وتجربتك، وليست تشخيصًا أو حكمًا على أي شخص." }),
      element("p", { text: "للخروج السريع، اضغط Escape مرتين متتاليتين أو استخدم زر الخروج. لا يمسح ذلك سجل المتصفح أو الحافظة." })
    ]),
    element("label", { class: "check-field" }, [consent, element("span", { text: "عمري 18 عامًا أو أكثر، وأرغب في المتابعة باختياري وفي مكان آمن." })]),
    element("div", { class: "cluster" }, [proceed, element("a", { class: "button button--secondary", href: returnPath, text: "العودة الآن" })])
  ]);
}
