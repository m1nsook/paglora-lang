import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLocale } from "../scripts/new-locale.mjs";
import { coverageRows, renderCoverage } from "../scripts/coverage.mjs";

test("scaffold creates an empty locale without overwriting existing translations", () => {
  const dir = mkdtempSync(join(tmpdir(), "paglora-lang-"));
  try {
    const file = createLocale("pt-BR", "Português (Brasil)", "Portuguese (Brazil)", "ltr", dir);
    const doc = JSON.parse(readFileSync(file, "utf8"));
    assert.equal(doc.locale, "pt-BR");
    assert.deepEqual(doc.messages, {});
    assert.equal(doc.schemaVersion, 1);
    assert.throws(() => createLocale("pt-BR", "Português", "Portuguese", "ltr", dir), /already exists/);
    assert.match(readFileSync(file, "utf8"), /Português \(Brasil\)/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test("scaffolder prevents path traversal and unsafe metadata", () => {
  for (const code of ["../xx", "xx/yy", "PT-br", "english", "fr.json", "a"]) {
    assert.throws(() => createLocale(code, "Sample", "Sample"), /locale code/);
  }
  assert.throws(() => createLocale("fr", "<script>", "French"), /plain-text/);
  assert.throws(() => createLocale("fr", "Français", "French", "sideways"), /Direction/);
});
test("coverage reports individual namespaces and does not confuse fallback with coverage", () => {
  const mock = new Map([
    ["en", { messages: { "studio.a": "A", "studio.b": "B", "site.a": "A", "docs.a": "A" } }],
    ["fr", { messages: { "studio.a": "Traduit", "site.a": "Site" } }],
  ]);
  const rows = coverageRows(mock);
  const fr = rows.find(row => row.locale === "fr");
  assert.equal(fr.counts.studio, 1);
  assert.equal(fr.counts.docs, 0);
  assert.equal(fr.count, 2);
  assert.match(renderCoverage(rows), /2\/4/);
  assert.match(renderCoverage(rows), /NOT overall application translation coverage/);
});
