const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

let createCheckoutEventHandler;
try {
  ({ createCheckoutEventHandler } = require("../site-produtos/api/checkout-event.js"));
} catch {}

function responseStub() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(body = "") { this.body = body; this.ended = true; },
  };
}

const webhookUrl = "https://gancho.trilhadogpt.com/webhook/test-token";
const time = new Date("2026-11-06T12:34:56.000Z");

function handlerOrFail() {
  assert.equal(typeof createCheckoutEventHandler, "function");
  return createCheckoutEventHandler;
}

test("POST forwards a minimal checkout event to the configured webhook", async () => {
  const create = handlerOrFail();
  const calls = [];
  const handler = create({
    webhookUrl,
    now: () => time,
    fetchImpl: async (...args) => { calls.push(args); return { ok: true, status: 204 }; },
  });
  const response = responseStub();
  await handler({
    method: "POST",
    body: {
      event_id: "evt-abc123",
      product_id: "portugues-concursos",
      value: 29.9,
      page: "/portugues",
      currency: "BRL",
      fbp: "fb.1.123.456",
      fbc: "fb.1.123.click-789",
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "launch",
      utm_term: "exam",
      utm_content: "story",
      utm_id: "campaign-2026",
      email: "must-not-forward",
      user_agent: "must-not-forward",
      url: "must-not-forward",
      referrer: "must-not-forward",
      extra_tracking: "must-not-forward",
    },
  }, response);

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], webhookUrl);
  assert.equal(calls[0][1].method, "POST");
  assert.deepEqual(calls[0][1].headers, { "Content-Type": "application/json" });
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    event: "initiate_checkout",
    event_id: "evt-abc123",
    product_id: "portugues-concursos",
    product_name: "Português para concursos",
    page: "/portugues",
    value: 29.9,
    currency: "BRL",
    fbp: "fb.1.123.456",
    fbc: "fb.1.123.click-789",
    utm_source: "instagram",
    utm_medium: "social",
    utm_campaign: "launch",
    utm_term: "exam",
    utm_content: "story",
    utm_id: "campaign-2026",
    timestamptz: time.toISOString(),
  });
  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["cache-control"], "no-store");
});

test("rejects non-POST requests without calling the webhook", async () => {
  const create = handlerOrFail();
  let calls = 0;
  const handler = create({ webhookUrl, fetchImpl: async () => { calls += 1; return { ok: true }; } });
  const response = responseStub();
  await handler({ method: "GET" }, response);
  assert.equal(calls, 0);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "POST");
});

test("rejects unknown products and malformed event identifiers", async () => {
  const create = handlerOrFail();
  let calls = 0;
  const handler = create({ webhookUrl, fetchImpl: async () => { calls += 1; return { ok: true }; } });
  for (const body of [
    { event_id: "evt-abc123", product_id: "unknown" },
    { event_id: "bad id", product_id: "portugues-concursos" },
  ]) {
    const response = responseStub();
    await handler({ method: "POST", body }, response);
    assert.equal(response.statusCode, 400);
  }
  assert.equal(calls, 0);
});

test("does not call webhook when the secret is missing or invalid", async () => {
  const create = handlerOrFail();
  let calls = 0;
  const body = { event_id: "evt-abc123", product_id: "portugues-concursos", value: 29.9 };
  for (const webhookUrl of ["", "http://gancho.trilhadogpt.com/webhook/x", "https://example.com/webhook/x"]) {
    const handler = create({ webhookUrl, fetchImpl: async () => { calls += 1; return { ok: true }; } });
    const response = responseStub();
    await handler({ method: "POST", body }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.headers.location, undefined);
  }
  assert.equal(calls, 0);
});

test("returns 502 when the webhook rejects the event", async () => {
  const create = handlerOrFail();
  const handler = create({ webhookUrl, fetchImpl: async () => ({ ok: false, status: 503 }) });
  const response = responseStub();
  await handler({ method: "POST", body: { event_id: "evt-abc123", product_id: "portugues-concursos", value: 29.9 } }, response);
  assert.equal(response.statusCode, 502);
  assert.equal(response.body.includes(webhookUrl), false);
});

test("Portuguese page and runtime agree on R$29,90", () => {
  const root = path.join(__dirname, "..", "site-produtos");
  const page = fs.readFileSync(path.join(root, "portugues.html"), "utf8");
  const app = fs.readFileSync(path.join(root, "assets/app.js"), "utf8");
  assert.equal((page.match(/29<small>,90<\/small>/g) || []).length, 2);
  assert.equal(/PRECO_PORTUGUES:\s*["']29,90["']/.test(app), true);
});

test("browser tracker sends checkout events only to the same-origin API", () => {
  const root = path.join(__dirname, "..", "site-produtos");
  const source = fs.readFileSync(path.join(root, "assets/tracking.js"), "utf8");
  assert.equal(/https?:\/\/gancho\.trilhadogpt\.com/.test(source), false);
  assert.equal(/navigator\.userAgent|document\.referrer/.test(source), false);
  assert.equal(/fetch\(["']\/api\/checkout-event["']/.test(source), true);

  let click;
  const requests = [];
  const window = {};
  const document = {
    cookie: "_fbp=fb.1.123.456; _fbc=fb.1.123.click-789",
    addEventListener(type, fn) { if (type === "click") click = fn; },
  };
  const context = {
    window, document,
    location: { pathname: "/portugues", search: "?utm_source=instagram&utm_medium=social&utm_campaign=launch&utm_term=exam&utm_content=story&utm_id=campaign-2026&email=not-forwarded", hostname: "example.test" },
    CONFIG: { PRECO_PORTUGUES: "29,90" },
    Date, Math, URLSearchParams,
    fetch: async (...args) => { requests.push(args); return { ok: true }; },
  };
  vm.runInNewContext(source, context);
  assert.equal(window.dataLayer[0].event, "view_content");
  assert.equal(window.dataLayer[0].value, 29.9);
  click({ target: { closest: () => ({ href: "https://pay.kiwify.com.br/test", dataset: { checkout: "portugues" } }) } });
  assert.equal(requests.length, 1);
  assert.equal(requests[0][0], "/api/checkout-event");
  const payload = JSON.parse(requests[0][1].body);
  assert.deepEqual(Object.keys(payload).sort(), ["event_id", "page", "product_id", "value", "currency", "fbp", "fbc", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"].sort());
  assert.equal(payload.product_id, "portugues-concursos");
  assert.equal(payload.value, 29.9);
  assert.equal(payload.page, "/portugues");
  assert.equal(payload.currency, "BRL");
  assert.equal(payload.fbp, "fb.1.123.456");
  assert.equal(payload.fbc, "fb.1.123.click-789");
  assert.equal(payload.utm_source, "instagram");
  assert.equal(payload.utm_campaign, "launch");
  assert.equal("email" in payload, false);
});
