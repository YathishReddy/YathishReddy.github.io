// Usage: node scripts/feed-item.mjs signal/2026-09-26/index.html "Issue 01: Title" "Sat, 26 Sep 2026 08:00:00 +0530"
// Prints an RSS <item> with a rich content:encoded body built from the issue's CARDS data.
import fs from "node:fs";
import vm from "node:vm";
const [file, title, pubDate] = process.argv.slice(2);
const html = fs.readFileSync(file, "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const cut = m.indexOf("const byId");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(m.slice(0, cut).replace(/\bconst (COLS|CARDS|LINEAGE)\b/g, "var $1"), ctx);
const { COLS, CARDS } = ctx;
const slug = file.split("/").slice(-2, -1)[0];
const base = `https://yathishreddy.github.io/signal/${slug}/`;
const lede = (html.match(/<p class="lede">([\s\S]*?)<\/p>/) || [, ""])[1];
const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
let body = `<p><em>${lede}</em></p><p><a href="${base}"><strong>Read the full interactive issue on yathishreddy.github.io →</strong></a><br>Each pick below links to its card with the key figure, results table and technical deep dive.</p>`;
for (const col of COLS) {
  const cards = CARDS.filter(c => c.col === col.id);
  body += `<h2>${x(col.name)}</h2><p>${x(col.blurb)}</p>`;
  for (const c of cards) {
    body += `<h3><a href="${base}#${c.id}">${x(c.title)}</a></h3>` +
      `<p><small>${x(c.org)} · ${x(c.date)} · ${x(c.badge)}</small></p>` +
      `<p><strong>TL;DR:</strong> ${x(c.tldr)}</p>` +
      `<p><strong>${x(c.stat[0])}</strong> ${x(c.stat[1])}</p>` +
      `<p><em>Why it matters:</em> ${x(c.why)}</p>` +
      `<p><em>Read with care:</em> ${x(c.caveat)}</p>` +
      `<p><a href="${base}#${c.id}">Open the figure, results and deep dive →</a></p>`;
  }
}
body += `<hr><p><a href="${base}">Open the full issue</a> · <a href="https://yathishreddy.github.io/signal/">All issues</a></p>`;
const desc = `<p>${x(lede)}</p><p>${CARDS.length} picks across ${COLS.length} columns. <a href="${base}">Read the full interactive issue on yathishreddy.github.io →</a></p>`;
const cats = COLS.map(c => `      <category>${x(c.name)}</category>`).join("\n");
console.log(`    <item>
      <title>${x(title)}</title>
      <link>${base}</link>
      <guid isPermaLink="true">${base}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>Yathish Reddy</dc:creator>
${cats}
      <description><![CDATA[${desc}]]></description>
      <content:encoded><![CDATA[${body}]]></content:encoded>
    </item>`);
