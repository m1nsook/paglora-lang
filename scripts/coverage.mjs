import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCatalogs, validateCatalogs } from "./validate.mjs";

export function coverageRows(catalogs) {
  const english = catalogs.get("en")?.messages;
  if (!english) throw new Error("Canonical English catalog missing");
  const areas = ["studio", "site", "docs"];
  const totals = Object.fromEntries(areas.map(area => [
    area, Object.keys(english).filter(key => key.startsWith(area + ".")).length
  ]));
  return [...catalogs.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([locale, catalog]) => {
    const counts = Object.fromEntries(areas.map(area => [
      area, Object.keys(catalog.messages).filter(key => key.startsWith(area + ".")).length
    ]));
    return { locale, counts, totals, count: Object.keys(catalog.messages).length, total: Object.keys(english).length };
  });
}
export function renderCoverage(rows) {
  const columns = rows.map(row => [
    row.locale.padEnd(7),
    (row.counts.studio + "/" + row.totals.studio).padEnd(9),
    (row.counts.site + "/" + row.totals.site).padEnd(9),
    (row.counts.docs + "/" + row.totals.docs).padEnd(10),
    row.count + "/" + row.total
  ].join(" "));
  return [
    "Catalog key coverage (NOT overall application translation coverage):",
    "Locale  Studio    Website   Components Total",
    ...columns,
  ].join("\n");
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const catalogs = loadCatalogs();
    const errors = validateCatalogs(catalogs);
    if (errors.length) throw new Error(errors.join("\n"));
    console.log(renderCoverage(coverageRows(catalogs)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
