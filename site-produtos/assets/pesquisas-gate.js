/* Pop-up de senha das pesquisas. A senha é conferida no servidor (/api/pesquisas); o painel só chega depois do acesso liberado. */
(() => {
  const pagina = document.documentElement.dataset.pg || "index";
  const api = "/api/pesquisas";
  const carregando = document.getElementById("carregando");
  const veu = document.getElementById("veu");
  const form = document.getElementById("form-senha");
  const campo = document.getElementById("senha");
  const erro = document.getElementById("erro");
  const botao = form.querySelector("button");

  async function abrirPainel() {
    const r = await fetch(`${api}?p=${encodeURIComponent(pagina)}`, { credentials: "same-origin", cache: "no-store" });
    if (r.status === 200) {
      const html = await r.text();
      document.open();
      document.write(html);
      document.close();
      return "ok";
    }
    return r.status === 401 ? "senha" : "indisponivel";
  }

  function mostrarPopup(msg) {
    carregando.hidden = true;
    veu.hidden = false;
    if (msg) { erro.textContent = msg; }
    campo.focus();
  }

  abrirPainel().then((s) => { if (s !== "ok") mostrarPopup(s === "indisponivel" ? "Acesso indisponível no momento." : ""); })
    .catch(() => mostrarPopup("Sem conexão. Tente de novo."));

  campo.addEventListener("input", () => { erro.textContent = ""; campo.setAttribute("aria-invalid", "false"); });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const senha = campo.value.trim();
    if (!senha) { erro.textContent = "Digite a senha."; campo.setAttribute("aria-invalid", "true"); campo.focus(); return; }
    botao.disabled = true;
    try {
      const r = await fetch(api, {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: senha }),
      });
      if (r.status === 200) {
        const s = await abrirPainel();
        if (s === "ok") return;
        erro.textContent = "Acesso indisponível no momento.";
      } else if (r.status === 401) {
        erro.textContent = "Senha incorreta. Tente de novo.";
        campo.setAttribute("aria-invalid", "true");
        campo.select();
      } else {
        erro.textContent = "Acesso indisponível no momento.";
      }
    } catch (_) {
      erro.textContent = "Sem conexão. Tente de novo.";
    }
    botao.disabled = false;
  });
})();
