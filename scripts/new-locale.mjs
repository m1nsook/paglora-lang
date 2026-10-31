import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultDirectory = fileURLToPath(new URL("../locales/", import.meta.url));
const codePattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const safeName = value => typeof value === "string" && value.trim().length > 0 &&
  value.trim().length <= 80 && !/[<>\x00-\x1f\x7f]/.test(value);

export function createLocale(code, nativeName, englishName, direction = "ltr", directory = defaultDirectory) {
  if (!codePattern.test(code)) throw new Error("Use a locale code such as fr or pt-BR.");
  if (!safeName(nativeName) || !safeName(englishName)) throw new Error("Provide plain-text native and English names (max 80 chars).");
  if (!["ltr", "rtl"].includes(direction)) throw new Error("Direction must be ltr or rtl.");
  const output = resolve(directory, code + ".json");
  if (existsSync(output)) throw new Error("Locale already exists: " + code);
  const catalog = {
    schemaVersion: 1, locale: code, nativeName: nativeName.trim(),
    englishName: englishName.trim(), direction, messages: {},
  };
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify(catalog, null, 2) + "\n", { flag: "wx" });
  return output;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const [code, nativeName, englishName, direction = "ltr"] = process.argv.slice(2);
    if (!code || !nativeName || !englishName) {
      console.error('Usage: node scripts/new-locale.mjs fr "Français" "French" [ltr|rtl]');
      process.exitCode = 1;
    } else {
      const created = createLocale(code, nativeName, englishName, direction);
      console.log("Created " + created);
      console.log("Copy only the keys you plan to translate from locales/en.json into messages.");
      console.log("Run node scripts/validate.mjs and submit your translation in a pull request.");
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
