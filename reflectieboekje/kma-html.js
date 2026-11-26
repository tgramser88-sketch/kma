/*
 * 4.35 (U61): veilige HTML-sjablonen. kmaHtml`<b>${naam}</b>` maakt elke ingevoegde waarde onschadelijk (escapen), zodat
 * een naam of tekst met < > & " ' de pagina nooit kan verstoren. Voor HTML die al veilig is gemaakt: kmaHtml.raw(html).
 * Lijsten worden aan elkaar geplakt (elk element apart geëscapet, tenzij het zelf kmaHtml-uitvoer is).
 * Nieuwe code gebruikt kmaHtml in plaats van tekst + '<b>' + waarde + '</b>'.
 * Copyright (c) 2026 T.T.W. Gramser. Alle rechten voorbehouden.
 */
/* global module */
(function (root) {
  'use strict';
  var TEKENS = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };
  function Veilig(s) { this.html = String(s); }
  Veilig.prototype.toString = function () { return this.html; };
  function esc(v) {
    if (v == null || v === false) return '';
    if (v instanceof Veilig) return v.html;
    if (Array.isArray(v)) return v.map(esc).join('');
    return String(v).replace(/[&<>"'`]/g, function (c) { return TEKENS[c]; });
  }
  function kmaHtml(delen) {
    var uit = delen[0];
    for (var i = 1; i < delen.length; i++) uit += esc(arguments[i]) + delen[i];
    return new Veilig(uit);
  }
  kmaHtml.raw = function (html) { return new Veilig(html == null ? '' : html); };
  kmaHtml.esc = esc;
  if (typeof module !== 'undefined' && module.exports) module.exports = kmaHtml; else root.kmaHtml = kmaHtml;
})(typeof window !== 'undefined' ? window : this);
