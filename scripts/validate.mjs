import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../locales/", import.meta.url));
const localeName = /^[a-z]{2}(?:-[A-Z]{2})?\.json$/;
const placeholder = /\{([a-z][a-zA-Z0-9_]*)\}/g;
const placeholders = value => [...value.matchAll(placeholder)].map(match => match[1]).sort().join(",");
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

export function validateCatalogs(catalogs) {
  const errors = [];
  const en = catalogs.get("en");
  if (!en?.messages || !Object.keys(en.messages).length) errors.push("English must define a nonempty canonical catalog");
  const keys = new Set(Object.keys(en?.messages ?? {}));
  for (const [locale, catalog] of catalogs) {
    const prefix = `locales/${locale}.json`;
    if (!localeName.test(locale + ".json")) errors.push(`${prefix}: invalid BCP-47 filename`);
    if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
      errors.push(`${prefix}: expected an object`); continue;
    }
    if (catalog.schemaVersion !== 1 || catalog.locale !== locale || !["ltr", "rtl"].includes(catalog.direction) ||
      typeof catalog.nativeName !== "string" || !catalog.nativeName.trim() ||
      typeof catalog.englishName !== "string" || !catalog.englishName.trim()) {
      errors.push(`${prefix}: invalid metadata (schemaVersion/locale/nativeName/englishName/direction)`);
    }
    if (!catalog.messages || typeof catalog.messages !== "object" || Array.isArray(catalog.messages)) {
      errors.push(`${prefix}: messages must be an object`); continue;
    }
    for (const [key, value] of Object.entries(catalog.messages)) {
      if (!/^(studio|site|docs)\.[a-zA-Z][a-zA-Z0-9.]*/.test(key)) errors.push(`${prefix}: invalid message ID ${key}`);
      if (locale !== "en" && !keys.has(key)) errors.push(`${prefix}: unknown key ${key}`);
      if (typeof value !== "string" || !value.trim() || value.length > 500 ||
        /[<>\x00-\x1f\x7f]/.test(value)) {
        errors.push(`${prefix}: ${key} must be nonempty plain text (max 500 chars; no tags/control characters)`);
        continue;
      }
      if (locale !== "en" && keys.has(key) && placeholders(value) !== placeholders(en.messages[key])) {
        errors.push(`${prefix}: placeholder mismatch in ${key}; expected ${placeholders(en.messages[key])}`);
      }
      if (/\{[^{}]*\}/.test(value) && /\{[^{}]*\}/.test(value.replace(placeholder, ""))) {
        errors.push(`${prefix}: unsupported placeholder in ${key}`);
      }
    }
    for (const field of ["nativeName", "englishName"]) if (hasOwn(catalog,field) && /[<>\x00-\x1f\x7f]/.test(catalog[field])) errors.push(`${prefix}: unsafe ${field}`);
    for (const field of Object.keys(catalog)) if (!["schemaVersion","locale","nativeName","englishName","direction","messages"].includes(field)) errors.push(`${prefix}: unsupported top-level field ${field}`);
    if (locale === "en") for (const key of keys) if (typeof en.messages[key] !== "string") errors.push(`${prefix}: canonical ${key} must be text`);
  }
  return errors;
}

export function loadCatalogs(directory = root) {
  const catalogs = new Map();
  for (const filename of readdirSync(directory).sort()) {
    if (!filename.endsWith(".json")) continue;
    try {
      const raw = readFileSync(join(directory, filename), "utf8");
      // JSON.parse alone silently accepts duplicate object keys; reject them
      // with a second scan on the canonical flat messages map.
      const catalog = JSON.parse(raw);
      const messageBlock = /"messages"\s*:\s*\{([\s\S]*?)\n\s*\}/.exec(raw)?.[1];
      if (messageBlock) {
        const ids = [...messageBlock.matchAll(/^\s*"((?:studio|site|docs)\.[^"]+)"\s*:/gm)].map(m => m[1]);
        if (ids.length !== new Set(ids).size) throw new Error("duplicate message keys");
      }
      catalogs.set(filename.slice(0,-5),catalog);
    } catch (error) { throw new Error(`${filename}: ${error.message}`); }
  }
  return catalogs;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fileURLToPath(new URL("file://" + process.argv[1]).href)) {
  try {
    const catalogs = loadCatalogs();
    const errors = validateCatalogs(catalogs);
    if (errors.length) { console.error(errors.join("\n")); process.exitCode = 1; }
    else {
      const count = Object.keys(catalogs.get("en").messages).length;
      for (const [code,catalog] of catalogs) console.log(`${code}: ${Object.keys(catalog.messages).length}/${count} catalog keys present`);
      console.log(`Validated ${catalogs.size} locale catalogs (catalog coverage is not whole-app coverage).`);
    }
  } catch(error) {console.error(error.message);process.exitCode = 1;}
}
