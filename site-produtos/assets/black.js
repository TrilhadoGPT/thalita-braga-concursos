/* Black Nutri: checkout e encerramento da oferta de hoje. */
const CONFIG = {
  CHECKOUT_BLACK: "https://pay.kiwify.com.br/onjo2mg",// link da oferta Black Nutri na Kiwify (R$ 197,00). Vazio = modo rascunho
  BLACK_FIM: "2026-11-07T02:59:59Z",  // 23:59:59 de 06/11/2026 em São Paulo (GMT-3). Troque a data se o prazo for outro. Só vale se o checkout sair do ar nesse horário
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
  // texto da tarja muda sozinho conforme faltam dias (dia contado em São Paulo, GMT-3)
  const brt = (t) => new Date(t - 3 * 3600e3);
  const dia = (t) => Math.floor(brt(t).getTime() / 864e5);
  const fimMs = Date.parse(CONFIG.BLACK_FIM);
  const faltam = dia(fimMs) - dia(Date.now());
  const dd = (n) => String(n).padStart(2, "0");
  const prazoTxt = encerrou ? "Essa oferta foi encerrada."
    : faltam <= 0 ? "OFERTA VÁLIDA SOMENTE HOJE ATÉ ÀS 23:59h"
    : faltam === 1 ? "OFERTA VÁLIDA ATÉ AMANHÃ ÀS 23:59h"
    : "OFERTA VÁLIDA ATÉ " + dd(brt(fimMs).getUTCDate()) + "/" + dd(brt(fimMs).getUTCMonth() + 1) + " ÀS 23:59h";
  d.querySelectorAll("[data-prazo]").forEach((el) => { el.textContent = prazoTxt; });

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
