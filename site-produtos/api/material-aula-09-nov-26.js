const { timingSafeEqual } = require("node:crypto");

const PASSWORD_ENV = "MATERIAL_AULA_09_NOV_26_PASSWORD";
const REDIRECT_ENV = "MATERIAL_AULA_09_NOV_26_REDIRECT_URL";
const UTM_FIELDS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

function safeEqual(left, right) {
  const a = Buffer.from(left, "utf8");
  const b = Buffer.from(right, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseBody(body) {
  if (body && typeof body === "object") return body;
  if (typeof body !== "string") return null;
  try { return JSON.parse(body); } catch { return null; }
}

function createMaterialRedirectHandler(configuration = {}) {
  return function materialRedirectHandler(req, res) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      res.statusCode = 405;
      res.end(JSON.stringify({ error: "method_not_allowed" }));
      return;
    }

    const expectedPassword = configuration.password ?? process.env[PASSWORD_ENV];
    const redirectValue = configuration.redirectUrl ?? process.env[REDIRECT_ENV];
    if (!expectedPassword || !redirectValue) {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: "access_not_configured" }));
      return;
    }

    let redirectUrl;
    try {
      redirectUrl = new URL(redirectValue);
      if (redirectUrl.protocol !== "https:" || redirectUrl.hostname !== "drive.google.com" || redirectUrl.username || redirectUrl.password || !redirectUrl.pathname.startsWith("/drive/folders/")) {
        throw new Error("Invalid redirect URL");
      }
    } catch {
      res.statusCode = 503;
      res.end(JSON.stringify({ error: "invalid_redirect_configuration" }));
      return;
    }

    const body = parseBody(req.body);
    const submittedPassword = body && typeof body.password === "string" && body.password.length <= 1024
      ? body.password
      : "";
    if (!safeEqual(submittedPassword, expectedPassword)) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "invalid_password" }));
      return;
    }

    const submittedUtms = body && body.utms && typeof body.utms === "object" ? body.utms : {};
    for (const field of UTM_FIELDS) {
      const value = submittedUtms[field];
      if (typeof value === "string" && value.length > 0) redirectUrl.searchParams.set(field, value.slice(0, 200));
    }

    res.statusCode = 200;
    res.end(JSON.stringify({ redirect: redirectUrl.href }));
  };
}

module.exports = createMaterialRedirectHandler();
module.exports.createMaterialRedirectHandler = createMaterialRedirectHandler;
