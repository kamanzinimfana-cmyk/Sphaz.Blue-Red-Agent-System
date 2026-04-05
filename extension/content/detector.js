(function () {
  if (window.__AI_DETECTOR__) return;
  window.__AI_DETECTOR__ = true;

  let highlightBox = document.createElement("div");
  highlightBox.style.position = "absolute";
  highlightBox.style.border = "2px solid #00ffcc";
  highlightBox.style.background = "rgba(0,255,204,0.1)";
  highlightBox.style.zIndex = "999999998";
  highlightBox.style.pointerEvents = "none";
  highlightBox.style.display = "none";

  document.body.appendChild(highlightBox);

  function isClickable(el) {
    const tag = el.tagName.toLowerCase();

    return (
      tag === "button" ||
      tag === "a" ||
      tag === "input" ||
      el.onclick ||
      el.role === "button" ||
      getComputedStyle(el).cursor === "pointer"
    );
  }

  function highlightElement(el) {
    const rect = el.getBoundingClientRect();

    highlightBox.style.left = rect.left + window.scrollX + "px";
    highlightBox.style.top = rect.top + window.scrollY + "px";
    highlightBox.style.width = rect.width + "px";
    highlightBox.style.height = rect.height + "px";
    highlightBox.style.display = "block";
  }

  function clearHighlight() {
    highlightBox.style.display = "none";
  }

  document.addEventListener("mousemove", (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);

    if (el && isClickable(el)) {
      highlightElement(el);
    } else {
      clearHighlight();
    }
  });

})();
