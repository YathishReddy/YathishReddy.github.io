/* Signal Weekly: "The maths, simply" renderer.
 * Turns a small LaTeX subset into native MathML (MathML Core, no library needed).
 *
 * A card's math field is an array of items:
 *   "plain sentence, may contain inline maths \\( ... \\)"
 *   {t:"short label", m:"LaTeX for one display equation", n:"optional note after it"}
 * A plain string (older format) is also accepted and shown as one paragraph.
 *
 * Supported LaTeX: numbers (1,535 · 0.0004), single letters, + - = < > ( ) [ ] / , : | !
 * \frac{a}{b} \sqrt{x} x^{2} x_{i} \text{words} \res{result} (highlighted result; \mathbf and \boxed do the same)
 * \times \div \cdot \approx \to \rightarrow \le \ge \ne \pm \sim \ll \gg \infty \ldots \cdots
 * \min \max \log \ln \exp \% \$ \, \; \quad \! \left \right and lower-case Greek letters plus \Delta \Sigma \Omega
 * Unicode operators (× ÷ − ≈ → ≤ ≥) may be typed directly.
 * In a JavaScript string every backslash is written twice: "\\frac{1}{2}".
 */
(function (root) {
  "use strict";
  var NS = "http://www.w3.org/1998/Math/MathML";
  var SYM = {
    times: ["mo", "×"], div: ["mo", "÷"], cdot: ["mo", "·"], approx: ["mo", "≈"], to: ["mo", "→"],
    rightarrow: ["mo", "→"], leftarrow: ["mo", "←"], le: ["mo", "≤"], leq: ["mo", "≤"], ge: ["mo", "≥"],
    geq: ["mo", "≥"], ne: ["mo", "≠"], neq: ["mo", "≠"], pm: ["mo", "±"], sim: ["mo", "∼"], ll: ["mo", "≪"],
    gg: ["mo", "≫"], infty: ["mi", "∞"], ldots: ["mo", "…"], cdots: ["mo", "⋯"], propto: ["mo", "∝"],
    sum: ["mo", "∑"], prod: ["mo", "∏"],
    alpha: ["mi", "α"], beta: ["mi", "β"], gamma: ["mi", "γ"], delta: ["mi", "δ"], epsilon: ["mi", "ε"],
    eta: ["mi", "η"], theta: ["mi", "θ"], lambda: ["mi", "λ"], mu: ["mi", "μ"], pi: ["mi", "π"],
    rho: ["mi", "ρ"], sigma: ["mi", "σ"], tau: ["mi", "τ"], phi: ["mi", "φ"], omega: ["mi", "ω"],
    Delta: ["mi", "Δ"], Sigma: ["mi", "Σ"], Omega: ["mi", "Ω"]
  };
  var FUNCS = { min: 1, max: 1, log: 1, ln: 1, exp: 1 };
  var OPS = "+-=<>()[]/,:;|!'×÷−≈→≤≥·…⋅⁄*";
  var TIGHT = { "%": 1, "$": 1, "£": 1, "€": 1 };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function MathErr(msg) { this.message = msg; }

  function parse(src) {
    var i = 0, s = src;
    function peek() { return s[i]; }
    function skipWs() { while (i < s.length && /\s/.test(s[i])) i++; }
    function group() { // {...} or a single atom
      skipWs();
      if (s[i] === "{") { i++; var r = seq("}"); if (s[i] !== "}") throw new MathErr("missing }"); i++; return r.length === 1 ? r[0] : "<mrow>" + r.join("") + "</mrow>"; }
      var a = atom(); if (a === null) throw new MathErr("missing argument"); return a;
    }
    function rawGroup() {
      skipWs(); if (s[i] !== "{") throw new MathErr("expected { after \\text");
      var depth = 0, start = ++i;
      for (; i < s.length; i++) { if (s[i] === "{") depth++; else if (s[i] === "}") { if (!depth) break; depth--; } }
      if (s[i] !== "}") throw new MathErr("missing } in \\text");
      return s.slice(start, i++);
    }
    function command() {
      var m = /^\\([A-Za-z]+|.)/.exec(s.slice(i)); if (!m) throw new MathErr("bad command");
      i += m[0].length; var c = m[1];
      if (c === "frac" || c === "dfrac" || c === "tfrac") { var a = group(), b = group(); return "<mfrac>" + a + b + "</mfrac>"; }
      if (c === "sqrt") return "<msqrt>" + group() + "</msqrt>";
      if (c === "text" || c === "mathrm" || c === "textrm") {
        var t = rawGroup().replace(/\\([%$&#_])/g, "$1");
        return "<mtext>" + esc(t).replace(/^ /, " ").replace(/ $/, " ") + "</mtext>";
      }
      if (c === "res" || c === "mathbf" || c === "boxed") return '<mrow class="mx-res">' + group() + "</mrow>";
      if (c === "%" || c === "$") return '<mo lspace="0" rspace="0">' + c + "</mo>";
      if (c === ",") return '<mspace width="0.17em"></mspace>';
      if (c === ";") return '<mspace width="0.28em"></mspace>';
      if (c === "quad") return '<mspace width="1em"></mspace>';
      if (c === "left" || c === "right") { // \left( ... \right): fence grows with its contents
        skipWs(); var f = s[i++];
        if (f === "\\") { f = s[i++]; }
        if (f === ".") return "";
        if (!f || "()[]|{}".indexOf(f) < 0) throw new MathErr("bad fence after \\" + c);
        return '<mo form="' + (c === "left" ? "prefix" : "postfix") + '" stretchy="true" symmetric="true">' + f + "</mo>";
      }
      if (c === "!" || c === " ") return "";
      if (c === "{" || c === "}") return "<mo>" + c + "</mo>";
      if (FUNCS[c]) return '<mi mathvariant="normal">' + c + "</mi>";
      if (SYM[c]) return "<" + SYM[c][0] + ">" + SYM[c][1] + "</" + SYM[c][0] + ">";
      throw new MathErr("unknown command \\" + c);
    }
    function atom() {
      skipWs(); if (i >= s.length) return null;
      var ch = s[i];
      if (ch === "}") return null;
      if (ch === "{") return group();
      if (ch === "\\") return command();
      var num = /^(\d{1,3}(,\d{3})+|\d+)(\.\d+)?|^\.\d+/.exec(s.slice(i));
      if (num) { i += num[0].length; return "<mn>" + num[0] + "</mn>"; }
      i++;
      if (ch === "-" || ch === "−") return "<mo>−</mo>";
      if (TIGHT[ch]) return '<mo lspace="0" rspace="0">' + esc(ch) + "</mo>";
      if (ch === "*") return "<mo>×</mo>";
      // fences mid-row would otherwise be read as infix operators and padded
      if (ch === "(" || ch === "[") return '<mo form="prefix" stretchy="false">' + ch + "</mo>";
      if (ch === ")" || ch === "]") return '<mo form="postfix" stretchy="false">' + ch + "</mo>";
      if (OPS.indexOf(ch) >= 0) return "<mo>" + esc(ch) + "</mo>";
      if (/[A-Za-zͰ-Ͽ]/.test(ch)) return "<mi>" + ch + "</mi>";
      if (ch === "^" || ch === "_") throw new MathErr("nothing before " + ch);
      return "<mtext>" + esc(ch) + "</mtext>";
    }
    // "2.3×" as a ratio: a × right after a number and before the end or a word is set tight
    function tightTimes(out) {
      for (var j = 0; j < out.length; j++) { // a sign at the start, or after an operator or opening fence, is unary
        if ((out[j] === "<mo>−</mo>" || out[j] === "<mo>+</mo>") && (j === 0 || (/^<mo/.test(out[j - 1]) && !/form="postfix"/.test(out[j - 1]) && !/>[%$£€]</.test(out[j - 1]))))
          out[j] = '<mo form="prefix" lspace="0" rspace="0">' + out[j].slice(4);
      }
      for (var k = 1; k < out.length; k++) {
        if (out[k] === "<mo>×</mo>" && /^<mn>/.test(out[k - 1]) && (k === out.length - 1 || /^<mtext>/.test(out[k + 1])))
          out[k] = '<mo lspace="0" rspace="0">×</mo>';
      }
      return out;
    }
    function seq(end) {
      var out = [];
      for (;;) {
        skipWs(); if (i >= s.length || s[i] === end) return tightTimes(out);
        var base = atom(); if (base === null) return tightTimes(out);
        skipWs();
        var sup = null, sub = null;
        while (s[i] === "^" || s[i] === "_") { var k = s[i++]; var g = group(); if (k === "^") sup = g; else sub = g; skipWs(); }
        if (sup && sub) base = "<msubsup>" + base + sub + sup + "</msubsup>";
        else if (sup) base = "<msup>" + base + sup + "</msup>";
        else if (sub) base = "<msub>" + base + sub + "</msub>";
        out.push(base);
      }
    }
    var r = seq(null);
    if (i < s.length) throw new MathErr("unexpected " + s[i]);
    return "<mrow>" + r.join("") + "</mrow>";
  }

  function mathml(src, block) {
    try {
      return '<math xmlns="' + NS + '"' + (block ? ' display="block"' : "") + ">" + parse(src) + "</math>";
    } catch (e) {
      if (typeof console !== "undefined") console.error("SignalMath: " + (e.message || e) + " in: " + src);
      return '<code class="mx-err" title="' + esc(e.message || e) + '">' + esc(src) + "</code>";
    }
  }
  // prose may already hold HTML (<em>, <code>); only the \( ... \) parts are converted
  function inline(text) {
    return String(text).replace(/\\\(([\s\S]+?)\\\)/g, function (_, m) { return mathml(m, false); });
  }
  function html(math) {
    if (math == null) return "";
    if (!Array.isArray(math)) return '<p class="mx-p">' + inline(math) + "</p>";
    return math.map(function (it) {
      if (typeof it === "string") return '<p class="mx-p">' + inline(it) + "</p>";
      return '<div class="mx-step">' + (it.t ? '<div class="mx-t">' + inline(it.t) + "</div>" : "") +
        (it.m ? mathml(it.m, true) : "") + (it.n ? '<div class="mx-n">' + inline(it.n) + "</div>" : "") + "</div>";
    }).join("");
  }
  var api = { html: html, mathml: mathml, parse: parse };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SignalMath = api;
})(typeof window !== "undefined" ? window : globalThis);
