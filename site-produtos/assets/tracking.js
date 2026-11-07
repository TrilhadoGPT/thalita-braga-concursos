/* Mentor Nutri — eventos do funil no GTM e registro seguro de cliques no checkout. */
(() => {
  const dl = (window.dataLayer = window.dataLayer || []);

  const PRODUTOS = {
    black: { id: "black-nutri", nome: "Black Nutri", chave: "BLACK", valor: 157.9 },
    transpetro: { id: "transpetro-nutri", nome: "Transpetro Nutri", chave: "TRANSPETRO", valor: 157.9 },
    nutriexpress: { id: "nutriexpress", nome: "NutriExpress", chave: "NUTRIEXPRESS", valor: 97.9 },
    "sus-descomplicado": { id: "sus-descomplicado", nome: "SUS Descomplicado", chave: "SUS", valor: 37.9 },
    portugues: { id: "portugues-concursos", nome: "Português para concursos", chave: "PORTUGUES", valor: 29.9 },
  };
  const POR_CHECKOUT = {
    sus: "sus-descomplicado",
    nutriexpress: "nutriexpress",
    transpetro: "transpetro",
    black: "black",
    portugues: "portugues",
  };

  const pagina = location.pathname.replace(/\/+$/, "").split("/").pop().replace(/\.html$/, "");
  const eventId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];

  const cookieValue = (name) => {
    const cookie = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(name + "="));
    if (!cookie) return null;
    const value = cookie.slice(name.length + 1);
    try { return decodeURIComponent(value); } catch (_) { return value; }
  };

  const valorDe = (produto) => {
    try {
      const texto = typeof CONFIG !== "undefined" ? CONFIG["PRECO_" + produto.chave] : null;
      if (texto) {
        const valor = parseFloat(String(texto).replace(/\./g, "").replace(",", "."));
        if (valor > 0) return valor;
      }
    } catch (_) { /* usa o valor de reserva */ }
    return produto.valor;
  };

  const dadosProduto = (produto) => ({
    content_name: produto.nome,
    content_id: produto.id,
    content_type: "product",
    value: valorDe(produto),
    currency: "BRL",
  });

  const produtoDaPagina = PRODUTOS[pagina];
  if (produtoDaPagina) {
    dl.push(Object.assign({ event: "view_content", event_id: eventId() }, dadosProduto(produtoDaPagina)));
  }

  document.addEventListener("click", (eventoClique) => {
    const link = eventoClique.target.closest && eventoClique.target.closest("[data-checkout]");
    if (!link || !/kiwify/i.test(link.href || "")) return;

    const chave = POR_CHECKOUT[link.dataset.checkout] || pagina;
    const produto = PRODUTOS[chave] || produtoDaPagina;
    if (!produto) return;

    const evento = Object.assign({ event: "initiate_checkout", event_id: eventId() }, dadosProduto(produto));
    dl.push(evento);
    const params = new URLSearchParams(location.search || "");
    const utms = Object.fromEntries(UTM_FIELDS.map((field) => [field, params.get(field)]));

    try {
      void fetch("/api/checkout-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        keepalive: true,
        body: JSON.stringify({
          event_id: evento.event_id,
          product_id: produto.id,
          value: evento.value,
          page: location.pathname,
          currency: evento.currency,
          fbp: cookieValue("_fbp"),
          fbc: cookieValue("_fbc"),
          utm_source: utms.utm_source,
          utm_medium: utms.utm_medium,
          utm_campaign: utms.utm_campaign,
          utm_term: utms.utm_term,
          utm_content: utms.utm_content,
          utm_id: utms.utm_id,
        }),
      }).catch(() => { /* o clique segue mesmo se o registro falhar */ });
    } catch (_) { /* o clique nunca deve falhar por causa do rastreamento */ }
  }, true);

  window.mnTrack = {
    lead() {
      dl.push({ event: "generate_lead", event_id: eventId(), content_name: "Aulas ao vivo" });
    },
  };
})();
