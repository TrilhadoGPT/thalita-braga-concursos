const { createHmac, createDecipheriv, timingSafeEqual } = require("node:crypto");

const SENHA_ENV = "PESQUISAS_SENHA";
const CHAVE_ENV = "PESQUISAS_CHAVE";
const COOKIE = "pesq_acesso";
const COOKIE_MAX_AGE = 7 * 24 * 3600;
const ATRASO_ERRO_MS = 700;
const PAGINAS = new Set(["index", "1", "2", "3"]);

function iguais(a, b) {
  const x = Buffer.from(String(a), "utf8");
  const y = Buffer.from(String(b), "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

function parseBody(body) {
  if (body && typeof body === "object") return body;
  if (typeof body !== "string") return null;
  try { return JSON.parse(body); } catch { return null; }
}

function lerCookie(req, nome) {
  const bruto = (req.headers && req.headers.cookie) || "";
  for (const parte of bruto.split(";")) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i).trim() === nome) return parte.slice(i + 1).trim();
  }
  return "";
}

// o token depende da senha e da chave: trocar qualquer uma das duas derruba os acessos já liberados
function tokenDeAcesso(chave, senha) {
  return createHmac("sha256", Buffer.from(chave, "base64")).update("pesquisas:" + senha).digest("hex");
}

function decifrar(b64, chave) {
  const buf = Buffer.from(b64, "base64");
  const d = createDecipheriv("aes-256-gcm", Buffer.from(chave, "base64"), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}

function createPesquisasHandler(dependencies = {}) {
  const pausa = dependencies.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));

  return async function pesquisasHandler(req, res) {
    const json = (status, corpo) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(corpo));
    };
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");

    const senha = dependencies.senha ?? process.env[SENHA_ENV];
    const chave = dependencies.chave ?? process.env[CHAVE_ENV];
    if (!senha || !chave || Buffer.from(chave, "base64").length !== 32) {
      json(503, { error: "access_not_configured" });
      return;
    }
    const esperado = tokenDeAcesso(chave, senha);

    if (req.method === "POST") {
      const body = parseBody(req.body);
      const enviada = body && typeof body.password === "string" && body.password.length <= 128 ? body.password.trim() : "";
      if (!enviada || !iguais(enviada, senha)) {
        await pausa(ATRASO_ERRO_MS);
        json(401, { error: "invalid_password" });
        return;
      }
      res.setHeader("Set-Cookie", `${COOKIE}=${esperado}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=Lax`);
      json(200, { ok: true });
      return;
    }

    if (req.method === "GET") {
      if (!iguais(lerCookie(req, COOKIE), esperado)) {
        json(401, { error: "unauthorized" });
        return;
      }
      const p = new URL(req.url || "/", "http://localhost").searchParams.get("p") || "";
      if (!PAGINAS.has(p)) {
        json(400, { error: "invalid_page" });
        return;
      }
      let html;
      try {
        const dados = dependencies.dados ?? require("./_pesquisas-dados.js");
        html = decifrar(dados[p], chave);
      } catch {
        json(503, { error: "data_unavailable" });
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(html);
      return;
    }

    res.setHeader("Allow", "GET, POST");
    json(405, { error: "method_not_allowed" });
  };
}

module.exports = createPesquisasHandler();
module.exports.createPesquisasHandler = createPesquisasHandler;
