/* Mentor Nutri — configuração e comportamento compartilhados.
   Preencha o CONFIG abaixo; o resto da página se ajusta sozinho. */
const CONFIG = {
  // Aulas ao vivo
  GRUPO_URL: "https://chat.whatsapp.com/IQTNNPmhDBM5peLOrhhs4X",            // link do grupo (ex.: https://chat.whatsapp.com/XXXX). Vazio = modo rascunho
  WEBHOOK_URL: "https://gancho.trilhadogpt.com/webhook/4b39b515-3f92-4474-b366-01a55e99849f", // recebe {email, origem, em}; sem nome ou telefone
  LIVE_DIA: 1,              // dia da semana das lives (0=dom ... 1=segunda ... 6=sáb)
  LIVE_HORA: 19,            // horário de início, horário de São Paulo (GMT-3)
  LIVE_QTD: 3,              // quantas datas aparecem na lista
  LIVE_PULAR: [],           // datas sem live, formato "AAAA-MM-DD" (ex.: feriados)

  // Materiais
  CHECKOUT_NUTRIEXPRESS: "https://pay.kiwify.com.br/ofIKz0k", // link do checkout do NutriExpress
  CHECKOUT_SUS: "https://pay.kiwify.com.br/ya8JYEI",
  CHECKOUT_TRANSPETRO: "https://pay.kiwify.com.br/kiOu78t",  // link do checkout do Transpetro Nutri
  PRECO_NUTRIEXPRESS: "97,90",
  PRECO_TRANSPETRO: "157,90",
  PRECO_SUS: "37,90",

  // Combo NutriExpress + SUS + Aulão (oferta válida até 30/10/2026 ao meio-dia)
  CHECKOUT_COMBO: "https://pay.kiwify.com.br/2BpeYjJ", // oferta do combo na Kiwify (R$ 97,00)
  PRECO_COMBO: "97,00",
  COMBO_FIM: "2026-10-30T15:00:00Z", // 12:00 de 30/10/2026 em São Paulo (GMT-3). Só vale se o checkout sair do ar nesse horário
};

(() => {
  const d = document;
  d.documentElement.classList.add("js");
  const faltando = [];

  // oferta do combo encerrada: troca o botão pelo NutriExpress e esconde as linhas de prazo
  const comboEncerrado = !!CONFIG.COMBO_FIM && Date.now() > Date.parse(CONFIG.COMBO_FIM);
  if (comboEncerrado) {
    d.querySelectorAll("[data-prazo]").forEach((el) => { el.hidden = true; });
    d.querySelectorAll("[data-prazo-faq]").forEach((el) => { el.textContent = "A oferta de R$ 97 foi encerrada em 30/10/2026."; });
    d.querySelectorAll('[data-checkout="combo"]').forEach((a) => {
      a.dataset.checkout = "nutriexpress";
      a.innerHTML = 'Oferta encerrada. Ver o NutriExpress <svg aria-hidden="true"><use href="#i-arrow"/></svg>';
    });
    d.querySelectorAll('[data-preco="combo"]').forEach((el) => { el.dataset.preco = "nutriexpress"; });
  }

  // links de checkout
  d.querySelectorAll("[data-checkout]").forEach((a) => {
    const chave = "CHECKOUT_" + a.dataset.checkout.toUpperCase();
    if (CONFIG[chave]) { a.href = CONFIG[chave]; a.rel = "noopener"; }
    else {
      a.href = "#oferta";
      if (!faltando.includes(chave)) faltando.push(chave);
    }
  });

  // preços
  d.querySelectorAll("[data-preco]").forEach((el) => {
    const v = CONFIG["PRECO_" + el.dataset.preco.toUpperCase()];
    const [reais, cent] = v.split(",");
    el.innerHTML = `<sup>R$</sup>${reais}<small>,${cent || "00"}</small>`;
  });

  // barra fixa mobile: aparece após o hero e some na oferta final
  const stick = d.querySelector(".stick");
  const hero = d.querySelector(".hero");
  if (stick && hero && "IntersectionObserver" in window) {
    let heroFora = false, fim = false;
    const atualiza = () => stick.classList.toggle("on", heroFora && !fim);
    new IntersectionObserver(([e]) => { heroFora = !e.isIntersecting; atualiza(); }, { threshold: 0 }).observe(hero);
    const fimEl = d.querySelector("#oferta, #oferta-final");
    d.querySelectorAll("#oferta, #oferta-final").forEach((el) =>
      new IntersectionObserver(([e]) => { fim = e.isIntersecting; atualiza(); }, { threshold: 0.25 }).observe(el));
    void fimEl;
  }

  // revelação suave ao rolar
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    d.querySelectorAll(".reveal").forEach((el) => io.observe(el));
  } else d.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));

  // próximas lives: sempre as N próximas ocorrências do dia/hora configurados, em horário de São Paulo (GMT-3).
  // Quando a live do dia começa, ela sai da lista, as demais sobem e uma nova entra na última posição.
  const lista = d.querySelector("[data-lives]");
  if (lista) {
    const SP = 3 * 3600e3;                                   // São Paulo = UTC-3 (sem horário de verão)
    const agoraSP = new Date(Date.now() - SP);               // campos UTC deste objeto = relógio de São Paulo
    const dias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const pad = (n) => String(n).padStart(2, "0");
    let falta = (CONFIG.LIVE_DIA - agoraSP.getUTCDay() + 7) % 7;
    if (falta === 0 && agoraSP.getUTCHours() >= CONFIG.LIVE_HORA) falta = 7;
    const datas = [];
    for (let i = 0, k = 0; datas.length < CONFIG.LIVE_QTD && k < 60; k++) {
      const dt = new Date(Date.UTC(agoraSP.getUTCFullYear(), agoraSP.getUTCMonth(), agoraSP.getUTCDate() + falta + i * 7));
      i++;
      const iso = `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
      if (!CONFIG.LIVE_PULAR.includes(iso)) datas.push(`<li><span>${dias[dt.getUTCDay()]}, ${pad(dt.getUTCDate())}/${pad(dt.getUTCMonth() + 1)}</span><b>${CONFIG.LIVE_HORA}h</b></li>`);
    }
    lista.innerHTML = datas.join("");
  }

  // formulário de cadastro
  const form = d.querySelector("#cadastro");
  if (form) {
    if (!CONFIG.GRUPO_URL) faltando.push("GRUPO_URL");
    if (!CONFIG.WEBHOOK_URL) faltando.push("WEBHOOK_URL");
    const campos = { email: form.elements.email };
    const erro = (el, msg) => {
      const alvo = d.getElementById(el.id + "-erro");
      alvo.textContent = msg || "";
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      return !msg;
    };
    const valida = {
      email: () => {
        const email = campos.email.value.trim();
        const arroba = email.indexOf("@");
        const ponto = email.lastIndexOf(".");
        return erro(campos.email, arroba > 0 && ponto > arroba + 1 && ponto < email.length - 1 ? "" : "Digite um e-mail válido.");
      },
    };
    Object.keys(valida).forEach((k) => campos[k].addEventListener("blur", valida[k]));

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const ok = valida.email();
      if (!ok) { form.querySelector("[aria-invalid=true]")?.focus(); return; }
      const btn = form.querySelector("button[type=submit]");
      const rotulo = btn.querySelector("span");
      btn.disabled = true; rotulo.textContent = "Enviando...";
      const dados = {
        email: campos.email.value.trim(), origem: "aulas-ao-vivo", em: new Date().toISOString(),
      };
      if (CONFIG.WEBHOOK_URL) {
        try {
          await Promise.race([
            fetch(CONFIG.WEBHOOK_URL, { method: "POST", mode: "no-cors", keepalive: true,
              body: new URLSearchParams(dados) }),
            new Promise((r) => setTimeout(r, 4000)),
          ]);
        } catch (_) { /* o cadastro não deve travar a entrada no grupo */ }
      }
      d.querySelector("#estado-form").hidden = true;
      const ok2 = d.querySelector("#estado-ok");
      ok2.hidden = false; ok2.focus();
      const abrir = d.querySelector("#abrir-grupo");
      if (CONFIG.GRUPO_URL) {
        abrir.href = CONFIG.GRUPO_URL;
        setTimeout(() => { location.href = CONFIG.GRUPO_URL; }, 1400);
      } else {
        abrir.hidden = true;
        d.querySelector("#ok-msg").textContent = "Cadastro recebido. O link do grupo ainda não foi configurado nesta página.";
      }
    });
  }

  // aviso de rascunho enquanto faltar configuração
  if (faltando.length) {
    const aviso = d.createElement("div");
    aviso.className = "draft";
    aviso.innerHTML = `<b>RASCUNHO</b> — falta preencher em <code>assets/app.js</code>: ${faltando.join(", ")}`;
    d.body.appendChild(aviso);
  }
})();
