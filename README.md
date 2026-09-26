# yathishreddy.github.io

Personal site and the Signal Weekly archive. Plain HTML, no build step.

```
index.html                 profile
signal/index.html          newsletter archive
signal/YYYY-MM-DD/index.html  one folder per issue
feed.xml                   RSS for Signal Weekly
.nojekyll                  tells GitHub Pages to serve files as-is
```

## Adding an issue
1. Add `signal/YYYY-MM-DD/index.html`.
2. Add a row at the top of the list in `signal/index.html`.
3. Update the "Latest" block in `index.html`.
4. Add an `<item>` at the top of `feed.xml` and update `lastBuildDate`.
