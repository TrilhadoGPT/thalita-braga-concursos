/* Mentor Nutri — eventos do funil no GTM e registro seguro de cliques no checkout. */
(() => {
  const dl = (window.dataLayer = window.dataLayer || []);

  const PRODUTOS = {
    black: { id: "black-nutri", nome: "Black Nutri", chave: "BLACK", valor: 157.9 },
    transpetro: { id: "transpetro-nutri", nome: "Transpetro Nutri", chave: "TRANSPETRO", valor: 157.9 },
    nutriexpress: { id: "nutriexpress", nome: "NutriExpress", chave: "NUTRIEXPRESS", valor: 97.9 },
    "sus-descomplicado": { id: "sus-descomplicado", nome: "SUS Descomplicado", chave: "SUS", valor: 37.9 },
    portugues: { id: "portugues-concursos", nome: "Português para concursos", chave: "PORTUGUES", valor: 29.9 },
    "virada-da-nutri": { id: "virada-nutri", nome: "Virada da Nutri", chave: "VIRADA", valor: 37 },
    "virada-da-nutri-2": { id: "virada-nutri", nome: "Virada da Nutri", chave: "VIRADA", valor: 37 },
  };
  const POR_CHECKOUT = {
    sus: "sus-descomplicado",
    nutriexpress: "nutriexpress",
    transpetro: "transpetro",
    black: "black",
    portugues: "portugues",
    virada: "virada-da-nutri",
  };

  const pagina = location.pathname.replace(/\/+$/, "").split("/").pop().replace(/\.html$/, "");
  const eventId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];

  // UTMs da visita: se a URL trouxer UTMs, elas valem e ficam guardadas na sessão; se a URL vier sem UTMs
  // (ex.: o visitante abriu o índice e depois uma página de produto), usa as guardadas. Só UTMs, nada pessoal.
  const UTM_CHAVE = "mn_utm";
  const utmsDaUrl = () => {
    const params = new URLSearchParams(location.search || "");
    const encontrados = {};
    UTM_FIELDS.forEach((campo) => { const valor = params.get(campo); if (valor) encontrados[campo] = valor; });
    return encontrados;
  };
  const utmsSalvas = () => {
    try { return JSON.parse(sessionStorage.getItem(UTM_CHAVE) || "{}") || {}; } catch (_) { return {}; }
  };
  const utmsAtuais = () => {
    const daUrl = utmsDaUrl();
    return Object.keys(daUrl).length ? daUrl : utmsSalvas();
  };
  (() => {
    const daUrl = utmsDaUrl();
    if (!Object.keys(daUrl).length) return;
    try { sessionStorage.setItem(UTM_CHAVE, JSON.stringify(daUrl)); } catch (_) { /* sem sessionStorage: segue só com a URL */ }
  })();

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

  // Repasse à Kiwify: a venda passa a trazer sck (= event_id do clique) e as UTMs da visita, para o n8n
  // ligar a venda ao clique (fbp, fbc, anúncio). Parte sempre do link original, então vários cliques não acumulam.
  const anexaRastreioKiwify = (link, idDoEvento, utmsDaVisita) => {
    try {
      const original = link.dataset.hrefOriginal || link.href;
      link.dataset.hrefOriginal = original;
      const url = new URL(original);
      url.searchParams.set("sck", idDoEvento);
      UTM_FIELDS.forEach((campo) => {
        const valor = utmsDaVisita[campo];
        if (valor) url.searchParams.set(campo, valor);
      });
      link.href = url.toString();
    } catch (_) { /* segue para o checkout com o link original */ }
  };

  document.addEventListener("click", (eventoClique) => {
    const link = eventoClique.target.closest && eventoClique.target.closest("[data-checkout]");
    if (!link || !/kiwify/i.test(link.href || "")) return;

    const chave = POR_CHECKOUT[link.dataset.checkout] || pagina;
    const produto = PRODUTOS[chave] || produtoDaPagina;
    if (!produto) return;

    const evento = Object.assign({ event: "initiate_checkout", event_id: eventId() }, dadosProduto(produto));
    dl.push(evento);
    const utmsDaVisita = utmsAtuais();
    const utms = Object.fromEntries(UTM_FIELDS.map((field) => [field, utmsDaVisita[field] || null]));
    anexaRastreioKiwify(link, evento.event_id, utmsDaVisita);

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

  // Navegação interna (ex.: índice -> página de produto): leva as UTMs guardadas no link, para não se perderem.
  document.addEventListener("click", (eventoClique) => {
    const link = eventoClique.target.closest && eventoClique.target.closest("a[href]");
    if (!link || link.hasAttribute("data-checkout") || link.origin !== location.origin) return;
    if (link.pathname === location.pathname || /^(javascript:|#)/i.test(link.getAttribute("href") || "")) return;
    const salvas = utmsAtuais();
    if (!Object.keys(salvas).length) return;
    try {
      const url = new URL(link.href);
      if (UTM_FIELDS.some((campo) => url.searchParams.has(campo))) return;
      UTM_FIELDS.forEach((campo) => { if (salvas[campo]) url.searchParams.set(campo, salvas[campo]); });
      link.href = url.toString();
    } catch (_) { /* segue com o link original */ }
  }, true);

  window.mnTrack = {
    lead() {
      dl.push({ event: "generate_lead", event_id: eventId(), content_name: "Aulas ao vivo" });
    },
  };
})();
