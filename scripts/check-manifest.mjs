// Verifies every visible string in src/content.ts against the client document.
// Reads word/document.xml straight out of the .docx (a zip) with a tiny reader,
// joins the text runs per paragraph, and asserts verbatim matches.
//
//   node scripts/check-manifest.mjs
//
// Exit code 0 = all strings found; 1 = at least one mismatch.
import { readFileSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { content } from "../src/content.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DOCX = path.join(root, "_brief", "Guardian Group Landing .docx");

/** Minimal zip reader: find one entry via the central directory and inflate it. */
function readZipEntry(file, name) {
  const buf = readFileSync(file);
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("Not a zip file: " + file);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count; n++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const entry = buf.toString("utf8", p + 46, p + 46 + nameLen);
    if (entry === name) {
      const lNameLen = buf.readUInt16LE(local + 26);
      const lExtraLen = buf.readUInt16LE(local + 28);
      const start = local + 30 + lNameLen + lExtraLen;
      const data = buf.subarray(start, start + csize);
      return method === 0 ? data : inflateRawSync(data);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`Entry ${name} not found in ${file}`);
}

const decode = (s) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
   .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
   .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
   .replace(/&amp;/g, "&");

const xml = readZipEntry(DOCX, "word/document.xml").toString("utf8");
const paragraphs = [...xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)].map((m) => {
  let text = "";
  for (const run of m[0].matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<w:tab\/>/g)) {
    text += run[1] !== undefined ? decode(run[1]) : "\t";
  }
  return text;
});

const fullText = paragraphs.join("\n");
const cardStart = paragraphs.indexOf("Card copy, as it appears");
const cardEnd = paragraphs.indexOf("The QME button");
if (cardStart < 0 || cardEnd < 0 || cardEnd <= cardStart) {
  console.error("Could not locate the \"Card copy, as it appears\" section.");
  process.exit(1);
}
const cardSection = paragraphs.slice(cardStart + 1, cardEnd);

let failures = 0;
const check = (label, ok, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
};
const inDoc = (s) => fullText.includes(s);
const inCards = (s) => cardSection.some((p) => p === s);

// Hero + selector strings: anywhere in the document.
check(`hero.headline`, inDoc(content.hero.headline), JSON.stringify(content.hero.headline));
check(`hero.subhead`, inDoc(content.hero.subhead), JSON.stringify(content.hero.subhead));
check(`hero.epigraph.quote`, inDoc(content.hero.epigraph.quote));
check(`hero.epigraph.attribution`, inDoc(content.hero.epigraph.attribution));
check(
  `epigraph quote + attribution form the source paragraph`,
  paragraphs.includes(`${content.hero.epigraph.quote} ${content.hero.epigraph.attribution}`),
);
check(`selector.heading`, inDoc(content.selector.heading), JSON.stringify(content.selector.heading));
check(`selector.closingLine`, inDoc(content.selector.closingLine), JSON.stringify(content.selector.closingLine));
check(`meta.description === hero.subhead`, content.meta.description === content.hero.subhead);

// Service strings: each must be a whole paragraph inside "Card copy, as it appears".
for (const s of content.services) {
  for (const key of ["name", "benefit", "description", "cta"]) {
    check(`services.${s.id}.${key} (in "Card copy, as it appears")`, inCards(s[key]), JSON.stringify(s[key]));
  }
  const host = new URL(s.href).hostname.replace(/^www\./, "");
  check(`services.${s.id}.href host "${host}" named in document`, inDoc(host));
}
// Each service's strings must appear in the same block, in order (name → benefit → description → cta).
for (const s of content.services) {
  const i = cardSection.indexOf(s.name);
  const block = cardSection.slice(i, i + 4);
  check(`services.${s.id} block order`, JSON.stringify(block) === JSON.stringify([s.name, s.benefit, s.description, s.cta]));
}

check(`qme.label`, inDoc(content.qme.label));
check(`qme.href host named in document`, inDoc(new URL(content.qme.href).hostname));

// Typography sanity: the em dash and arrow are the exact code points.
check(`subhead uses U+2014 em dash`, content.hero.subhead.includes("—"));
check(`attribution uses U+2014 em dash`, content.hero.epigraph.attribution.startsWith("— "));
check(`CTAs use U+2192 arrow`, content.services.every((s) => s.cta.endsWith(" →")));

// Known exception: the page title is the organisation's name (from the brief and the
// parent logo), not a sentence in the document. Reported, not failed.
console.log(
  `NOTE  meta.title ${JSON.stringify(content.meta.title)} ${inDoc(content.meta.title) ? "is" : "is not"} in the document text — organisation name, allowed exception.`,
);

console.log(`\n${failures === 0 ? "Manifest OK" : failures + " failure(s)"} — ${paragraphs.length} paragraphs read from document.xml`);
process.exit(failures === 0 ? 0 : 1);
