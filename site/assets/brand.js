/* Clipboard confirmation is announced without moving keyboard focus. */
(() => {
  "use strict";
  const live = document.getElementById("br-copy-status");
  if (!live) return;
  const timers = new WeakMap();
  function legacyCopy(value, button) {
    const area = document.createElement("textarea");
    area.value = value; area.setAttribute("readonly", ""); area.style.cssText="position:fixed;left:-9999px;top:0;opacity:0";
    document.body.appendChild(area); area.select();
    let ok=false;
    try{ok=document.execCommand("copy");}catch{}
    area.remove(); button.focus({preventScroll:true}); return ok;
  }
  document.querySelectorAll("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.dataset.copy;
      let ok=false;
      try { if(navigator.clipboard && window.isSecureContext){ await navigator.clipboard.writeText(value); ok=true; } } catch{}
      if(!ok) ok=legacyCopy(value,button);
      clearTimeout(timers.get(button));
      button.querySelector("span").textContent=ok?"تم النسخ":"نسخ يدويًا";
      live.textContent=ok?"نُسخ رمز اللون "+value:"تعذّر النسخ الآلي. حدد رمز اللون الظاهر وانسخه يدويًا.";
      timers.set(button, setTimeout(()=>{button.querySelector("span").textContent="نسخ";},2200));
    });
  });
})();
