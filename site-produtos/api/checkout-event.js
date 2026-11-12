const WEBHOOK_HOST = "gancho.trilhadogpt.com";
const WEBHOOK_PATH_PREFIX = "/webhook/";
const WEBHOOK_TIMEOUT_MS = 5_000;
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"];

function sanitizeCookie(value) {
  return typeof value === "string" && value.length <= 255 && /^[A-Za-z0-9._:%-]+$/.test(value) ? value : null;
}

function sanitizeUtm(value) {
  if (typeof value !== "string") return null;
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 200);
  return clean || null;
}

// Classe do aparelho e do app de origem, deduzidas do cabeçalho do navegador no servidor.
// Só a classe é repassada (nunca o texto bruto do navegador). Os nomes do aparelho seguem os do Meta
// (impression_device) para dar para comparar com o Gerenciador de Anúncios.
function classifyDevice(userAgent) {
  if (typeof userAgent !== "string" || !userAgent) return null;
  if (/iPhone|iPod/i.test(userAgent)) return "iphone";
  if (/iPad/i.test(userAgent)) return "ipad";
  if (/Android/i.test(userAgent)) return /Mobile/i.test(userAgent) ? "android_smartphone" : "android_tablet";
  if (/Windows|Macintosh|X11|Linux|CrOS/i.test(userAgent)) return "desktop";
  return "outro";
}

function classifyApp(userAgent) {
  if (typeof userAgent !== "string" || !userAgent) return null;
  if (/Instagram/i.test(userAgent)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(userAgent)) return "facebook";
  return "navegador";
}

const PRODUCTS = Object.freeze({
  "black-nutri": { name: "Black Nutri", page: "/black" },
  "transpetro-nutri": { name: "Transpetro Nutri", page: "/transpetro" },
  nutriexpress: { name: "NutriExpress", page: "/nutriexpress" },
  "sus-descomplicado": { name: "SUS Descomplicado", page: "/sus-descomplicado" },
  "portugues-concursos": { name: "Português para concursos", page: "/portugues" },
  "virada-nutri": { name: "Virada da Nutri", page: "/virada-da-nutri" },
});

function createCheckoutEventHandler(dependencies = {}) {
  return async function checkoutEventHandler(request, response) {
    response.setHeader("Cache-Control", "no-store");

    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      response.statusCode = 405;
      response.end("Método não permitido.");
      return;
    }

    const body = request.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      response.statusCode = 400;
      response.end("Evento inválido.");
      return;
    }

    const product = PRODUCTS[body.product_id];
    if (!product || typeof body.event_id !== "string" || !/^[a-z0-9_-]{6,64}$/i.test(body.event_id)) {
      response.statusCode = 400;
      response.end("Evento inválido.");
      return;
    }
    if (typeof body.value !== "number" || !Number.isFinite(body.value) || body.value < 0 || body.value > 100000) {
      response.statusCode = 400;
      response.end("Evento inválido.");
      return;
    }

    const webhookUrl = dependencies.webhookUrl ?? process.env.CHECKOUT_TRACKING_WEBHOOK_URL;
    let parsedWebhookUrl;
    try {
      parsedWebhookUrl = new URL(webhookUrl);
    } catch {
      response.statusCode = 503;
      response.end("Rastreamento temporariamente indisponível.");
      return;
    }

    if (parsedWebhookUrl.protocol !== "https:" ||
        parsedWebhookUrl.hostname !== WEBHOOK_HOST ||
        !parsedWebhookUrl.pathname.startsWith(WEBHOOK_PATH_PREFIX) ||
        parsedWebhookUrl.search || parsedWebhookUrl.hash ||
        parsedWebhookUrl.username || parsedWebhookUrl.password) {
      response.statusCode = 503;
      response.end("Rastreamento temporariamente indisponível.");
      return;
    }

    const fetchImpl = dependencies.fetchImpl ?? globalThis.fetch;
    const now = dependencies.now ?? (() => new Date());
    const event = {
      event: "initiate_checkout",
      event_id: body.event_id,
      product_id: body.product_id,
      product_name: product.name,
      page: product.page,
      value: body.value,
      currency: "BRL",
      fbp: sanitizeCookie(body.fbp),
      fbc: sanitizeCookie(body.fbc),
      device: classifyDevice(request.headers && request.headers["user-agent"]),
      app: classifyApp(request.headers && request.headers["user-agent"]),
      timestamptz: now().toISOString(),
    };
    for (const field of UTM_FIELDS) event[field] = sanitizeUtm(body[field]);

    try {
      const webhookResponse = await fetchImpl(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
        redirect: "error",
        signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
      });
      if (!webhookResponse.ok) {
        response.statusCode = 502;
        response.end("Não foi possível registrar o clique.");
        return;
      }
    } catch {
      response.statusCode = 502;
      response.end("Não foi possível registrar o clique.");
      return;
    }

    response.statusCode = 204;
    response.end();
  };
}

module.exports = createCheckoutEventHandler();
module.exports.createCheckoutEventHandler = createCheckoutEventHandler;
