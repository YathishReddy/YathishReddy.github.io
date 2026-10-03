# yathishreddy.github.io

Personal site and the Signal Weekly archive. Plain HTML, no build step.

```
index.html                 profile
signal/index.html          newsletter archive
signal/YYYY-MM-DD/index.html  one folder per issue
feed.xml                   RSS for Signal Weekly
signal/subscribe/          subscribe page (Feedly, Inoreader, copy feed URL)
.nojekyll                  tells GitHub Pages to serve files as-is
```

## Adding an issue
1. Add `signal/YYYY-MM-DD/index.html`.
2. Add a row at the top of the list in `signal/index.html`.
3. Update the "Latest" block in `index.html`.
4. Generate the feed item and paste it at the top of `feed.xml` (update `lastBuildDate`):
   `node scripts/feed-item.mjs signal/YYYY-MM-DD/index.html "Issue NN: Title" "Sat, DD Mon YYYY 08:00:00 +0530"`
   It builds a rich summary of every pick, with each link pointing back to this site.

## "Where these ideas come from"
Shared component in `signal/assets/lineage.js` + `lineage.css`. Each issue keeps its `LINEAGE` data, includes both files, leaves an empty `<section class="lineage" id="lineage">`, and calls `SignalLineage.render({lineage:LINEAGE,cards:CARDS,cols:COLS})`. It renders one collapsed section with search, a cited/background toggle, theme chips and accordion entries. New ideas can set `group` (agents, training, arch, gen, serving, compress, eval); otherwise the id map in lineage.js decides.

## Substack post (abridged)
`node scripts/substack-post.mjs signal/YYYY-MM-DD/index.html id1,id2,... "Title" "Subtitle"`
prints a short, paste-ready post with six highlights. Every link points back to this site.
