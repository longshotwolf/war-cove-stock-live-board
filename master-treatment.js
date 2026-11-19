/* ════════════════════════════════════════════════════════════════
   MASTER STOCK BOARD — the master treatment, applied to the stock
   board's own bundle the way the house treats its copies: the
   board underneath is never rebuilt or reworded — this layer
   restyles the headline/name writing into the feather hand, takes
   the descriptive prose off the face (the lean rule), stands the
   candle faces in the offices, and lays the hologram radars
   inside Terra's and Vega's windows. Every figure the dials and
   radars carry is read out of the office's own rendered read on
   this page — no secondhand numbers, nothing computed here.
   ════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  try {

  /* ── THE LEAN RULE — descriptive prose off the masterpiece ────
     Exact duty lines and pot blurbs (the roster's standing
     descriptions), plus the board's explanatory paragraphs by
     their opening words. Grade records, status lines, reads and
     figures are never touched. */
  var HIDE_EXACT = [
    "Runs the research desk — opens the brief on the stock on the board, lines up every office's read, and flags where they disagree.",
    "Works the field radar — sweeps every stock on the board for a line turning the other way.",
    "Watches the Entries and Exits levels — bottoms and tops only — and calls a hit the moment price stands on one.",
    "Keeps the intel watch — turns the floor's reads into the one headline the Warlord acts on.",
    "Reads the 3M forming Heikin-Ashi candle firsthand; her slowing call also needs price pulling back.",
    "Reads the 1M forming candle firsthand — the fastest lane on the floor.",
    "Reads the 6H spread off the 6H bars — the front spread read the whole board turns on.",
    "Watches temp bottoms on MONTH · WEEK · DAY · 6H · 4H, levels riding the forming candles.",
    "Watches temp tops on the same five frames under the light law.",
    "Synthesizes the whole board into one plain call from every office's read.",
    "Keeps the record — every read, hit and miss written down under learn-and-report law.",
    "Audits the proof pages against the tape and corrects a wrong grade, with the correction printed on the entry.",
    "The live QC watch — her office stands on this floor, but her watch stands on the crypto Day Brief: she checks every reader room's posted read there against its own forming candle the moment it lands — the army, the momentum word, the spread's band word — and flags a mismatch in her office; she never rewrites a room's read. This stock board, still being built, is watched by the proof page.",
    "Rings and announces the 9:30 AM NYC open at the Market Bell window.",
    "Rings and announces the 4:00 PM NYC close — and the board goes down on her word.",
    "Works the feed desk — watches the data lanes feeding this board and calls a silent lane the moment one drops.",
    "The commentator — every rundown leads with the 6H spread relayed out of Sable's room, in Sable's words, then voices Sierra's 3-minute survey word for word and carries the timeframe cadence, and says the whole line on a MONTH · WEEK · DAY temp hit. She answers named commands from her room's command box (!sable · !sierra · !terra · !vega · !survey) in her locked voice — Aria, the warm American production voice. One coin at a time from her room on this floor.",
    "President and presenter — presents what the floor reads, in plain writing, from the front desk.",
    "Holds presence at the front desk while the floor reads, so the board never stands empty.",
    "Relays every office's call to the front desk as it lands — nothing waits in a pile.",
    "Works the front desk door — the stock on the board, its read, and the time it landed.",
    "Guards the crew — watches every bot's lane and flags a desk that stops reading firsthand.",
    "Bootstrap — keeps the saved-board fallback standing, so a silent feed shows the last board labeled stale, never dressed as live.",
    "Feed watcher — keeps an eye on the outside doors: Nasdaq first, Yahoo behind it, the house channel last.",
    "Candle guard — every office reads only its own timeframe's forming candle; she watches for a cross-read.",
    "Watchdog — market state, fresh temp extensions and entry hits; she barks when any of them fire.",
    "Clip and promo creation — its own pot, nothing transfers in or out.",
    "Sheity's live face line — its own pot, nothing transfers in or out.",
    "Restyle lane — its own pot, nothing transfers in or out."
  ];
  var HIDE_PREFIX = [
    "The Warlord's seat — the whole board reads",
    "Bella rang the open at 9:30 AM NYC. Stella rings the close",
    "Outside the 9:30 AM – 4:00 PM NYC session.",
    "The bell computer stands in the main office",
    "Levels ride the forming Heikin-Ashi candle of each frame.",
    "TRADE ALERT — fires on the MONTH",
    "The three money pots, kept separate",
    "No payments and no credentials ever stand on a board",
    "🗣️ HER VOICE — ARIA",
    "Every desk carries her name big",
    "Watches temp bottoms on MONTH",
    "Watches temp tops on the same five frames"
  ];

  function norm(s) { return (s || "").replace(/\s+/g, " ").trim(); }
  function hideEl(el) { if (el && !el.classList.contains("msbd-lean")) el.classList.add("msbd-lean"); }

  function applyLean(root) {
    var ps = root.querySelectorAll("p");
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i], t = norm(p.textContent);
      if (!t) continue;
      if (HIDE_EXACT.indexOf(t) !== -1) { hideEl(p); continue; }
      for (var j = 0; j < HIDE_PREFIX.length; j++) {
        if (t.indexOf(HIDE_PREFIX[j]) === 0) { hideEl(p); break; }
      }
    }
    /* Duty paragraphs: any <p> whose whole text is one of the
       roster duty lines — the roster is long, so beyond the exact
       list above, a duty line is the paragraph standing directly
       under a desk card's header block and before its
       "On the job now:" line. Handled structurally below. */
    var cards = root.querySelectorAll("li");
    for (var k = 0; k < cards.length; k++) {
      var li = cards[k];
      if (!/On the job now:/.test(li.textContent || "")) continue;
      var paras = li.querySelectorAll(":scope > p");
      for (var m = 0; m < paras.length; m++) {
        if (/^On the job now:/.test(norm(paras[m].textContent))) continue;
        if (/^Record:/.test(norm(paras[m].textContent))) continue;
        hideEl(paras[m]);
      }
    }
    /* Reader-office job lines: the <p> right after the office's
       <h3> name, of the form "{job} · {TICKER}" — and Terra's /
       Vega's "five frames" sub-lines, same seat. */
    var sections = root.querySelectorAll("section");
    for (var s = 0; s < sections.length; s++) {
      var h3 = sections[s].querySelector("h3");
      if (!h3) continue;
      var holder = h3.parentElement;
      if (!holder) continue;
      var sib = holder.querySelectorAll("p");
      for (var n = 0; n < sib.length; n++) {
        var tx = norm(sib[n].textContent);
        if (tx.indexOf("INTEL:") === 0) continue;
        if (/ · [A-Z][A-Z.]{0,5}$/.test(tx) || / · five frames · /.test(tx)) hideEl(sib[n]);
      }
    }
  }

  /* ── FEATHER — class the name spans CSS cannot reach ────────── */
  function applyFeather(root) {
    /* Bot-card names on the Company Floor (desk cards only —
       the ones carrying an "On the job now:" assignment) */
    var lis = root.querySelectorAll("li");
    for (var i = 0; i < lis.length; i++) {
      if (!/On the job now:/.test(lis[i].textContent || "")) continue;
      if (lis[i].closest && lis[i].closest(".proof-scroll")) continue;
      var span = lis[i].querySelector("div p span");
      if (span && !span.classList.contains("msbd-feather")) span.classList.add("msbd-feather");
    }
    /* Intel label lines — the source line under an office's name */
    var ps = root.querySelectorAll("p");
    for (var j = 0; j < ps.length; j++) {
      var first = ps[j].querySelector("span");
      if (first && norm(first.textContent) === "INTEL:" && !ps[j].classList.contains("msbd-feather")) {
        ps[j].classList.add("msbd-feather");
      }
    }
  }

  /* ── THE CANDLE FACES ─────────────────────────────────────────── */
  var FACES = {
    radar:     { accent: "#38bdf8", ring: "rgba(56,189,248,0.7)",  glow: "0 0 18px rgba(56,189,248,0.30)" },
    stopwatch: { accent: "#a5f3fc", ring: "rgba(165,243,252,0.7)", glow: "0 0 18px rgba(165,243,252,0.25)" },
    compass:   { accent: "#2dd4bf", ring: "rgba(45,212,191,0.7)",  glow: "0 0 18px rgba(45,212,191,0.30)" },
    gyro:      { accent: "#a78bfa", ring: "rgba(167,139,250,0.7)", glow: "0 0 18px rgba(167,139,250,0.30)" },
    scope:     { accent: "#fbbf24", ring: "rgba(251,191,36,0.7)",  glow: "0 0 18px rgba(251,191,36,0.28)" },
    rose:      { accent: "#fb7185", ring: "rgba(251,113,133,0.7)", glow: "0 0 18px rgba(251,113,133,0.30)" },
    chrono:    { accent: "#eab308", ring: "rgba(234,179,8,0.7)",   glow: "0 0 18px rgba(234,179,8,0.28)" },
    orbits:    { accent: "#34d399", ring: "rgba(52,211,153,0.7)",  glow: "0 0 18px rgba(52,211,153,0.30)" },
    lunar:     { accent: "#bfdbfe", ring: "rgba(191,219,254,0.7)", glow: "0 0 18px rgba(191,219,254,0.30)" }
  };
  function ticks(r1, r2, n, c) {
    var out = "";
    for (var i = 0; i < n; i++) {
      var a = (i * (360 / n) * Math.PI) / 180, long = i % 3 === 0, rr1 = long ? r1 : r2;
      out += '<line x1="' + (60 + rr1 * Math.cos(a)).toFixed(1) + '" y1="' + (60 + rr1 * Math.sin(a)).toFixed(1) +
             '" x2="' + (60 + 52 * Math.cos(a)).toFixed(1) + '" y2="' + (60 + 52 * Math.sin(a)).toFixed(1) +
             '" stroke="' + c + '" stroke-opacity="' + (long ? 0.8 : 0.45) + '" stroke-width="1"/>';
    }
    return out;
  }
  function furniture(face, spreadSign) {
    var c = FACES[face].accent;
    var ring = '<circle cx="60" cy="60" r="54" fill="none" stroke="' + c + '" stroke-opacity="0.35" stroke-width="1"/>';
    if (face === "radar") {
      return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
        '<circle cx="60" cy="60" r="40" fill="none" stroke="' + c + '" stroke-opacity="0.4"/>' +
        '<circle cx="60" cy="60" r="26" fill="none" stroke="' + c + '" stroke-opacity="0.3"/>' +
        '<line x1="60" y1="6" x2="60" y2="114" stroke="' + c + '" stroke-opacity="0.18"/>' +
        '<line x1="6" y1="60" x2="114" y2="60" stroke="' + c + '" stroke-opacity="0.18"/>' +
        '<circle cx="60" cy="60" r="2.6" fill="' + c + '"/></svg>' +
        '<div class="msbd-sweep msbd-sweep-blue" aria-hidden="true"></div>';
    }
    if (face === "stopwatch") {
      return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
        '<rect x="54" y="1" width="12" height="7" rx="2" fill="' + c + '" fill-opacity="0.7"/>' +
        ticks(46, 49.5, 12, c) + '<circle cx="60" cy="60" r="2.4" fill="' + c + '"/></svg>' +
        '<div class="msbd-watch-hand" aria-hidden="true"><svg viewBox="0 0 120 120" style="width:100%;height:100%">' +
        '<line x1="60" y1="60" x2="60" y2="18" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/></svg></div>';
    }
    if (face === "compass") {
      var ang = spreadSign > 0 ? 35 : spreadSign < 0 ? -35 : 0;
      return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
        '<circle cx="60" cy="60" r="45" fill="none" stroke="' + c + '" stroke-opacity="0.16"/>' + ticks(46, 49.5, 12, c) +
        '<g transform="rotate(' + ang + ' 60 60)"><line x1="60" y1="60" x2="60" y2="22" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M60 16 l4.5 9 h-9 Z" fill="' + c + '"/></g><circle cx="60" cy="60" r="2.6" fill="' + c + '"/></svg>';
    }
    if (face === "gyro") {
      return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
        '<ellipse cx="60" cy="60" rx="46" ry="17" fill="none" stroke="' + c + '" stroke-opacity="0.55"/>' +
        '<ellipse cx="60" cy="60" rx="46" ry="17" fill="none" stroke="' + c + '" stroke-opacity="0.4" transform="rotate(60 60 60)"/>' +
        '<ellipse cx="60" cy="60" rx="46" ry="17" fill="none" stroke="' + c + '" stroke-opacity="0.4" transform="rotate(120 60 60)"/>' +
        '<circle cx="60" cy="60" r="2.6" fill="' + c + '"/></svg>';
    }
    if (face === "scope") {
      return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
        '<line x1="60" y1="8" x2="60" y2="112" stroke="' + c + '" stroke-opacity="0.15"/>' +
        '<line x1="8" y1="60" x2="112" y2="60" stroke="' + c + '" stroke-opacity="0.15"/>' +
        '<polyline points="10,74 26,74 34,44 46,88 56,60 68,60 76,38 86,74 110,74" fill="none" stroke="' + c + '" stroke-width="2" stroke-opacity="0.85"/></svg>';
    }
    if (face === "rose") {
      var ang2 = spreadSign > 0 ? 28 : spreadSign < 0 ? -28 : 0;
      return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
        '<path d="M60 12 L66 48 L102 42 L70 56 L104 72 L67 68 L74 104 L60 74 L46 104 L53 68 L16 72 L50 56 L18 42 L54 48 Z" fill="' + c + '" fill-opacity="0.20" stroke="' + c + '" stroke-opacity="0.5"/>' +
        '<g transform="rotate(' + ang2 + ' 60 60)"><line x1="60" y1="60" x2="60" y2="24" stroke="' + c + '" stroke-width="2.2"/></g>' +
        '<g transform="rotate(' + (-ang2) + ' 60 60)"><line x1="60" y1="60" x2="60" y2="30" stroke="' + c + '" stroke-width="1.6" stroke-opacity="0.75"/></g>' +
        '<circle cx="60" cy="60" r="2.6" fill="' + c + '"/></svg>';
    }
    if (face === "chrono") {
      return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
        '<circle cx="60" cy="60" r="45" fill="none" stroke="' + c + '" stroke-opacity="0.2"/>' + ticks(44, 48, 12, c) +
        '<line x1="60" y1="60" x2="60" y2="34" stroke="' + c + '" stroke-width="2.6" stroke-linecap="round"/>' +
        '<line x1="60" y1="60" x2="78" y2="68" stroke="' + c + '" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="60" cy="60" r="2.6" fill="' + c + '"/></svg>';
    }
    if (face === "orbits") {
      var dots = "";
      for (var i = 0; i < 7; i++) {
        var a = (i * (360 / 7) * Math.PI) / 180;
        dots += '<circle cx="' + (60 + 45 * Math.cos(a)).toFixed(1) + '" cy="' + (60 + 45 * Math.sin(a)).toFixed(1) + '" r="3.4" fill="' + c + '" fill-opacity="0.75"/>';
      }
      return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
        '<circle cx="60" cy="60" r="45" fill="none" stroke="' + c + '" stroke-opacity="0.3"/>' + dots +
        '<circle cx="60" cy="60" r="2.4" fill="' + c + '" fill-opacity="0.7"/></svg>';
    }
    /* lunar */
    return '<svg viewBox="0 0 120 120" style="position:absolute;inset:0;width:100%;height:100%" aria-hidden="true">' + ring +
      '<path d="M82 18 a46 46 0 1 0 20 72 a37 37 0 1 1 -20 -72 Z" fill="' + c + '" fill-opacity="0.20" stroke="' + c + '" stroke-opacity="0.45"/>' +
      '<circle cx="34" cy="34" r="1.7" fill="' + c + '" fill-opacity="0.8"/><circle cx="92" cy="48" r="1.4" fill="' + c + '" fill-opacity="0.65"/>' +
      '<circle cx="42" cy="92" r="1.4" fill="' + c + '" fill-opacity="0.65"/></svg>';
  }

  function faceFor(section) {
    var h3 = section.querySelector("h3");
    var name = h3 ? norm(h3.textContent).toUpperCase() : "";
    var label = norm(section.getAttribute("aria-label") || "").toUpperCase();
    var sub = "";
    var subEl = section.querySelector("div p");
    /* front shells carry the frame in the sub line; offices in the tf span */
    var all = section.querySelectorAll("p, span");
    for (var i = 0; i < all.length; i++) {
      var t = norm(all[i].textContent);
      if (/^(Three minute|One minute|6H spread)$/.test(t)) { sub = t; break; }
    }
    if (name.indexOf("SIERRA") === 0 || sub === "Three minute") return "radar";
    if (name.indexOf("MINA") === 0 || sub === "One minute") return "stopwatch";
    if (name.indexOf("SABLE") === 0 || sub === "6H spread" || label.indexOf("SPREAD") !== -1) return "rose";
    var tf = "";
    var spans = section.querySelectorAll("span, p");
    for (var j = 0; j < spans.length; j++) {
      var st = norm(spans[j].textContent);
      if (/^(1H|4H|6H|DAY|WEEK|MONTH)$/.test(st)) { tf = st; break; }
      var sm = /^(1H|4H|6H|DAY|WEEK|MONTH) reader$/.exec(st);
      if (sm) { tf = sm[1]; break; }
    }
    if (!tf) {
      var lm = /— (1H|4H|6H|DAY|WEEK|MONTH) (reader|spread)/.exec(label);
      if (lm) tf = lm[1].toUpperCase();
    }
    if (!tf) {
      var m = / · (1H|4H|6H|DAY|WEEK|MONTH) (reader|spread)/i.exec(norm(section.textContent).slice(0, 400));
      if (m) tf = m[1].toUpperCase();
    }
    if (tf === "1H") return "compass";
    if (tf === "4H") return "gyro";
    if (tf === "6H") return "scope";
    if (tf === "DAY") return "chrono";
    if (tf === "WEEK") return "orbits";
    if (tf === "MONTH") return "lunar";
    if (name.indexOf("HERA") === 0) return "compass";
    if (name.indexOf("CORA") === 0) return "gyro";
    if (name.indexOf("JUNO") === 0) return "scope";
    if (name.indexOf("DIA") === 0) return "chrono";
    if (name.indexOf("SELA") === 0) return "orbits";
    if (name.indexOf("MONA") === 0) return "lunar";
    return null;
  }

  function boardTicker() {
    var h1 = document.querySelector("h1");
    if (!h1) return "";
    var t = norm(h1.textContent).split(" ")[0];
    return /^[A-Z][A-Z.]{0,5}$/.test(t) ? t : "";
  }

  function readSection(section) {
    /* The office's own rendered read: direction window + figures. */
    var win = null, wins = section.querySelectorAll('[role="status"]');
    for (var i = 0; i < wins.length; i++) {
      var al = wins[i].getAttribute("aria-label") || "";
      if (al.indexOf("Direction window:") === 0) { win = wins[i]; break; }
    }
    var held = false, call = "", callColor = "";
    if (win) {
      call = norm(win.textContent).replace(/last session — market closed$/, "").trim();
      callColor = window.getComputedStyle(win).color || "";
      if (/^HELD/.test(call)) held = true;
    }
    var price = null, spread = null;
    var dts = section.querySelectorAll("dt");
    for (var d = 0; d < dts.length; d++) {
      var dd = dts[d].parentElement ? dts[d].parentElement.querySelector("dd") : null;
      if (!dd) continue;
      var lab = norm(dts[d].textContent);
      if (lab === "Price") price = norm(dd.textContent);
      if (lab === "Spread fig.") spread = norm(dd.textContent).split(" (")[0];
    }
    if (price == null) {
      var ps = section.querySelectorAll("p");
      for (var p = 0; p < ps.length; p++) {
        var mm = /Price (\$[\d,]+\.\d+) · Spread fig\. (-?\$[\d,]+\.\d+)/.exec(norm(ps[p].textContent));
        if (mm) { price = mm[1]; spread = mm[2]; break; }
      }
    }
    if (!win && price == null) {
      /* no read rendered yet — HELD stands inside the dial */
      held = true;
    }
    return { held: held, call: call, callColor: callColor, price: price, spread: spread };
  }

  function dialHTML(face, data, ticker) {
    var f = FACES[face];
    var sign = 0;
    if (data.spread) { var v = parseFloat(String(data.spread).replace(/[$,]/g, "")); if (!isNaN(v)) sign = v > 0 ? 1 : v < 0 ? -1 : 0; }
    var inner = furniture(face, sign);
    var text;
    if (data.held) {
      text = '<div class="msbd-dial-text"><p class="msbd-d-ticker">' + ticker + '</p><p class="msbd-d-held">HELD</p></div>';
    } else {
      var spreadColor = sign > 0 ? "#4ade80" : sign < 0 ? "#f87171" : "#e2e8f0";
      text = '<div class="msbd-dial-text">' +
        '<p class="msbd-d-ticker">' + ticker + '</p>' +
        (data.price ? '<p class="msbd-d-price">' + data.price + '</p>' : '') +
        (data.spread ? '<p class="msbd-d-spread" style="color:' + spreadColor + '">Spread ' + data.spread + '</p>' : '') +
        (data.call ? '<p class="msbd-d-call" style="color:' + (data.callColor || "#e2e8f0") + '">' + data.call + '</p>' : '') +
        '</div>';
    }
    return '<div class="msbd-dial" role="img" aria-label="Candle face — ' + ticker + (data.held ? " — HELD" : "") + '" style="border:2px solid ' + f.ring + ';box-shadow:' + f.glow + '">' + inner + text + '</div>';
  }

  function decorateOffice(section) {
    /* Only reader seats carry a face: a front shell (header row +
       h3) or an office standing a direction window. */
    var header0 = section.querySelector(":scope > div");
    var isShell0 = header0 && header0.className.indexOf("mb-2") !== -1 && section.querySelector("h3");
    if (!isShell0 && !section.querySelector('[aria-label^="Direction window:"]')) return;
    var face = faceFor(section);
    if (!face) return;
    var data = readSection(section);
    var ticker = boardTicker();
    var key = face + "|" + (data.held ? "HELD" : (data.price || "") + "|" + (data.spread || "") + "|" + data.call) + "|" + ticker;
    var existing = section.querySelector(":scope .msbd-dial");
    if (existing && existing.getAttribute("data-msbd-key") === key) return;
    var html = dialHTML(face, data, ticker);
    if (existing) {
      var wrap = existing.parentElement;
      wrap.innerHTML = html;
      wrap.firstElementChild.setAttribute("data-msbd-key", key);
      return;
    }
    /* Front shells: dial at the left of the read, in a row. */
    var header = section.querySelector(":scope > div");
    var isShell = header && header.className.indexOf("mb-2") !== -1;
    if (isShell) {
      var row = document.createElement("div");
      row.className = "msbd-shellrow";
      var dialHost = document.createElement("div");
      dialHost.innerHTML = html;
      dialHost.firstElementChild.setAttribute("data-msbd-key", key);
      var body = document.createElement("div");
      body.className = "msbd-shellbody";
      var kids = [];
      for (var i = 0; i < section.childNodes.length; i++) {
        if (section.childNodes[i] !== header && section.childNodes[i].nodeType === 1) kids.push(section.childNodes[i]);
      }
      row.appendChild(dialHost);
      row.appendChild(body);
      section.appendChild(row);
      for (var k = 0; k < kids.length; k++) body.appendChild(kids[k]);
      return;
    }
    /* Reader offices: dial at the left of the direction-window row. */
    var winRow = null, rows = section.querySelectorAll(":scope div");
    for (var r = 0; r < rows.length; r++) {
      if (rows[r].querySelector && rows[r].querySelector('[aria-label^="Direction window:"]') && rows[r].className.indexOf("items-center") !== -1) { winRow = rows[r]; break; }
    }
    var host = document.createElement("div");
    host.innerHTML = html;
    host.firstElementChild.setAttribute("data-msbd-key", key);
    if (winRow) {
      winRow.style.flexWrap = "wrap";
      winRow.insertBefore(host, winRow.firstChild);
    } else {
      section.appendChild(host);
    }
  }

  /* ── TERRA / VEGA RADARS ──────────────────────────────────────── */
  function radarBG(kind) {
    var c = kind === "terra" ? "#38bdf8" : "#fb7185";
    var ringC = kind === "terra" ? "#34d399" : "#fb7185";
    return '<svg class="msbd-radar-bg" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true">' +
      '<circle class="msbd-radar-ring" cx="50" cy="30" r="26" fill="none" stroke="' + ringC + '" stroke-opacity="0.4" stroke-width="1"/>' +
      '<circle cx="50" cy="30" r="17" fill="none" stroke="' + c + '" stroke-opacity="0.35" stroke-width="1"/>' +
      '<circle cx="50" cy="30" r="8" fill="none" stroke="' + c + '" stroke-opacity="0.3" stroke-width="1"/>' +
      '<line x1="50" y1="2" x2="50" y2="58" stroke="' + c + '" stroke-opacity="0.15"/>' +
      '<line x1="10" y1="30" x2="90" y2="30" stroke="' + c + '" stroke-opacity="0.15"/></svg>' +
      '<div class="msbd-radar-bg" aria-hidden="true"><div class="msbd-radar-sweep ' + kind + '" style="left:50%;top:50%;width:120px;height:120px;margin:-60px 0 0 -60px"></div></div>';
  }
  function decorateRadarCell(cell, kind) {
    cell.classList.add("msbd-radar-cell");
    var t = norm(cell.textContent);
    var hit = /ON IT|NEW/.test(t) || cell.className.indexOf("direction-flash") !== -1;
    cell.classList.toggle("msbd-radar-hit", hit);
    if (!cell.querySelector(":scope .msbd-radar-bg")) {
      var host = document.createElement("div");
      host.innerHTML = radarBG(kind);
      while (host.firstChild) cell.insertBefore(host.firstChild, cell.firstChild);
    }
  }
  function decorateRadars(root) {
    var sections = root.querySelectorAll("section");
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      var label = norm(sec.getAttribute("aria-label") || "");
      var h3 = sec.querySelector("h3");
      var h3t = h3 ? norm(h3.textContent).toUpperCase() : "";
      var kind = null;
      if (label.indexOf("Terra") === 0 || h3t.indexOf("TERRA") === 0) kind = "terra";
      if (label.indexOf("Vega") === 0 || h3t.indexOf("VEGA") === 0) kind = "vega";
      if (!kind) continue;
      var cells = sec.querySelectorAll('[role="status"], .grid > div');
      for (var c = 0; c < cells.length; c++) {
        var cell = cells[c];
        if (cell.classList.contains("msbd-dial")) continue;
        if (/^(MONTH|WEEK|DAY|6H|4H|3M|1M|1H)$/.test(norm(cell.querySelector("p") ? cell.querySelector("p").textContent : ""))) {
          decorateRadarCell(cell, kind);
        }
      }
    }
  }

  /* ── RUN ──────────────────────────────────────────────────────── */
  var rootEl = null;
  function run() {
    if (!rootEl) return;
    try { applyLean(rootEl); } catch (e) {}
    try { applyFeather(rootEl); } catch (e) {}
    try {
      var sections = rootEl.querySelectorAll("section");
      for (var i = 0; i < sections.length; i++) {
        var label = norm(sections[i].getAttribute("aria-label") || "");
        if (/Office|readings/i.test(label) || sections[i].querySelector("h3")) {
          try { decorateOffice(sections[i]); } catch (e) {}
        }
      }
    } catch (e) {}
    try { decorateRadars(rootEl); } catch (e) {}
  }
  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; run(); }, 250);
  }
  function init() {
    rootEl = document.querySelector("[data-generated-space-root]") || document.body;
    if (!rootEl) return;
    run();
    var obs = new MutationObserver(schedule);
    obs.observe(rootEl, { childList: true, subtree: true, characterData: true });
    setInterval(run, 4000);
  }
  /* This script rides in the head — the app root does not exist
     yet at parse time, so stand up on DOMContentLoaded. */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
  } catch (e) { /* the treatment never breaks the board */ }
})();
