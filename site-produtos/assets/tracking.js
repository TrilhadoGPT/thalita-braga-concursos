/* Mentor Nutri — eventos de rastreamento (GTM-WM3X2795 / Pixel da Meta via GTM).
   Este arquivo só empurra eventos para o dataLayer; as tags ficam no GTM.
   Não envia e-mail, telefone nem qualquer dado pessoal. */
(() => {
  const dl = (window.dataLayer = window.dataLayer || []);

  // Produtos rastreados. A chave é o nome da página (sem .html). O valor vem do CONFIG do site quando existir;
  // o "valor" abaixo é só o reserva (Black Nutri não tem preço no CONFIG).
  const PRODUTOS = {
    "black": { id: "black-nutri", nome: "Black Nutri", chave: "BLACK", valor: 157.9 },
    "transpetro": { id: "transpetro-nutri", nome: "Transpetro Nutri", chave: "TRANSPETRO", valor: 157.9 },
    "nutriexpress": { id: "nutriexpress", nome: "NutriExpress", chave: "NUTRIEXPRESS", valor: 97.9 },
    "sus-descomplicado": { id: "sus-descomplicado", nome: "SUS Descomplicado", chave: "SUS", valor: 37.9 },
  };
  // valor do atributo data-checkout -> página/produto
  const POR_CHECKOUT = { sus: "sus-descomplicado", nutriexpress: "nutriexpress", transpetro: "transpetro", black: "black" };

  const pagina = location.pathname.replace(/\/+$/, "").split("/").pop().replace(/\.html$/, "");
  const eventId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const valorDe = (p) => {
    try {
      // CONFIG é uma const global criada em app.js/black.js (não fica em window)
      const txt = typeof CONFIG !== "undefined" ? CONFIG["PRECO_" + p.chave] : null;
      if (txt) { const n = parseFloat(String(txt).replace(/\./g, "").replace(",", ".")); if (n > 0) return n; }
    } catch (_) { /* usa o valor reserva */ }
    return p.valor;
  };

  const dadosProduto = (p) => ({
    content_name: p.nome,
    content_id: p.id,
    content_type: "product",
    value: valorDe(p),
    currency: "BRL",
  });

  // 1) ViewContent: ao abrir a página de um produto
  const produtoDaPagina = PRODUTOS[pagina];
  if (produtoDaPagina) {
    dl.push(Object.assign({ event: "view_content", event_id: eventId() }, dadosProduto(produtoDaPagina)));
  }

  // 2) InitiateCheckout: clique em qualquer botão de checkout (só quando o link já aponta para a Kiwify)
  document.addEventListener("click", (ev) => {
    const a = ev.target.closest && ev.target.closest("[data-checkout]");
    if (!a || !/kiwify/i.test(a.href || "")) return;
    const chave = POR_CHECKOUT[a.dataset.checkout] || pagina;
    const p = PRODUTOS[chave] || produtoDaPagina;
    if (!p) return;
    dl.push(Object.assign({ event: "initiate_checkout", event_id: eventId() }, dadosProduto(p)));
  }, true);

  // 3) Lead: chamado por app.js depois que o e-mail da página de aulas ao vivo é validado
  window.mnTrack = {
    lead() {
      dl.push({ event: "generate_lead", event_id: eventId(), content_name: "Aulas ao vivo" });
    },
  };
})();
