// Shared runtime helpers. Inlined into every composition.
// Kept tiny on purpose — animation lives in the per-template GSAP timeline.
(function () {
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function fillList(rootSel, items, render) {
    var root = $(rootSel);
    if (!root || !items) return;
    root.innerHTML = "";
    items.forEach(function (item, i) {
      var li = document.createElement("li");
      li.innerHTML = render(item, i);
      if (item.severity) li.classList.add("flag-" + item.severity);
      root.appendChild(li);
    });
  }

  function setText(sel, text) {
    var el = $(sel);
    if (el && text != null) el.textContent = text;
  }

  function setRiskGauge(sel, level) {
    var el = $(sel);
    if (!el) return;
    var lvl = (level || "review").toLowerCase();
    el.classList.add(lvl);
    var pct = lvl === "high" ? 0.92 : lvl === "medium" ? 0.62 : lvl === "low" ? 0.28 : 0.5;
    var fill = el.querySelector(".fill");
    if (fill) {
      var r = parseFloat(fill.getAttribute("r"));
      var c = 2 * Math.PI * r;
      fill.setAttribute("stroke-dasharray", String(c));
      fill.setAttribute("stroke-dashoffset", String(c * (1 - pct)));
      var color = lvl === "high" ? "#FF5C7A" : lvl === "medium" ? "#F6B73C" : lvl === "low" ? "#3DD68C" : "#5B8DEF";
      fill.setAttribute("stroke", color);
    }
  }

  window.ExChekVideo = { $: $, $$: $$, fillList: fillList, setText: setText, setRiskGauge: setRiskGauge };
})();
