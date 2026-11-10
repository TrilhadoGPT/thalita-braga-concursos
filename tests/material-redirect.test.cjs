const test = require("node:test");
const assert = require("node:assert/strict");
const { createMaterialRedirectHandler } = require("../site-produtos/api/material-aula-09-nov-26.js");

function responseStub() {
  return {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    end(body = "") { this.body = body; this.ended = true; },
  };
}

const redirectUrl = "https://drive.google.com/drive/folders/1ZnW51KiRYE7peHV6ZBPGhpmYU46sqasz?usp=sharing";

test("accepts the configured passphrase, returns the Drive redirect, and preserves the five UTMs", () => {
  const handler = createMaterialRedirectHandler({ password: "PNAE26", redirectUrl });
  const response = responseStub();
  handler({ method: "POST", body: { password: "PNAE26", utms: { utm_source: "instagram", utm_medium: "social", utm_campaign: "aula-09-11", utm_term: "pnae", utm_content: "story", email: "not-forwarded" } } }, response);
  assert.equal(response.statusCode, 200);
  const result = JSON.parse(response.body);
  const parsedRedirect = new URL(result.redirect);
  assert.equal(parsedRedirect.origin + parsedRedirect.pathname, "https://drive.google.com/drive/folders/1ZnW51KiRYE7peHV6ZBPGhpmYU46sqasz");
  assert.equal(parsedRedirect.searchParams.get("usp"), "sharing");
  assert.deepEqual(Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].map((key) => [key, parsedRedirect.searchParams.get(key)])), {
    utm_source: "instagram", utm_medium: "social", utm_campaign: "aula-09-11", utm_term: "pnae", utm_content: "story",
  });
  assert.equal(result.redirect.includes("email"), false);
  assert.equal(response.headers["cache-control"], "no-store, max-age=0");
});

test("rejects an incorrect passphrase without revealing the destination", () => {
  const handler = createMaterialRedirectHandler({ password: "PNAE26", redirectUrl });
  const response = responseStub();
  handler({ method: "POST", body: { password: "wrong" } }, response);
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.includes("drive.google.com"), false);
});

test("rejects non-POST requests", () => {
  const handler = createMaterialRedirectHandler({ password: "PNAE26", redirectUrl });
  const response = responseStub();
  handler({ method: "GET" }, response);
  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.allow, "POST");
});

test("does not redirect when configuration is missing or points outside Drive folders", () => {
  for (const config of [
    { password: "PNAE26", redirectUrl: "" },
    { password: "PNAE26", redirectUrl: "https://example.com/" },
    { password: "PNAE26", redirectUrl: "http://drive.google.com/drive/folders/folder-id" },
  ]) {
    const handler = createMaterialRedirectHandler(config);
    const response = responseStub();
    handler({ method: "POST", body: { password: "PNAE26" } }, response);
    assert.equal(response.statusCode, 503);
    assert.equal(response.headers.location, undefined);
  }
});
