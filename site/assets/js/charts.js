import { formatPercentage } from "./scoring.js";

function element(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attributes).forEach(([name, value]) => {
    if (name === "class") node.className = value;
    else if (name === "text") node.textContent = value;
    else if (value !== null && value !== undefined && value !== false) node.setAttribute(name, value === true ? "" : String(value));
  });
  children.forEach((child) => { if (child) node.append(child); });
  return node;
}

export function createDimensionMeters(dimensions) {
  const list = element("div", { class: "meter-list" });
  dimensions.forEach((dimension) => {
    const fill = element("i", {
      class: `meter-fill${dimension.polarity === "negative" ? " is-risk" : ""}`
    });
    fill.style.width = `${dimension.percentage}%`;
    list.append(element("div", { class: "meter-item" }, [
      element("div", { class: "meter-head" }, [
        element("strong", { text: dimension.name }),
        element("span", { text: formatPercentage(dimension.percentage) })
      ]),
      element("div", {
        class: "meter-track",
        role: "meter",
        "aria-label": dimension.name,
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": dimension.percentage,
        "aria-valuetext": formatPercentage(dimension.percentage)
      }, [fill])
    ]));
  });
  return list;
}

export function createComparisonChart(rows, firstName, secondName) {
  const chart = element("div", {
    class: "comparison-chart",
    role: "img",
    "aria-label": `مقارنة نسب ${firstName} و${secondName} في الأبعاد الستة. يتبع الرسم جدول نصي كامل.`
  });

  rows.forEach((row) => {
    const firstFill = element("i");
    const secondFill = element("i");
    firstFill.style.width = `${row.first}%`;
    secondFill.style.width = `${row.second}%`;
    chart.append(element("div", { class: "comparison-row" }, [
      element("span", { class: "comparison-label", text: row.name }),
      element("div", { class: "comparison-bars", "aria-hidden": "true" }, [
        element("span", { class: "comparison-bar" }, [firstFill]),
        element("span", { class: "comparison-bar" }, [secondFill])
      ]),
      element("span", { class: "comparison-gap", text: `${row.label} · ${formatPercentage(row.gap)}` })
    ]));
  });

  const table = element("table", { class: "data-table" });
  table.append(element("caption", { text: "النسخة النصية الكاملة للرسم" }));
  table.append(element("thead", {}, [
    element("tr", {}, [
      element("th", { scope: "col", text: "البُعد" }),
      element("th", { scope: "col", text: firstName }),
      element("th", { scope: "col", text: secondName }),
      element("th", { scope: "col", text: "الفرق" }),
      element("th", { scope: "col", text: "الوصف" })
    ])
  ]));
  const body = element("tbody");
  rows.forEach((row) => {
    body.append(element("tr", {}, [
      element("th", { scope: "row", text: row.name }),
      element("td", { text: formatPercentage(row.first) }),
      element("td", { text: formatPercentage(row.second) }),
      element("td", { text: formatPercentage(row.gap) }),
      element("td", { text: row.label })
    ]));
  });
  table.append(body);

  const details = element("details", { class: "accordion" }, [
    element("summary", { text: "اعرض البديل النصي للرسم" }),
    element("div", { class: "table-scroll accordion-content" }, [table])
  ]);

  return element("div", { class: "stack" }, [
    element("div", { class: "cluster fine-print" }, [
      element("span", { class: "badge", text: `${firstName}: اللون الزيتوني` }),
      element("span", { class: "badge", text: `${secondName}: اللون الخوخي` })
    ]),
    chart,
    details
  ]);
}
