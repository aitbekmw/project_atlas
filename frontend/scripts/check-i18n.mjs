import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const messagesPath = path.join(root, "src", "i18n", "messages.ts");
const src = fs.readFileSync(messagesPath, "utf8");

function keysOf(name) {
  const marker = `const ${name}`;
  const start = src.indexOf(marker);
  if (start < 0) {
    throw new Error(`Block ${name} not found`);
  }
  const brace = src.indexOf("{", start);
  const end =
    name === "ru" ? src.indexOf("} as const;", brace) : src.indexOf("\n};", brace);
  const body = src.slice(brace + 1, end);
  const keys = [...body.matchAll(/"([^"]+)":\s*(?:\n\s*)?"(?:\\.|[^"\\])*"/g)].map(
    (match) => match[1],
  );
  return keys;
}

function unique(keys) {
  return [...new Set(keys)];
}

const ru = unique(keysOf("ru"));
const ky = unique(keysOf("ky"));
const en = unique(keysOf("en"));
const ruSet = new Set(ru);
const kySet = new Set(ky);
const enSet = new Set(en);

const missingKy = ru.filter((key) => !kySet.has(key));
const missingEn = ru.filter((key) => !enSet.has(key));
const extraKy = ky.filter((key) => !ruSet.has(key));
const extraEn = en.filter((key) => !ruSet.has(key));
const empty = [];

for (const locale of ["ru", "ky", "en"]) {
  const marker = `const ${locale}`;
  const start = src.indexOf(marker);
  const brace = src.indexOf("{", start);
  const end =
    locale === "ru" ? src.indexOf("} as const;", brace) : src.indexOf("\n};", brace);
  const body = src.slice(brace + 1, end);
  for (const match of body.matchAll(/"([^"]+)":\s*(?:\n\s*)?"((?:\\.|[^"\\])*)"/g)) {
    if (!match[2].trim()) {
      empty.push(`${locale}:${match[1]}`);
    }
  }
}

let failed = false;
function report(title, items) {
  if (items.length === 0) {
    return;
  }
  failed = true;
  console.error(`${title} (${items.length}):`);
  for (const item of items.slice(0, 50)) {
    console.error(`  - ${item}`);
  }
  if (items.length > 50) {
    console.error(`  … and ${items.length - 50} more`);
  }
}

if (ru.length !== ky.length || ru.length !== en.length) {
  failed = true;
  console.error(`Key count mismatch: ru=${ru.length} ky=${ky.length} en=${en.length}`);
}

report("Missing in ky", missingKy);
report("Missing in en", missingEn);
report("Extra in ky", extraKy);
report("Extra in en", extraEn);
report("Empty translations", empty);

const srcRoot = path.join(root, "src");
const skipHardcoded = new Set([
  path.join(srcRoot, "i18n", "messages.ts"),
  path.join(srcRoot, "i18n", "categories.ts"),
  path.join(srcRoot, "lib", "category-icons.ts"),
  path.join(srcRoot, "lib", "marketplace.ts"),
]);
const skipHardcodedDirs = ["mocks"];
const cyrillic = /[А-Яа-яЁёӨөҮүҢңІі]/;
const hardcoded = [];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

for (const file of walk(srcRoot)) {
  const rel = path.relative(srcRoot, file).replaceAll("\\", "/");
  if (skipHardcoded.has(file) || rel.split("/").some((part) => skipHardcodedDirs.includes(part))) {
    continue;
  }
  const lines = stripComments(fs.readFileSync(file, "utf8")).split("\n");
  lines.forEach((line, index) => {
    const cleaned = line.replace(/["'`]Бишкек["'`]/g, "");
    if (cyrillic.test(cleaned)) {
      hardcoded.push(`${rel}:${index + 1}: ${line.trim()}`);
    }
  });
}

report("Hardcoded Cyrillic UI outside i18n", hardcoded);

if (failed) {
  process.exit(1);
}

console.log(`i18n ok: ${ru.length} keys in ru, ky, en`);
