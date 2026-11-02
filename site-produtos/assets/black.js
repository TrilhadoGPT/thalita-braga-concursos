/* Black Nutri: checkout e encerramento da oferta de hoje. */
const CONFIG = {
  CHECKOUT_BLACK: "https://pay.kiwify.com.br/onjo2mg",// link da oferta Black Nutri na Kiwify (R$ 157,90). Vazio = modo rascunho
  BLACK_FIM: "2026-11-03T02:59:59Z",  // 23:59:59 de 02/11/2026 em São Paulo (GMT-3). Só vale se o checkout sair do ar nesse horário
};

(() => {
  const d = document;
  const encerrou = Date.now() > Date.parse(CONFIG.BLACK_FIM);

  d.querySelectorAll("[data-checkout]").forEach((a) => {
    if (encerrou) {
      a.setAttribute("aria-disabled", "true");
      a.removeAttribute("href");
      a.innerHTML = '<span class="bp"><span class="bp-main">Oferta encerrada</span></span>';
    } else if (CONFIG.CHECKOUT_BLACK) {
      a.href = CONFIG.CHECKOUT_BLACK; a.rel = "noopener";
    } else a.href = "#oferta";
  });
  if (encerrou) d.querySelectorAll("[data-prazo]").forEach((el) => { el.textContent = "A oferta de hoje (02/11/2026) foi encerrada."; });

  // barra fixa mobile: aparece depois do hero e some na oferta final
  const stick = d.querySelector(".stick"), hero = d.querySelector(".hero"), fim = d.querySelector("#oferta");
  if (stick && encerrou) stick.remove();
  else if (stick && hero && fim && "IntersectionObserver" in window) {
    let heroFora = false, naOferta = false;
    const liga = () => stick.classList.toggle("on", heroFora && !naOferta);
    new IntersectionObserver(([e]) => { heroFora = !e.isIntersecting; liga(); }).observe(hero);
    new IntersectionObserver(([e]) => { naOferta = e.isIntersecting; liga(); }, { threshold: 0.25 }).observe(fim);
  }

  if (!CONFIG.CHECKOUT_BLACK && !encerrou) {
    const aviso = d.createElement("div");
    aviso.className = "draft";
    aviso.innerHTML = "<b>RASCUNHO</b> — falta preencher em <code>assets/black.js</code>: CHECKOUT_BLACK";
    d.body.appendChild(aviso);
  }
})();
