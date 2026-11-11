/* Black Nutri: checkout. A oferta fica aberta: os botões levam sempre ao checkout da Kiwify. */
const CONFIG = {
  CHECKOUT_BLACK: "https://pay.kiwify.com.br/onjo2mg",// link da oferta Black Nutri na Kiwify (R$ 157,90). Vazio = modo rascunho
};

(() => {
  const d = document;

  d.querySelectorAll("[data-checkout]").forEach((a) => {
    if (CONFIG.CHECKOUT_BLACK) { a.href = CONFIG.CHECKOUT_BLACK; a.rel = "noopener"; }
    else a.href = "#oferta";
  });

  // barra fixa mobile: aparece depois do hero e some na oferta final
  const stick = d.querySelector(".stick"), hero = d.querySelector(".hero"), fim = d.querySelector("#oferta");
  if (stick && hero && fim && "IntersectionObserver" in window) {
    let heroFora = false, naOferta = false;
    const liga = () => stick.classList.toggle("on", heroFora && !naOferta);
    new IntersectionObserver(([e]) => { heroFora = !e.isIntersecting; liga(); }).observe(hero);
    new IntersectionObserver(([e]) => { naOferta = e.isIntersecting; liga(); }, { threshold: 0.25 }).observe(fim);
  }

  if (!CONFIG.CHECKOUT_BLACK) {
    const aviso = d.createElement("div");
    aviso.className = "draft";
    aviso.innerHTML = "<b>RASCUNHO</b> — falta preencher em <code>assets/black.js</code>: CHECKOUT_BLACK";
    d.body.appendChild(aviso);
  }
})();
