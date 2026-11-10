(() => {
  const trigger = document.querySelector("#bonus-trigger");
  const form = document.querySelector("#bonus-access");
  const input = document.querySelector("#access-code");
  const submit = document.querySelector("#access-submit");
  const message = document.querySelector("#access-message");
  const materialLink = document.querySelector("#material-link");
  const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
  const incomingParams = new URLSearchParams(window.location.search);
  const utms = Object.fromEntries(UTM_FIELDS.map((field) => [field, incomingParams.get(field)]));

  const appendUtms = (url) => {
    const destination = new URL(url, window.location.origin);
    for (const [key, value] of Object.entries(utms)) {
      if (value) destination.searchParams.set(key, value.slice(0, 200));
    }
    return destination.href;
  };

  materialLink.href = appendUtms(materialLink.href);

  trigger.addEventListener("click", () => {
    const opening = form.hidden;
    form.hidden = !opening;
    trigger.setAttribute("aria-expanded", String(opening));
    if (opening) input.focus();
  });

  input.addEventListener("input", () => {
    input.removeAttribute("aria-invalid");
    form.classList.remove("is-error");
    message.textContent = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    form.classList.remove("is-error");
    input.removeAttribute("aria-invalid");
    message.textContent = "";
    submit.disabled = true;
    submit.firstChild.textContent = "Verificando… ";

    try {
      const response = await fetch("/api/material-aula-09-nov-26", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input.value, utms }),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = await response.json();

      if (response.status === 401) {
        message.textContent = "Senha incorreta";
        input.setAttribute("aria-invalid", "true");
        form.classList.remove("is-error");
        void form.offsetWidth;
        form.classList.add("is-error");
        input.focus();
        input.select();
        return;
      }
      if (!response.ok || typeof result.redirect !== "string") {
        message.textContent = "Não foi possível validar agora. Tente novamente em instantes.";
        return;
      }

      window.location.replace(result.redirect);
    } catch {
      message.textContent = "Falha de conexão. Verifique sua internet e tente novamente.";
    } finally {
      submit.disabled = false;
      submit.firstChild.textContent = "Acessar ";
    }
  });
})();
