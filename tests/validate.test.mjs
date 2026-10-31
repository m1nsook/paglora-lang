import test from "node:test";
import assert from "node:assert/strict";
import { loadCatalogs, validateCatalogs } from "../scripts/validate.mjs";

const catalogs = loadCatalogs();
test("bundled locale catalogs pass schema and interpolation checks",()=>{
 assert.deepEqual(validateCatalogs(catalogs),[]);
 assert.ok(catalogs.get("en").messages["studio.settings.language"]);
});
test("missing entries are legal but unknown entries are not",()=>{
 const c = new Map([["en",catalogs.get("en")],["fr",{...catalogs.get("en"),locale:"fr",messages:{ "studio.settings.title":"Paramètres"}}]]);
 assert.deepEqual(validateCatalogs(c),[]);
 c.get("fr").messages.unknown="Not allowed";
 assert.match(validateCatalogs(c).join(" "),/unknown key/);
});
test("translation variables must preserve the English placeholders",()=>{
 const c = new Map([["en",catalogs.get("en")],["pl",{...catalogs.get("pl"),messages:{...catalogs.get("pl").messages,"studio.dashboard.updated":"Zmieniono {data}"}}]]);
 assert.match(validateCatalogs(c).join(" "),/placeholder mismatch/);
});
test("no markup or control characters enter catalogs",()=>{
 const c = new Map([["en",catalogs.get("en")],["ko",{...catalogs.get("ko"),messages:{...catalogs.get("ko").messages,"site.copy.copy":"<script>alert(1)</script>"}}]]);
 assert.match(validateCatalogs(c).join(" "),/plain text/);
});
