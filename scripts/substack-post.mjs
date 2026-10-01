// Usage: node scripts/substack-post.mjs signal/2026-09-26/index.html id1,id2,... "Post title" "Subtitle"
// Prints a Substack-ready abridged post (paste-friendly HTML). Every link goes back to yathishreddy.github.io.
import fs from "node:fs";
import vm from "node:vm";
const [file, ids, title, subtitle] = process.argv.slice(2);
const html = fs.readFileSync(file, "utf8");
const m = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(m.slice(0, m.indexOf("const byId")).replace(/\bconst (COLS|CARDS|LINEAGE)\b/g, "var $1"), ctx);
const { COLS, CARDS } = ctx;
const slug = file.split("/").slice(-2, -1)[0];
const base = `https://yathishreddy.github.io/signal/${slug}/`;
const lede = (html.match(/<p class="lede">([\s\S]*?)<\/p>/) || [, ""])[1];
const x = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const picks = ids.split(",").map(i => CARDS.find(c => c.id === i.trim())).filter(Boolean);
const colName = id => COLS.find(c => c.id === id).name;
let out = `<!-- TITLE: ${x(title)} -->\n<!-- SUBTITLE: ${x(subtitle)} -->\n`;
out += `<p>${lede}</p>\n<p><a href="${base}"><strong>Read the full interactive issue →</strong></a> All ${CARDS.length} picks, with figures, results tables and technical deep dives, live on yathishreddy.github.io.</p>\n<h2>This week's highlights</h2>\n`;
for (const c of picks) {
  out += `<h3>${x(c.title)}</h3>\n<p><em>${x(colName(c.col))} · ${x(c.org)}</em></p>\n` +
    `<p><strong>${x(c.stat[0])}</strong> ${x(c.stat[1])}.</p>\n<p>${x(c.tldr)}</p>\n` +
    `<p><a href="${base}#${c.id}">See the figure, results and deep dive →</a></p>\n`;
}
const rest = CARDS.length - picks.length;
out += `<h2>The other ${rest} picks</h2>\n<p>${COLS.map(c => x(c.name)).join(", ")}: ${rest} more picks with a summary, key figure and technical deep dive each, plus the prior work behind every idea.</p>\n` +
  `<p><a href="${base}"><strong>Open the full Signal Weekly issue →</strong></a></p>\n<hr>\n<p>Signal Weekly is an AI research digest curated by Yathish Reddy. <a href="https://yathishreddy.github.io/signal/">Read past issues</a>.</p>\n`;
console.log(out);
