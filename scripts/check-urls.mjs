// HEAD-checks the four destination URLs and reports status codes and redirects.
// Run on a machine with open internet access:  node scripts/check-urls.mjs
// It reports; it never edits content.ts (a redirect is not a reason to change a URL).
import { content } from "../src/content.ts";

const urls = [...content.services.map((s) => [s.name, s.href]), [content.qme.label, content.qme.href]];
let failures = 0;
for (const [name, url] of urls) {
  try {
    let current = url;
    const hops = [];
    for (let i = 0; i < 10; i++) {
      const res = await fetch(current, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(15000) });
      hops.push(`${res.status}`);
      const next = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && next) {
        current = new URL(next, current).href;
        hops.push(`→ ${current}`);
        continue;
      }
      if (res.status >= 400) failures++;
      break;
    }
    console.log(`${name.padEnd(28)} ${url.padEnd(40)} ${hops.join(" ")}`);
  } catch (e) {
    failures++;
    console.log(`${name.padEnd(28)} ${url.padEnd(40)} ERROR ${e.cause?.code ?? e.message}`);
  }
}
process.exit(failures ? 1 : 0);
