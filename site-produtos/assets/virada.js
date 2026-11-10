/* Mentor Nutri — Virada da Nutri: lotes, contagem, luz nos boxes e fluxo. Roda depois de app.js e tracking.js. */
(() => {
  const d = document;
  if (typeof CONFIG === "undefined" || !CONFIG.LOTES_VIRADA) return;
  const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, "0");
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- lotes (horário de São Paulo) ---------- */
  const lotes = CONFIG.LOTES_VIRADA.map((l) => Object.assign({}, l, { t: Date.parse(l.fim) }));
  const idx = lotes.findIndex((l) => Date.now() < l.t);
  const encerrado = idx === -1;
  const atual = encerrado ? null : lotes[idx];

  const texto = (sel, v) => $$(sel).forEach((el) => { el.textContent = v; });
  if (!encerrado) {
    texto("[data-lote-n]", String(atual.n));
    texto("[data-lote-linha]", `Lote ${atual.n} até ${atual.rotulo}`);
    texto("[data-count-label]", idx === lotes.length - 1 ? "A inscrição termina em" : `O Lote ${atual.n} termina em`);
    /* preço do lote atual e do próximo (hero e faixa do meio) */
    const brl = (p) => String(p).replace(/,00$/, "");
    const prox = lotes[idx + 1];
    texto("[data-p-now]", brl(atual.preco));
    texto("[data-lote-fim]", atual.rotulo);
    $$("[data-p-next]").forEach((el) => {
      el.innerHTML = prox ? `Próximo lote: <b>R$ ${brl(prox.preco)}</b>` : "Último lote";
    });
  }
  const estado = (n) => (encerrado || n < atual.n ? "is-past" : n === atual.n ? "is-now" : "is-next");
  const rotuloEstado = { "is-past": "Encerrado", "is-now": "Valendo agora", "is-next": "Em seguida" };
  $$("[data-lote]").forEach((el) => {
    const e = estado(Number(el.dataset.lote));
    el.classList.remove("is-past", "is-now", "is-next");
    el.classList.add(e);
    const st = el.querySelector("[data-status]");
    if (st) st.textContent = rotuloEstado[e];
  });

  /* contagem regressiva até o fim do lote */
  const relogios = $$("[data-countdown]");
  if (!encerrado && relogios.length) {
    const tick = () => {
      const diff = atual.t - Date.now();
      if (diff <= 0) { location.reload(); return; }
      const s = Math.floor(diff / 1000);
      const dias = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
      const out = `${dias ? dias + "d " : ""}${pad(h)}h ${pad(m)}min ${pad(seg)}s`;
      relogios.forEach((el) => { el.textContent = out; });
    };
    tick();
    setInterval(tick, 1000);
  }

  /* inscrições encerradas: o botão deixa de levar ao checkout */
  if (encerrado) {
    $$("[data-v-prazo]").forEach((el) => { el.hidden = true; });
    $$('[data-checkout="virada"]').forEach((a) => {
      a.removeAttribute("data-checkout");
      a.removeAttribute("rel");
      a.href = "#faq";
      a.classList.add("is-off");
      a.setAttribute("aria-disabled", "true");
      a.innerHTML = "Inscrições encerradas";
    });
    texto("[data-lote-linha]", "Inscrições encerradas");
  }

  /* ---------- luz que segue o cursor nas seções de fundo claro ---------- */
  $$(".v-lite").forEach((sec) => {
    sec.addEventListener("pointermove", (ev) => {
      const r = sec.getBoundingClientRect();
      sec.style.setProperty("--sx", `${ev.clientX - r.left}px`);
      sec.style.setProperty("--sy", `${ev.clientY - r.top}px`);
      sec.classList.add("is-hot");
    });
    sec.addEventListener("pointerleave", () => sec.classList.remove("is-hot"));
  });

  /* ---------- luz que segue o cursor nos boxes ---------- */
  $$(".spot").forEach((el) => {
    el.addEventListener("pointermove", (ev) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${ev.clientX - r.left}px`);
      el.style.setProperty("--my", `${ev.clientY - r.top}px`);
    });
  });

  /* ---------- fluxo: a linha avança com a rolagem ---------- */
  const flow = d.querySelector(".flow");
  if (flow) {
    const itens = $$("li", flow);
    const horizontal = () => matchMedia("(min-width: 880px)").matches;
    let ocupado = false;
    const medir = () => {
      ocupado = false;
      const r = flow.getBoundingClientRect(), vh = innerHeight;
      let p;
      if (reduz) p = 1;
      else if (horizontal()) p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5)));
      else p = Math.min(1, Math.max(0, (vh * 0.65 - r.top) / r.height));
      flow.style.setProperty("--p", p.toFixed(3));
      itens.forEach((li, i) => li.classList.toggle("on", reduz || p >= (i + 0.2) / itens.length));
    };
    const pedir = () => { if (!ocupado) { ocupado = true; requestAnimationFrame(medir); } };
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    medir();
  }

  /* ---------- marca-texto da primeira dobra ---------- */
  requestAnimationFrame(() => setTimeout(() => d.querySelectorAll(".mk-hero").forEach((el) => el.classList.add("mk-run")), 350));
})();
