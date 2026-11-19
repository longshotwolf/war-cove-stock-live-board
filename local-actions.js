// ════════════════════════════════════════════════════════════════════
// WAR COVE — DAY BRIEF STOCK BOARD · DISCORD COPY DATA LAYER
//
// This copy is a static page (GitHub Pages). The real board answers its
// action calls from a server; this copy answers the SAME calls in the
// browser, off the SAME public doors the board itself uses, in the
// board's own order: Nasdaq public API first, Yahoo Finance behind it.
// The house quote channel (Finnhub tool) has no browser door — where
// the server would fall back to it, this copy falls back to Yahoo and,
// failing that, stands HELD / stale rather than dressing a dead figure
// as live. His crypto ledger prices read off Yahoo's SYMBOL-USD tape
// for the same reason.
//
// THE FEED DOOR (house recipe): inside Discord the page sits in
// Discord's proxied frame and cannot fetch outside APIs directly, so
// when the hostname ends in discordsays.com every data call routes
// through the app's URL-mapping prefixes (BARE prefix form):
//   /nsd → api.nasdaq.com
//   /yho → query2.finance.yahoo.com
// Outside Discord the build used to drink direct — that path is dead
// for a plain browser: neither host sends Access-Control-Allow-Origin,
// so the browser refuses answers both hosts happily serve (probed
// Nov 17, 2026 — HTTP 200, no CORS header, on both). For the open web
// (OBS / stream) the copy rides a relay instead — see THE OPEN-WEB
// RELAY at the feed layer below. The Discord door above is untouched.
//
// THE LEDGERS: the proof pages open on the house record as it stood
// when this copy was published (seeded below), and keep recording and
// grading locally — every board pass writes its reads and grades open
// calls when their frame rolls, exactly as the board does. Entries
// written inside this copy live in this browser's local ledger only;
// they do not flow back to the house board's record.
//
// CALLA'S ROOM rides in this copy too: her Day Brief (master copy)
// side is answered below by a client-side port of the board's
// buildCommentary — Sierra's 3-minute survey, Terra's bottoms and
// Vega's tops off the coin's own Yahoo SYMBOL-USD tape (through the
// /yho door inside Discord), the timeframe cadence, and the 6H
// spread RELAYED OUT OF SABLE'S ROOM (Sable's figure, direction and
// band word off her locked scale), read first. Her stock side reads
// off getBoard, as on the board. Her VOICE is the one piece that
// cannot ride: Aria is synthesized line by line through the house
// TTS lane on the board's server, and a static page has no door to
// that lane — so here her lines stand as text only and no other
// voice is substituted, exactly as the board itself behaves when
// the lane does not answer.
// ════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  var IN_DISCORD = /(^|\.)discordsays\.com$/.test(location.hostname);
  var NSD = IN_DISCORD ? "/nsd" : "https://api.nasdaq.com";
  var YHO = IN_DISCORD ? "/yho" : "https://query2.finance.yahoo.com";

  // ── Storage ──────────────────────────────────────────────────────
  var LS_LEDGER = "sbd-ledger-v1";
  var LS_WATCH = "sbd-watchlist-v1";
  var LS_HITS = "sbd-hits-v1";
  var LS_SNAP = "sbd-snap-";
  function lsGet(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage full/blocked — the board still stands for this view */
    }
  }

  var SEED = window.__SB_SEED__ || { entries: [], watchExtra: [] };

  function ledger() {
    var rows = lsGet(LS_LEDGER, null);
    if (!rows) {
      rows = (SEED.entries || []).slice();
      lsSet(LS_LEDGER, rows);
    }
    return rows;
  }
  function saveLedger(rows) {
    lsSet(LS_LEDGER, rows);
  }

  // ── The stock list ───────────────────────────────────────────────
  var DEFAULT_STOCKS = [
    { ticker: "NVDA", name: "NVIDIA" },
    { ticker: "GOOGL", name: "Google" },
    { ticker: "MSTR", name: "MicroStrategy" },
    { ticker: "TSLA", name: "Tesla" },
    { ticker: "META", name: "Meta" },
    { ticker: "PLTR", name: "Palantir" },
    { ticker: "COIN", name: "Coinbase" },
  ];
  var TICKER_RE = /^[A-Za-z]{1,5}(\.[A-Za-z]{1,2})?$/;

  function ensureWatchlist() {
    var stored = lsGet(LS_WATCH, null);
    if (!stored) {
      stored = DEFAULT_STOCKS.map(function (s) {
        return { ticker: s.ticker, name: s.name, locked: true };
      });
      (SEED.watchExtra || []).forEach(function (s) {
        if (!stored.some(function (x) { return x.ticker === s.ticker; })) {
          stored.push({ ticker: s.ticker, name: s.name, locked: !!s.locked });
        }
      });
      lsSet(LS_WATCH, stored);
    }
    return stored;
  }

  // ── Bars / Heikin-Ashi ───────────────────────────────────────────
  function toHa(bars) {
    var out = [];
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      var haC = (b.o + b.h + b.l + b.c) / 4;
      var prev = out[out.length - 1];
      var haO = prev ? (prev.haO + prev.haC) / 2 : (b.o + b.c) / 2;
      out.push({ t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v, haO: haO, haC: haC });
    }
    return out;
  }
  function aggregateMinutes(bars, minutes) {
    var span = minutes * 60;
    var buckets = new Map();
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      var key = Math.floor(b.t / span) * span;
      var cur = buckets.get(key);
      if (!cur) buckets.set(key, { t: key, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v });
      else {
        cur.h = Math.max(cur.h, b.h);
        cur.l = Math.min(cur.l, b.l);
        cur.c = b.c;
        cur.v += b.v;
      }
    }
    return Array.from(buckets.values()).sort(function (a, b) { return a.t - b.t; });
  }
  function mergeBars(bars) {
    var first = bars[0];
    if (!first) return null;
    var h = first.h, l = first.l, v = 0, c = first.c;
    for (var i = 0; i < bars.length; i++) {
      var b = bars[i];
      h = Math.max(h, b.h);
      l = Math.min(l, b.l);
      v += b.v;
      c = b.c;
    }
    return { t: first.t, o: first.o, h: h, l: l, c: c, v: v };
  }

  // ── NYC time ─────────────────────────────────────────────────────
  function etParts(now) {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
    }).formatToParts(now);
    function get(type) {
      var p = parts.find(function (x) { return x.type === type; });
      return p ? p.value : "";
    }
    return { weekday: get("weekday"), minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")) };
  }
  function etDateKey(d) {
    var parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(d);
    function get(type) {
      var p = parts.find(function (x) { return x.type === type; });
      return p ? p.value : "";
    }
    return get("year") + "-" + get("month") + "-" + get("day");
  }
  function marketOpenNow(now) {
    var p = etParts(now);
    var tradingDay = ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(p.weekday) >= 0;
    return tradingDay && p.minutes >= 570 && p.minutes < 960;
  }
  function fmtNyc(d) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short", day: "numeric", hour: "numeric",
      minute: "2-digit", second: "2-digit", hour12: true,
    }).format(d) + " NYC";
  }
  function weekKey(dateKey) {
    var parts = dateKey.split("-").map(Number);
    var dt = new Date(Date.UTC(parts[0] || 1970, (parts[1] || 1) - 1, parts[2] || 1));
    var dow = dt.getUTCDay();
    var shift = dow === 0 ? -6 : 1 - dow;
    dt.setUTCDate(dt.getUTCDate() + shift);
    return dt.toISOString().slice(0, 10);
  }

  // ── Reads ────────────────────────────────────────────────────────
  function heldRead(tf, office, bot, job, price) {
    return {
      tf: tf, office: office, bot: bot, job: job,
      direction: null, state: "HELD", call: "HELD — NO READ YET", held: true,
      pushing: false, showingSigns: false, slowing: false, bigMove: false, bigMoveHeld: false,
      price: price, haOpen: null, haClose: null, bodyPct: null, spreadFig: null, spreadPct: null,
      note: "Read held — not enough candles on this timeframe yet. No figure is shown rather than a stale one dressed as current.",
      signalCode: "0x00", candleTime: null,
    };
  }
  function makeRead(tf, office, bot, job, bars, price, sierraGate) {
    if (bars.length < 3) return heldRead(tf, office, bot, job, price);
    var ha = toHa(bars);
    var last = ha[ha.length - 1];
    var prev = ha[ha.length - 2];
    if (!last || !prev) return heldRead(tf, office, bot, job, price);
    var direction = last.haC >= last.haO ? "GREEN" : "RED";
    var body = Math.abs(last.haC - last.haO);
    var prevBody = Math.abs(prev.haC - prev.haO);
    var bodyPct = last.haC !== 0 ? (body / last.haC) * 100 : 0;
    var aligned = direction === "GREEN" ? price >= last.haO : price <= last.haO;
    var growing = body >= prevBody;
    var bodyRatio = prevBody > 0 ? body / prevBody : 1;
    var prevRaw = bars[bars.length - 2];
    var lastRaw = bars[bars.length - 1];
    var pullback = prevRaw
      ? direction === "GREEN" ? price < prevRaw.c : price > prevRaw.c
      : false;
    var pushing = aligned && growing;
    var mildShrink = !growing && bodyRatio >= 0.65;
    var hardShrink = !growing && bodyRatio < 0.65;
    var slowing = hardShrink;
    var showingSigns = mildShrink;
    if (sierraGate) {
      slowing = hardShrink && pullback;
      showingSigns = mildShrink || (hardShrink && !pullback);
    }
    var recent = ha.slice(-6, -1);
    var avgBody = recent.length > 0
      ? recent.reduce(function (s, b) { return s + Math.abs(b.haC - b.haO); }, 0) / recent.length
      : prevBody;
    var bigMove = avgBody > 0 && body > 1.8 * avgBody && aligned;
    var bigMoveHeld = false;
    if (sierraGate && bigMove && lastRaw && prevRaw) {
      if (lastRaw.h - lastRaw.l < prevRaw.h - prevRaw.l) {
        bigMove = false;
        bigMoveHeld = true;
      }
    }
    var spreadFig = lastRaw ? lastRaw.h - lastRaw.l : 0;
    var spreadPct = price > 0 ? (spreadFig / price) * 100 : 0;
    var state = bigMove ? "BIG MOVE"
      : pushing ? "PUSHING"
      : slowing ? "SLOWING"
      : showingSigns ? "SHOWING SIGNS OF SLOWING"
      : "HOLDING";
    var call = state === "BIG MOVE" ? direction + " ARMY PUSHING — BIG MOVE"
      : state === "PUSHING" ? direction + " ARMY PUSHING"
      : state === "SLOWING" ? direction + " ARMY SLOWING"
      : state === "SHOWING SIGNS OF SLOWING" ? direction + " ARMY SHOWING SIGNS OF SLOWING"
      : direction + " ARMY HOLDING";
    var note = bigMoveHeld
      ? "Big-move call held back — the latest candle is littler than the one before (Sierra's learned rule)."
      : slowing && sierraGate
        ? "Slowing confirmed: candle shrinking hard and price pulling back (Sierra's gate)."
        : slowing
          ? "The forming candle is shrinking hard against the one before — the army is slowing."
          : showingSigns
            ? "The forming candle is shrinking against the one before — the army is showing signs of slowing."
            : pushing
              ? "Price is riding the forming Heikin-Ashi candle in the army's direction."
              : "Forming Heikin-Ashi candle holds its color; price has not pushed past it.";
    var bits = 0;
    if (direction === "GREEN") bits |= 1;
    if (pushing) bits |= 2;
    if (slowing) bits |= 4;
    if (bigMove) bits |= 8;
    if (pullback) bits |= 16;
    if (aligned) bits |= 32;
    if (showingSigns) bits |= 64;
    return {
      tf: tf, office: office, bot: bot, job: job, direction: direction, state: state,
      call: call, held: false, pushing: pushing, showingSigns: showingSigns,
      slowing: slowing, bigMove: bigMove, bigMoveHeld: bigMoveHeld,
      price: price, haOpen: last.haO, haClose: last.haC, bodyPct: bodyPct,
      spreadFig: spreadFig, spreadPct: spreadPct, note: note,
      signalCode: "0x" + bits.toString(16).toUpperCase().padStart(2, "0"),
      candleTime: fmtNyc(new Date(last.t * 1000)),
    };
  }
  function tempFrame(tf, bars, kind) {
    if (bars.length < 2) return null;
    var ha = toHa(bars);
    var last = ha[ha.length - 1];
    var prev = ha[ha.length - 2];
    if (!last || !prev) return null;
    var light = last.haC >= last.haO ? "GREEN" : "RED";
    var level = kind === "bottom" ? last.l : last.h;
    var fresh = kind === "bottom" ? last.l < prev.l : last.h > prev.h;
    var call = kind === "bottom"
      ? fresh ? "TEMP BOTTOM — FRESH EXTENSION" : "TEMP BOTTOM LEVEL RIDING THE CANDLE"
      : fresh ? "TEMP TOP — FRESH EXTENSION" : "TEMP TOP LEVEL RIDING THE CANDLE";
    return { tf: tf, light: light, call: call, level: level, fresh: fresh };
  }

  // ── Feed: Nasdaq (primary) · Yahoo (fallback) ────────────────────
  // Captured before the action shim is installed below, so data calls
  // never route through the shim itself.
  var rawFetch = window.fetch.bind(window);
  var cache = new Map();
  var CACHE_MS = 20000;
  function ttlFor(key) {
    if (IN_DISCORD) return CACHE_MS;
    // Open-web relay mode: the relay is a shared free door and every
    // call is a coin flip, so the slow frames are fetched rarely —
    // daily/weekly/monthly sets hold for minutes, not seconds. The
    // forming frames still merge off the fresh intraday bars.
    if (/:1wk:|:1mo:|:1d:|nasdaq-daily/.test(key)) return 5 * 60000;
    if (/:30m:/.test(key)) return 60000;
    return CACHE_MS;
  }
  function cached(key, fn) {
    var hit = cache.get(key);
    if (hit && Date.now() - hit.at < ttlFor(key)) return Promise.resolve(hit.value);
    return fn().then(function (value) {
      cache.set(key, { at: Date.now(), value: value });
      return value;
    });
  }
  function fetchRaw(url, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms);
    return rawFetch(url, { headers: { Accept: "application/json" }, signal: ctrl.signal })
      .finally(function () { clearTimeout(timer); });
  }
  function fetchJsonDirect(url) {
    return fetchRaw(url, 9000).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    });
  }

  // ── THE OPEN-WEB RELAY (plain browser / OBS — never inside Discord) ──
  // Nasdaq and Yahoo send no CORS headers, so outside Discord every
  // data call rides the allorigins relay, which echoes the page's own
  // origin back in Access-Control-Allow-Origin (verified Nov 17, 2026
  // from this copy's GitHub origin, with real Yahoo chart JSON, real
  // daily bars and real news items parsed off its answers). The relay
  // is a shared free door: any single attempt can stall past its edge
  // limit or fail outright, while the next attempt lands in seconds —
  // so each call is retried across the relay's two endpoints, paced
  // through a queue (never a parallel burst).
  // Nasdaq itself never answered through the relay in testing
  // (timeouts on every attempt), so in this mode nasdaqChart and
  // nasdaqDaily stand down at once and the Yahoo fallbacks — already
  // the board's own second door — carry the board.
  //
  // FAIL-FAST (Warlord order, Nov 18, 2026 — copy only): the night of
  // Nov 17–18 the relay went DOWN (522/500, 17–23s an attempt) and a
  // ticker switch burned 3 attempts × 30s × 5 chart calls through the
  // serial queue — 5–7½ minutes of "every office is turning" before
  // the saved-board fallback. Now light frames (the intraday, news
  // and commentary calls) get 8s an attempt, while the fat historical
  // payloads (1d · 1wk · 1mo — multi-year bar sets that legitimately
  // ride slow) keep 18s. And once two relay attempts in a row have
  // failed, the relay stands proven down for a 20s window: attempts
  // still queued refuse at once instead of burning their full
  // timeouts, so a dead relay reaches the saved-board fallback in
  // well under a minute. A landed attempt clears the proof at once.
  // With the relay answering, none of this engages — same calls,
  // same data, same board.
  var AO_BASE = "https://api.allorigins.win";
  var relayTail = Promise.resolve();
  var relayFailStreak = 0;
  var relayDownUntil = 0;
  function relayTimeoutFor(url) {
    return /[?&]interval=(1d|1wk|1mo)(&|$)/.test(url) ? 18000 : 8000;
  }
  function throughRelay(fn) {
    var p = relayTail.then(function () {
      return new Promise(function (resolve) { setTimeout(resolve, 350); }).then(function () {
        if (Date.now() < relayDownUntil) throw new Error("relay proven down — failing fast");
        return fn().then(function (value) {
          relayFailStreak = 0;
          return value;
        }, function (err) {
          relayFailStreak += 1;
          if (relayFailStreak >= 2) relayDownUntil = Date.now() + 20000;
          throw err;
        });
      });
    });
    relayTail = p.then(function () {}, function () {});
    return p;
  }
  function aoGet(url, ms) {
    return fetchRaw(AO_BASE + "/get?url=" + encodeURIComponent(url), ms)
      .then(function (res) {
        if (!res.ok) throw new Error("relay HTTP " + res.status);
        return res.json();
      })
      .then(function (outer) {
        if (!outer || typeof outer.contents !== "string") throw new Error("relay answer unparsable");
        if (outer.status && outer.status.http_code >= 400) throw new Error("relay upstream HTTP " + outer.status.http_code);
        return JSON.parse(outer.contents);
      });
  }
  function aoRaw(url, ms) {
    return fetchRaw(AO_BASE + "/raw?url=" + encodeURIComponent(url), ms)
      .then(function (res) {
        if (!res.ok) throw new Error("relay HTTP " + res.status);
        return res.json();
      });
  }
  function relayedJson(url) {
    var ms = relayTimeoutFor(url);
    var attempts = [
      function () { return aoGet(url, ms); },
      function () { return aoRaw(url, ms); },
      function () { return aoGet(url, ms); },
    ];
    var chain = Promise.reject(new Error("relay chain start"));
    attempts.forEach(function (fn) {
      chain = chain.catch(function () { return throughRelay(fn); });
    });
    return chain;
  }
  function fetchJson(url) {
    if (IN_DISCORD) return fetchJsonDirect(url);
    return relayedJson(url);
  }
  function numOrNull(v) {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
    if (typeof v === "string") {
      var n = Number(v.replace(/[$,%]/g, "").replace(/,/g, "").trim());
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }
  function nasdaqChart(ticker) {
    // Open-web mode: stand down at once (see THE OPEN-WEB RELAY) —
    // the coded Yahoo 1m fallback below carries the intraday bars.
    if (!IN_DISCORD) return Promise.reject(new Error("Nasdaq has no open-web door"));
    return fetchJson(NSD + "/api/quote/" + encodeURIComponent(ticker) + "/chart?assetclass=stocks")
      .then(function (json) {
        var data = json && json.data;
        if (!data || !Array.isArray(data.chart) || data.chart.length === 0) throw new Error("Nasdaq chart empty");
        var bars = [];
        data.chart.forEach(function (pt) {
          var z = (pt && pt.z) || {};
          var o = numOrNull(z.open);
          var h = numOrNull(z.high);
          var l = numOrNull(z.low);
          var c = numOrNull(z.close) != null ? numOrNull(z.close) : (typeof (pt && pt.y) === "number" ? pt.y : null);
          var t = typeof (pt && pt.x) === "number" ? Math.floor(pt.x / 1000) : null;
          if (o == null || h == null || l == null || c == null || t == null) return;
          bars.push({ t: t, o: o, h: h, l: l, c: c, v: numOrNull(z.volume) || 0 });
        });
        if (bars.length === 0) throw new Error("Nasdaq chart unparsable");
        bars.sort(function (a, b) { return a.t - b.t; });
        var lastBar = bars[bars.length - 1];
        var prevClose = numOrNull(data.previousClose) != null ? numOrNull(data.previousClose) : (bars[0] ? bars[0].o : null);
        var price = lastBar ? lastBar.c : null;
        var change = price != null && prevClose != null ? price - prevClose : null;
        var changePct = change != null && prevClose ? (change / prevClose) * 100 : null;
        return { bars: bars, quote: { price: price, change: change, changePct: changePct, name: data.company || null } };
      });
  }
  function nasdaqDaily(ticker) {
    // Open-web mode: stand down at once (see THE OPEN-WEB RELAY) —
    // the coded Yahoo 1d fallback below carries the daily bars.
    if (!IN_DISCORD) return Promise.reject(new Error("Nasdaq has no open-web door"));
    return fetchJson(NSD + "/api/quote/" + encodeURIComponent(ticker) + "/historical?assetclass=stocks&fromdate=2023-01-01&limit=9999")
      .then(function (json) {
        var rows = json && json.data && json.data.tradesTable && json.data.tradesTable.rows;
        if (!Array.isArray(rows) || rows.length === 0) throw new Error("Nasdaq historical empty");
        var bars = [];
        rows.forEach(function (r) {
          var dateStr = typeof r.date === "string" ? r.date : "";
          var t = Math.floor(new Date(dateStr).getTime() / 1000);
          var o = numOrNull(r.open);
          var h = numOrNull(r.high);
          var l = numOrNull(r.low);
          var c = numOrNull(r.close);
          if (Number.isNaN(t) || o == null || h == null || l == null || c == null) return;
          bars.push({ t: t, o: o, h: h, l: l, c: c, v: numOrNull(r.volume) || 0 });
        });
        if (bars.length === 0) throw new Error("Nasdaq historical unparsable");
        bars.sort(function (a, b) { return a.t - b.t; });
        return bars;
      });
  }
  function yahooBars(ticker, interval, range) {
    // Open-web relay mode: only the last session of 1m bars is ever
    // read (the latest day's bars drive every intraday frame), and
    // the one-day payload beats the relay's stall limit far more
    // often than the five-day one. Discord mode is unchanged.
    if (!IN_DISCORD && interval === "1m" && range === "5d") range = "1d";
    return fetchJson(YHO + "/v8/finance/chart/" + encodeURIComponent(ticker) + "?interval=" + interval + "&range=" + range + "&includePrePost=false")
      .then(function (json) {
        var result = json && json.chart && json.chart.result && json.chart.result[0];
        var ts = (result && result.timestamp) || [];
        var q = result && result.indicators && result.indicators.quote && result.indicators.quote[0];
        if (!result || !q || ts.length === 0) throw new Error("Yahoo chart empty");
        var bars = [];
        for (var i = 0; i < ts.length; i++) {
          var o = q.open && q.open[i];
          var h = q.high && q.high[i];
          var l = q.low && q.low[i];
          var c = q.close && q.close[i];
          var t = ts[i];
          if (o == null || h == null || l == null || c == null || t == null) continue;
          bars.push({ t: t, o: o, h: h, l: l, c: c, v: (q.volume && q.volume[i]) || 0 });
        }
        if (bars.length === 0) throw new Error("Yahoo chart unparsable");
        bars.sort(function (a, b) { return a.t - b.t; });
        return bars;
      });
  }
  // His crypto ledger prices: the house channel has no browser door,
  // so this copy reads the SYMBOL-USD tape off Yahoo.
  function cryptoPrice(symbol) {
    return yahooBars(symbol + "-USD", "1d", "5d")
      .then(function (bars) {
        var last = bars[bars.length - 1];
        return last && last.c > 0 ? last.c : null;
      })
      .catch(function () { return null; });
  }

  // ── Entries & Exits hits (local record) ──────────────────────────
  function hitStore() {
    return lsGet(LS_HITS, {});
  }
  function saveHitStore(store) {
    lsSet(LS_HITS, store);
  }

  // ── The board ────────────────────────────────────────────────────
  function buildBoard(ticker) {
    var now = new Date();
    var open = marketOpenNow(now);
    var sources = new Set();
    var bars1m = [];
    var quote = { price: null, change: null, changePct: null, name: null, high: null, low: null };
    var bars30 = [];
    var dailyRaw = [];
    var weeklyRaw = [];
    var monthlyRaw = [];

    var p1 = cached("nasdaq-chart:" + ticker, function () { return nasdaqChart(ticker); })
      .then(function (nq) {
        bars1m = nq.bars;
        quote = { price: nq.quote.price, change: nq.quote.change, changePct: nq.quote.changePct, name: nq.quote.name, high: null, low: null };
        sources.add("Nasdaq public API (primary)");
      })
      .catch(function () {
        return cached("yahoo:1m:" + ticker, function () { return yahooBars(ticker, "1m", "5d"); })
          .then(function (bars) {
            bars1m = bars;
            sources.add("Yahoo Finance chart API (fallback)");
          })
          .catch(function () { /* no browser door left — board stands held/stale */ });
      });
    var p2 = cached("yahoo:30m:" + ticker, function () { return yahooBars(ticker, "30m", "3mo"); })
      .then(function (bars) {
        bars30 = bars;
        sources.add("Yahoo Finance chart API (fallback)");
      })
      .catch(function () {});
    var p3 = cached("nasdaq-daily:" + ticker, function () { return nasdaqDaily(ticker); })
      .then(function (bars) {
        dailyRaw = bars;
        sources.add("Nasdaq public API (primary)");
      })
      .catch(function () {
        return cached("yahoo:1d:" + ticker, function () { return yahooBars(ticker, "1d", "2y"); })
          .then(function (bars) {
            dailyRaw = bars;
            sources.add("Yahoo Finance chart API (fallback)");
          })
          .catch(function () {});
      });
    var p4 = cached("yahoo:1wk:" + ticker, function () { return yahooBars(ticker, "1wk", "5y"); })
      .then(function (bars) { weeklyRaw = bars; })
      .catch(function () {});
    var p5 = cached("yahoo:1mo:" + ticker, function () { return yahooBars(ticker, "1mo", "10y"); })
      .then(function (bars) { monthlyRaw = bars; })
      .catch(function () {});

    return Promise.all([p1, p2, p3, p4, p5]).then(function () {
      if (bars1m.length === 0 && dailyRaw.length === 0) throw new Error("No feed answered for this stock.");

      var lastIntra = bars1m[bars1m.length - 1];
      var price = quote.price != null ? quote.price
        : lastIntra ? lastIntra.c
        : dailyRaw.length ? dailyRaw[dailyRaw.length - 1].c : 0;
      var prevDailyBar = dailyRaw[dailyRaw.length - 1];
      var prevClose = prevDailyBar ? prevDailyBar.c : null;
      var latestKey = lastIntra ? etDateKey(new Date(lastIntra.t * 1000)) : etDateKey(now);
      var todayBars = bars1m.filter(function (b) { return etDateKey(new Date(b.t * 1000)) === latestKey; });
      var dayHigh = quote.high != null ? quote.high : (todayBars.length ? Math.max.apply(null, todayBars.map(function (b) { return b.h; })) : null);
      var dayLow = quote.low != null ? quote.low : (todayBars.length ? Math.min.apply(null, todayBars.map(function (b) { return b.l; })) : null);
      var daySpread = dayHigh != null && dayLow != null ? dayHigh - dayLow : null;
      var change = quote.change != null ? quote.change : (prevClose != null && price ? price - prevClose : null);
      var changePct = quote.changePct != null ? quote.changePct : (change != null && prevClose ? (change / prevClose) * 100 : null);

      var dailyBars = dailyRaw.slice();
      var todayBar = mergeBars(todayBars);
      if (todayBar) {
        var lastDailyDateStr = prevDailyBar ? new Date(prevDailyBar.t * 1000).toISOString().slice(0, 10) : "";
        if (lastDailyDateStr !== latestKey) dailyBars.push(todayBar);
        else if (dailyBars.length > 0) dailyBars[dailyBars.length - 1] = todayBar;
      }
      var todayKeyNow = etDateKey(now);
      var thisWeek = weekKey(todayKeyNow);
      var weekBarsFromDaily = dailyBars.filter(function (b) {
        return weekKey(new Date(b.t * 1000).toISOString().slice(0, 10)) === thisWeek;
      });
      var formingWeek = mergeBars(weekBarsFromDaily);
      var weeklyBars = weeklyRaw.length >= 3 ? weeklyRaw.slice() : [];
      if (formingWeek) {
        var lastW = weeklyBars[weeklyBars.length - 1];
        if (lastW && weekKey(new Date(lastW.t * 1000).toISOString().slice(0, 10)) === thisWeek) {
          weeklyBars[weeklyBars.length - 1] = formingWeek;
        } else weeklyBars.push(formingWeek);
      }
      if (weeklyBars.length < 3) {
        var byWeek = new Map();
        dailyBars.forEach(function (b) {
          var k = weekKey(new Date(b.t * 1000).toISOString().slice(0, 10));
          var arr = byWeek.get(k) || [];
          arr.push(b);
          byWeek.set(k, arr);
        });
        weeklyBars = [];
        Array.from(byWeek.keys()).sort().forEach(function (k) {
          var merged = mergeBars(byWeek.get(k) || []);
          if (merged) weeklyBars.push(merged);
        });
      }
      var thisMonth = todayKeyNow.slice(0, 7);
      var monthBarsFromDaily = dailyBars.filter(function (b) {
        return new Date(b.t * 1000).toISOString().slice(0, 7) === thisMonth;
      });
      var formingMonth = mergeBars(monthBarsFromDaily);
      var monthlyBars = monthlyRaw.length >= 3 ? monthlyRaw.slice() : [];
      if (formingMonth) {
        var lastM = monthlyBars[monthlyBars.length - 1];
        if (lastM && new Date(lastM.t * 1000).toISOString().slice(0, 7) === thisMonth) {
          monthlyBars[monthlyBars.length - 1] = formingMonth;
        } else monthlyBars.push(formingMonth);
      }
      if (monthlyBars.length < 3) {
        var byMonth = new Map();
        dailyBars.forEach(function (b) {
          var k = new Date(b.t * 1000).toISOString().slice(0, 7);
          var arr = byMonth.get(k) || [];
          arr.push(b);
          byMonth.set(k, arr);
        });
        monthlyBars = [];
        Array.from(byMonth.keys()).sort().forEach(function (k) {
          var merged = mergeBars(byMonth.get(k) || []);
          if (merged) monthlyBars.push(merged);
        });
      }

      var bars3m = aggregateMinutes(bars1m, 3);
      var bars1h = aggregateMinutes(bars30.length ? bars30 : bars1m, 60);
      var bars4h = aggregateMinutes(bars30.length ? bars30 : bars1m, 240);
      var bars6h = aggregateMinutes(bars30.length ? bars30 : bars1m, 360);

      var sierra = makeRead("3M", "Sierra's Office — Three-Minute Reader", "Sierra", "Three-minute reader", bars3m, price, true);
      var mina = makeRead("1M", "Mina's Office — One-Minute Reader", "Mina", "One-minute reader", bars1m, price, false);
      var sable = makeRead("6H", "Sable's Office — Spread Watch", "Sable", "Six-hour spread watch", bars6h, price, false);
      var tfDefs = [
        { tf: "1H", office: "1H Reader Office", bot: "1H Reader", job: "One-hour timeframe reader", bars: bars1h },
        { tf: "4H", office: "4H Reader Office", bot: "4H Reader", job: "Four-hour timeframe reader", bars: bars4h },
        { tf: "6H", office: "6H Reader Office", bot: "6H Reader", job: "Six-hour timeframe reader", bars: bars6h },
        { tf: "DAY", office: "DAY Reader Office", bot: "DAY Reader", job: "Day timeframe reader", bars: dailyBars },
        { tf: "WEEK", office: "WEEK Reader Office", bot: "WEEK Reader", job: "Week timeframe reader", bars: weeklyBars },
        { tf: "MONTH", office: "MONTH Reader Office", bot: "MONTH Reader", job: "Month timeframe reader", bars: monthlyBars },
      ];
      var tfReads = tfDefs.map(function (d) { return makeRead(d.tf, d.office, d.bot, d.job, d.bars, price, false); });
      var reads = [mina, sierra].concat(tfReads);
      var byTf = new Map(reads.map(function (r) { return [r.tf, r]; }));

      var tempBarsByTf = { MONTH: monthlyBars, WEEK: weeklyBars, DAY: dailyBars, "4H": bars4h, "6H": bars6h };
      var tempOrder = ["MONTH", "WEEK", "DAY", "6H", "4H"];
      var terraFrames = tempOrder.map(function (tf) { return tempFrame(tf, tempBarsByTf[tf] || [], "bottom"); }).filter(Boolean);
      var vegaFrames = tempOrder.map(function (tf) { return tempFrame(tf, tempBarsByTf[tf] || [], "top"); }).filter(Boolean);
      var greenCount = terraFrames.filter(function (f) { return f.light === "GREEN"; }).length;
      var freshBottoms = terraFrames.filter(function (f) { return f.fresh; }).length;
      var freshTops = vegaFrames.filter(function (f) { return f.fresh; }).length;
      function framesPhrase(n) { return n === 5 ? "all five frames" : n + " of the five frames"; }
      var terraVerdict = terraFrames.length === 0
        ? "HELD — no temp bottom read yet."
        : "Temp bottoms stand on " + framesPhrase(terraFrames.length) + " — " + greenCount + " green, " + (terraFrames.length - greenCount) + " red." + (freshBottoms ? " " + freshBottoms + " fresh extension" + (freshBottoms === 1 ? "" : "s") + " fired." : "") + " Levels ride the forming Heikin-Ashi candles.";
      var vegaVerdict = vegaFrames.length === 0
        ? "HELD — no temp top read yet."
        : "Temp tops stand on " + framesPhrase(vegaFrames.length) + " — " + greenCount + " green, " + (vegaFrames.length - greenCount) + " red." + (freshTops ? " " + freshTops + " fresh extension" + (freshTops === 1 ? "" : "s") + " fired." : "") + " Light law: the majority light rules the board.";

      var liveReads = reads.filter(function (r) { return !r.held; });
      var greens = liveReads.filter(function (r) { return r.direction === "GREEN"; }).length;
      var ownerDirection = liveReads.length === 0 ? null
        : greens > liveReads.length / 2 ? "GREEN"
        : greens < liveReads.length / 2 ? "RED"
        : ((byTf.get("DAY") || {}).direction || (liveReads[0] || {}).direction || null);
      var ownerCount = ownerDirection === "GREEN" ? greens : liveReads.length - greens;
      var ownerCall = ownerDirection
        ? ownerDirection + " ARMY PUSHING — " + ownerCount + " of " + liveReads.length + " timeframes read " + ownerDirection.toLowerCase() + " on " + ticker
        : "No direction read yet — reads held.";

      // Entries and Exits — bottoms and tops only, ranked MONTH · WEEK · DAY · 6H.
      var rankWords = ["BEST", "SECOND", "THIRD", "FOURTH"];
      var frameDefs = [
        { frame: "MONTH", bars: monthlyBars, candleKey: thisMonth },
        { frame: "WEEK", bars: weeklyBars, candleKey: thisWeek },
        { frame: "DAY", bars: dailyBars, candleKey: latestKey },
        { frame: "6H", bars: bars6h, candleKey: bars6h.length ? new Date((bars6h[bars6h.length - 1] || {}).t * 1000 || 0).toISOString() : "none" },
      ];
      var levels = [];
      frameDefs.forEach(function (fd, idx) {
        var lastBar = fd.bars[fd.bars.length - 1];
        if (!lastBar) return;
        var rank = idx + 1;
        var rankWord = rankWords[idx] || "NEXT";
        levels.push({
          id: fd.frame + "-BOTTOM", frame: fd.frame, side: "BOTTOM", rank: rank,
          label: fd.frame + " BOTTOM — " + rankWord + " ENTRY LONG",
          meaning: "enter long · exit short", price: lastBar.l, candleKey: fd.candleKey,
        });
        levels.push({
          id: fd.frame + "-TOP", frame: fd.frame, side: "TOP", rank: rank,
          label: fd.frame + " TOP — " + rankWord + " ENTRY SHORT",
          meaning: "enter short · exit long", price: lastBar.h, candleKey: fd.candleKey,
        });
      });
      var store = hitStore();
      var active = [];
      var hitLabelById = new Map(levels.map(function (l) { return [l.id, l.label]; }));
      var currentCandleKeys = new Set(levels.map(function (l) { return l.candleKey; }));
      levels.forEach(function (lv) {
        var tol = Math.max(lv.price * 0.003, 0.05);
        var atLevel = price > 0 && Math.abs(price - lv.price) <= tol;
        if (!atLevel) return;
        active.push(lv.id);
        var hitId = ticker + "|" + lv.candleKey + "|" + lv.id;
        if (!store[hitId]) {
          store[hitId] = {
            ticker: ticker, monthKey: lv.candleKey, point: lv.id,
            pointPrice: lv.price, hitPrice: price,
            hitAtEt: fmtNyc(now), hitAtMs: now.getTime(),
          };
        }
      });
      saveHitStore(store);
      var hits = Object.keys(store)
        .map(function (k) { return store[k]; })
        .filter(function (h) { return h.ticker === ticker && currentCandleKeys.has(h.monthKey); })
        .sort(function (a, b) { return a.hitAtMs - b.hitAtMs; })
        .map(function (h) {
          return {
            level: h.point,
            label: hitLabelById.get(h.point) || h.point.replace("-", " "),
            pointPrice: h.pointPrice, hitPrice: h.hitPrice, timeEt: h.hitAtEt,
          };
        });
      var fourPoints = {
        levels: levels.map(function (l) {
          return { id: l.id, frame: l.frame, side: l.side, rank: l.rank, label: l.label, meaning: l.meaning, price: l.price };
        }),
        active: active,
        hits: hits,
      };

      var pushingCount = liveReads.filter(function (r) { return r.pushing; }).length;
      var portia = liveReads.length
        ? "Portia's board synthesis on " + ticker + ": " + greens + " of " + liveReads.length + " timeframes green, " + (liveReads.length - greens) + " red. " + pushingCount + " office" + (pushingCount === 1 ? "" : "s") + " pushing right now. Headline call: " + ownerCall + ". Every office is reading the same stock — the board turned as one."
        : "Portia is waiting on the first full read of the board — reads held.";
      var veda = open
        ? "Veda's record: market OPEN, board live on " + ticker + ". Learn-and-report law stands — every bot reads off the record, reports what the candle says, and any miss becomes a rule fix that gets written down. This crew's grade records are fresh: still building, nothing carried over from the crypto floor."
        : "Veda's record: market CLOSED, board reading the last session on " + ticker + ". Nothing pretends to be live after the bell. Learn-and-report law stands, and this crew's grade records are fresh: still building.";

      var dataSource = Array.from(sources).join(" · ") || "Yahoo Finance chart API (fallback)";
      var listRow = ensureWatchlist().find(function (s) { return s.ticker === ticker; });
      var listName = listRow ? listRow.name : (DEFAULT_STOCKS.find(function (s) { return s.ticker === ticker; }) || {}).name || null;
      var feedName = quote.name && quote.name.toUpperCase() !== ticker ? quote.name : null;
      var company = listName && listName.toUpperCase() !== ticker ? listName : (feedName || listName || ticker);

      return {
        ok: true,
        stale: false,
        error: null,
        ticker: ticker,
        company: company,
        price: price || null,
        change: change,
        changePct: changePct,
        dayHigh: dayHigh,
        dayLow: dayLow,
        prevClose: prevClose,
        spreadFig: daySpread,
        spreadPct: daySpread != null && price > 0 ? (daySpread / price) * 100 : null,
        marketOpen: open,
        marketLabel: open ? "MARKET OPEN" : "MARKET CLOSED",
        frozenNote: open ? null : "Board down — market closed. Reads stand on the last session; after the close you can't do nothing.",
        asOfEt: fmtNyc(now),
        feedNote: "Data source: " + dataSource + ". Free stock data may be delayed. When the market is closed the board reads the last session and says CLOSED.",
        dataSource: dataSource,
        ownerDirection: ownerDirection,
        ownerCall: ownerCall,
        reads: reads,
        sable: sable,
        terra: { frames: terraFrames, verdict: terraVerdict },
        vega: { frames: vegaFrames, verdict: vegaVerdict },
        fourPoints: fourPoints,
        portia: portia,
        veda: veda,
      };
    });
  }

  function errorBoard(ticker, err) {
    var now = new Date();
    var open = marketOpenNow(now);
    function held(tf, office, bot, job) { return heldRead(tf, office, bot, job, 0); }
    return {
      ok: false,
      stale: false,
      error: "The stock feed did not answer for " + ticker + ". Tap Refresh to try again. (" + (err && err.message ? err.message : "feed error") + ")",
      ticker: ticker,
      company: ticker,
      price: null, change: null, changePct: null,
      dayHigh: null, dayLow: null, prevClose: null,
      spreadFig: null, spreadPct: null,
      marketOpen: open,
      marketLabel: open ? "MARKET OPEN" : "MARKET CLOSED",
      frozenNote: open ? null : "Board down — market closed.",
      asOfEt: fmtNyc(now),
      feedNote: "Data source: Nasdaq public API (primary) · Yahoo Finance chart API (fallback). Free stock data may be delayed.",
      dataSource: "none — feed did not answer",
      ownerDirection: null,
      ownerCall: "No direction read yet — reads held.",
      reads: [
        held("1M", "Mina's Office — One-Minute Reader", "Mina", "One-minute reader"),
        held("3M", "Sierra's Office — Three-Minute Reader", "Sierra", "Three-minute reader"),
      ],
      sable: null,
      terra: { frames: [], verdict: "HELD — no temp bottom read yet." },
      vega: { frames: [], verdict: "HELD — no temp top read yet." },
      fourPoints: { levels: [], active: [], hits: [] },
      portia: "Portia is waiting on the first full read of the board.",
      veda: "Veda's record stands by for the first read.",
    };
  }

  // ── The proof pages — recording & grading (local ledger) ─────────
  function gradeRead(direction, call, price, gradedPrice) {
    if (direction == null || gradedPrice === price) return null;
    var followedArmy = direction === "GREEN" ? gradedPrice > price : gradedPrice < price;
    var slowingCall = call.indexOf("SLOWING") >= 0;
    var correct = slowingCall ? !followedArmy : followedArmy;
    return correct ? "CORRECT" : "MISS";
  }
  function auditReason(direction, call, price, gradedPrice) {
    var dir = direction || "";
    var tape = "the tape went from $" + price.toFixed(2) + " to $" + gradedPrice.toFixed(2);
    if (call.indexOf("SLOWING") >= 0) {
      return "the call said the " + dir + " army was slowing — a slowing call holds when the tape moves back against the army, and " + tape;
    }
    return "the call said the " + dir + " army was pushing — a pushing call holds when the tape follows the army, and " + tape;
  }
  var CRYPTO_SYMBOLS = new Set([
    "BTC", "ETH", "LTC", "XRP", "SOL", "DOGE", "ADA", "BNB", "LINK",
    "AVAX", "DOT", "MATIC", "POL", "NEAR", "ATOM", "UNI", "ARB", "OP",
    "INJ", "SUI", "PEPE", "SHIB", "TRX", "BCH", "ETC", "XLM", "HBAR",
  ]);
  var SYMBOL_RE = /^[A-Za-z]{1,10}$/;
  function normalizeSymbol(raw) {
    var s = String(raw || "").trim().toUpperCase();
    if (s.indexOf("/") >= 0) s = s.split("/")[0] || s;
    if (s.slice(-5) === "-USD") s = s.slice(0, -4);
    if (s.slice(-4) === "USDT" && s.length > 4) s = s.slice(0, -4);
    return s;
  }
  function tfDurationMs(tf) {
    switch (tf) {
      case "1M": return 60000;
      case "3M": return 3 * 60000;
      case "1H": return 60 * 60000;
      case "4H": return 4 * 60 * 60000;
      case "6H": return 6 * 60 * 60000;
      case "DAY": return 24 * 60 * 60000;
      case "WEEK": return 7 * 24 * 60 * 60000;
      case "MONTH": return 30 * 24 * 60 * 60000;
      default: return 6 * 60 * 60000;
    }
  }
  function gradeCryptoWarlordCalls(rows) {
    var now = new Date();
    var nowEt = fmtNyc(now);
    var due = rows.filter(function (r) {
      return r.maker === "Longshotwolf" && r.asset === "CRYPTO" && r.kind === "READ" && r.outcome === "OPEN"
        && now.getTime() - (r.recordedAtMs || 0) >= tfDurationMs(r.tf);
    });
    if (due.length === 0) return Promise.resolve(rows);
    var bySymbol = new Map();
    due.forEach(function (r) {
      var arr = bySymbol.get(r.ticker) || [];
      arr.push(r);
      bySymbol.set(r.ticker, arr);
    });
    var changed = false;
    return Promise.all(Array.from(bySymbol.keys()).map(function (symbol) {
      return cryptoPrice(symbol).then(function (price) {
        if (price == null) return;
        bySymbol.get(symbol).forEach(function (row) {
          var grade = gradeRead(row.direction, row.call, row.price, price);
          if (grade == null) return;
          row.outcome = grade;
          row.gradedPrice = price;
          row.gradedEt = nowEt;
          changed = true;
        });
      });
    })).then(function () {
      if (changed) saveLedger(rows);
      return rows;
    });
  }
  function recordProof(board) {
    var rows = ledger();
    var now = new Date();
    var nowEt = fmtNyc(now);
    var price = board.price;
    var changed = false;
    if (price != null) {
      rows.forEach(function (row) {
        if (row.ticker !== board.ticker || row.kind !== "READ" || row.outcome !== "OPEN") return;
        if (row.asset === "CRYPTO") return;
        var current = board.reads.find(function (r) { return r.tf === row.tf; });
        if (!current || current.held || !current.candleTime || current.candleTime === row.candleKey) return;
        var grade = gradeRead(row.direction, row.call, row.price, price);
        if (grade == null) return;
        row.outcome = grade;
        row.gradedPrice = price;
        row.gradedEt = nowEt;
        changed = true;
      });
    }
    board.reads.forEach(function (r) {
      if (r.held || !r.direction || !r.candleTime || r.price == null) return;
      var id = board.ticker + "|" + r.tf + "|" + r.candleTime;
      if (rows.some(function (x) { return x.id === id; })) return;
      rows.push({
        id: id, ticker: board.ticker, asset: "STOCK", kind: "READ", tf: r.tf,
        bot: r.bot, maker: r.bot, auditNote: null, call: r.call, direction: r.direction,
        price: r.price, candleKey: r.candleTime, recordedEt: nowEt,
        recordedAtMs: now.getTime(), outcome: "OPEN", gradedPrice: null, gradedEt: null,
      });
      changed = true;
    });
    board.fourPoints.hits.forEach(function (h) {
      var id = board.ticker + "|HIT|" + h.level + "|" + h.timeEt;
      if (rows.some(function (x) { return x.id === id; })) return;
      rows.push({
        id: id, ticker: board.ticker, asset: "STOCK", kind: "HIT",
        tf: (h.label.split(" ")[0] || ""), bot: "Nova", maker: "Nova", auditNote: null,
        call: h.label + " — HIT", direction: null, price: h.hitPrice,
        candleKey: h.timeEt, recordedEt: h.timeEt, recordedAtMs: now.getTime(),
        outcome: "RECORDED", gradedPrice: null, gradedEt: null,
      });
      changed = true;
    });
    if (changed) saveLedger(rows);
  }
  function loadProof(tickerArg, page) {
    page = page || "readers";
    var rows = ledger().slice().sort(function (a, b) { return (b.recordedAtMs || 0) - (a.recordedAtMs || 0); });
    if (tickerArg) {
      var t = tickerArg.trim().toUpperCase();
      rows = rows.filter(function (r) { return r.ticker === t; });
    }
    rows = rows.filter(function (r) {
      return page === "warlord" ? (r.maker || r.bot) === "Longshotwolf" : (r.maker || r.bot) !== "Longshotwolf";
    });
    var reads = rows.filter(function (r) { return r.kind === "READ"; });
    var correct = reads.filter(function (r) { return r.outcome === "CORRECT"; }).length;
    var misses = reads.filter(function (r) { return r.outcome === "MISS"; }).length;
    return {
      entries: rows.slice(0, 120).map(function (r) {
        return {
          id: r.id, ticker: r.ticker, asset: r.asset || "STOCK", kind: r.kind, tf: r.tf,
          bot: r.bot, maker: r.maker || r.bot, auditNote: r.auditNote != null ? r.auditNote : null,
          call: r.call, direction: r.direction != null ? r.direction : null, price: r.price,
          recordedEt: r.recordedEt, outcome: r.outcome,
          gradedPrice: r.gradedPrice != null ? r.gradedPrice : null,
          gradedEt: r.gradedEt != null ? r.gradedEt : null,
        };
      }),
      graded: correct + misses,
      correct: correct,
      misses: misses,
      open: reads.filter(function (r) { return r.outcome === "OPEN"; }).length,
      hits: rows.filter(function (r) { return r.kind === "HIT"; }).length,
      stockCount: rows.filter(function (r) { return (r.asset || "STOCK") !== "CRYPTO"; }).length,
      cryptoCount: rows.filter(function (r) { return r.asset === "CRYPTO"; }).length,
      asOfEt: fmtNyc(new Date()),
    };
  }
  function auditProofPage() {
    var rows = ledger();
    var nowEt = fmtNyc(new Date());
    var corrected = [];
    var makersFixed = 0;
    var checked = 0;
    var changed = false;
    rows.forEach(function (row) {
      if (!row.maker) {
        row.maker = row.bot;
        makersFixed += 1;
        changed = true;
      }
      if (row.kind !== "READ") return;
      if (row.outcome !== "CORRECT" && row.outcome !== "MISS") return;
      if (row.gradedPrice == null) return;
      checked += 1;
      var expected = gradeRead(row.direction, row.call, row.price, row.gradedPrice);
      if (expected == null || expected === row.outcome) return;
      var note = "Prudence's audit — " + nowEt + ": this grade was stamped " + row.outcome + " and is corrected to " + expected + " — "
        + auditReason(row.direction, row.call, row.price, row.gradedPrice) + "."
        + (row.call.indexOf("SLOWING") >= 0
          ? " The Warlord's ruling (Nov 17, 2026): a slowing call is graded on the fade — it is a hit when the tape moves back against the army, a miss when the tape keeps following it."
          : "")
        + " The call, the prices and the times stand exactly as written; only the stamp was wrong.";
      corrected.push({
        id: row.id, ticker: row.ticker, tf: row.tf, maker: row.maker || row.bot,
        call: row.call, price: row.price, gradedPrice: row.gradedPrice,
        from: row.outcome, to: expected,
      });
      row.outcome = expected;
      row.auditNote = note;
      changed = true;
    });
    if (changed) saveLedger(rows);
    var open = rows.filter(function (r) { return r.kind === "READ" && r.outcome === "OPEN"; }).length;
    return { checked: checked, corrected: corrected, makersFixed: makersFixed, open: open, asOfEt: nowEt };
  }
  function writeWarlordCall(args) {
    var symbol = normalizeSymbol(args.symbol);
    if (!SYMBOL_RE.test(symbol)) throw new Error("Invalid symbol.");
    var asset = args.asset || (CRYPTO_SYMBOLS.has(symbol) ? "CRYPTO" : "STOCK");
    var rows = ledger();
    var now = new Date();
    var candleKey = fmtNyc(now);
    if (asset === "STOCK") {
      var snap = lsGet(LS_SNAP + symbol, null);
      if (snap && snap.board) {
        var read = (snap.board.reads || []).find(function (r) { return r.tf === args.tf; })
          || (args.tf === "6H" ? snap.board.sable : null);
        if (read && read.candleTime) candleKey = read.candleTime;
      }
    }
    var call = args.state === "PUSHING" ? args.direction + " ARMY PUSHING"
      : args.state === "SLOWING" ? args.direction + " ARMY SLOWING"
      : args.state === "SHOWING SIGNS OF SLOWING" ? args.direction + " ARMY SHOWING SIGNS OF SLOWING"
      : args.direction + " ARMY HOLDING";
    rows.push({
      id: symbol + "|" + args.tf + "|" + candleKey + "|WL|" + now.getTime(),
      ticker: symbol, asset: asset, kind: "READ", tf: args.tf,
      bot: "Longshotwolf", maker: "Longshotwolf", auditNote: null,
      call: call, direction: args.direction, price: args.price,
      candleKey: candleKey, recordedEt: fmtNyc(now), recordedAtMs: now.getTime(),
      outcome: "OPEN", gradedPrice: null, gradedEt: null,
    });
    saveLedger(rows);
    return loadProof(undefined, "warlord");
  }

  // ── War Cove Newsroom ────────────────────────────────────────────
  var NEWS_FEED_NOTE = "Headlines from the Yahoo Finance news search — stock-market headlines and headlines on the stocks on this board's list, newest first. Tap a headline to read it at the publisher.";
  var newsCache = null;
  function fetchYahooNews(query, tag) {
    var url = YHO + "/v1/finance/search?q=" + encodeURIComponent(query) + "&quotesCount=0&newsCount=6";
    return fetchJson(url).then(function (raw) {
      var list = raw && raw.news;
      if (!Array.isArray(list)) return [];
      var out = [];
      list.forEach(function (n) {
        if (typeof n.title !== "string" || typeof n.link !== "string") return;
        var ts = typeof n.providerPublishTime === "number" ? n.providerPublishTime : 0;
        out.push({
          tag: tag, title: n.title,
          publisher: typeof n.publisher === "string" ? n.publisher : "Yahoo Finance",
          url: n.link, timeEt: ts > 0 ? fmtNyc(new Date(ts * 1000)) : "", publishedAt: ts,
        });
      });
      return out;
    });
  }
  function getNewsroom() {
    var stocks = ensureWatchlist();
    var cacheKey = stocks.map(function (s) { return s.ticker; }).join(",");
    var nowMs = Date.now();
    if (newsCache && newsCache.key === cacheKey && nowMs - newsCache.at < 5 * 60000) {
      return Promise.resolve({
        ok: newsCache.items.length > 0,
        items: newsCache.items.map(publishNews),
        asOfEt: fmtNyc(new Date(newsCache.at)),
        feedNote: NEWS_FEED_NOTE,
      });
    }
    var queries = [{ q: "stock market today", tag: "MARKET" }].concat(
      stocks.map(function (s) { return { q: s.ticker, tag: s.ticker }; })
    );
    return Promise.all(queries.map(function (qq) {
      return fetchYahooNews(qq.q, qq.tag).catch(function () { return []; });
    })).then(function (batches) {
      var seen = new Set();
      var all = [];
      batches.forEach(function (batch) {
        batch.forEach(function (it) {
          if (seen.has(it.url)) return;
          seen.add(it.url);
          all.push(it);
        });
      });
      all.sort(function (a, b) { return b.publishedAt - a.publishedAt; });
      var items = all.slice(0, 30);
      newsCache = { key: cacheKey, at: nowMs, items: items };
      return {
        ok: items.length > 0,
        items: items.map(publishNews),
        asOfEt: fmtNyc(new Date(nowMs)),
        feedNote: NEWS_FEED_NOTE,
      };
    });
    function publishNews(i) {
      return { tag: i.tag, title: i.title, publisher: i.publisher, url: i.url, timeEt: i.timeEt };
    }
  }

  // ── getBoard with the board's own stale law ──────────────────────
  // CACHE-FIRST PAINT (Warlord order, Nov 18, 2026 — copy only): when
  // a saved board stands for a stock, it paints at once — marked
  // stale under the board's own stale law, the same stale serve the
  // failure path has always given — while the live build runs behind
  // it. When the build lands it is served fresh on the board's next
  // pass (the client re-asks every 30–60s), and a call that arrives
  // while the build is still running joins it and paints fresh the
  // moment it lands. A first-ever stock with no saved board builds
  // in the foreground, exactly as before; a failed build leaves the
  // saved board standing.
  var boardInFlight = {};
  var boardFresh = {};
  function staleServe(board) {
    return Object.assign({}, board, {
      stale: true,
      error: "Live feed unreachable — showing the last saved board for this stock.",
    });
  }
  function boardFallback(ticker, e) {
    var snap = lsGet(LS_SNAP + ticker, null);
    if (snap && snap.board) return staleServe(snap.board);
    return errorBoard(ticker, e);
  }
  function runBoardBuild(ticker) {
    if (boardInFlight[ticker]) return boardInFlight[ticker];
    var p = buildBoard(ticker).then(function (board) {
      if (!board.ok || board.reads.every(function (r) { return r.held; })) {
        throw new Error("Feed returned no reads.");
      }
      lsSet(LS_SNAP + ticker, { board: board, at: Date.now() });
      try {
        recordProof(board);
      } catch (e) {
        /* the record stands by; the board still ships */
      }
      boardFresh[ticker] = board;
      return board;
    });
    boardInFlight[ticker] = p;
    var clear = function () {
      if (boardInFlight[ticker] === p) delete boardInFlight[ticker];
    };
    p.then(clear, clear);
    return p;
  }
  function getBoard(args) {
    var ticker = String((args && args.ticker) || "").trim().toUpperCase();
    if (!TICKER_RE.test(ticker)) return Promise.reject(new Error("Invalid ticker."));
    var fresh = boardFresh[ticker];
    if (fresh) {
      delete boardFresh[ticker];
      return Promise.resolve(fresh);
    }
    var snap = lsGet(LS_SNAP + ticker, null);
    if (snap && snap.board) {
      if (boardInFlight[ticker]) {
        return boardInFlight[ticker].catch(function (e) {
          return boardFallback(ticker, e);
        });
      }
      runBoardBuild(ticker).catch(function () {
        /* background build failed — the saved board already painted */
      });
      return Promise.resolve(staleServe(snap.board));
    }
    return runBoardBuild(ticker).catch(function (e) {
      return boardFallback(ticker, e);
    });
  }

  // ── Calla's commentary — the Day Brief (master copy) rundown ────
  // A client-side port of the board's buildCommentary. For ONE coin
  // at a time (Litecoin · Bitcoin · Ethereum, Litecoin first) she
  // reads Sierra's 3-minute survey (her gate and all), Terra's temp
  // bottoms and Vega's temp tops, and the timeframe cadence — 1H ·
  // 4H · 6H · DAY · WEEK · MONTH — off the coin's own candles, the
  // same candle setup and reading as the Day Brief. Her 6H spread
  // line is composed out of SABLE'S ROOM: Sable's exact figure (live
  // price vs her forming 6H candle's Heikin-Ashi close), Sable's
  // direction, and Sable's band word off her room's locked scale,
  // in Sable's words — read FIRST in every rundown. A temp hit —
  // price standing on a MONTH · WEEK · DAY level within the standing
  // 0.3% tolerance — carries the whole spoken line, both halves
  // every time, with the level price.
  var COMMENTARY_COINS = {
    LTC: { name: "Litecoin", pair: "LTC-USD" },
    BTC: { name: "Bitcoin", pair: "BTC-USD" },
    ETH: { name: "Ethereum", pair: "ETH-USD" },
  };
  // SABLE'S ROOM SCALE — the band words are SABLE'S, off her room's
  // locked scale on the Day Brief (the spread_band_word_check law:
  // a correct number with the wrong word still fails). Calla relays
  // this scale — she never bands a spread in words of her own. The
  // under-rung word is "a weak move" on the Warlord's word, and the
  // cycle starts AT the rung, never below it.
  var SPREAD_SCALES = {
    LTC: {
      note: "Sable's room scale for Litecoin — under 30¢ a weak move · 30¢ and beyond a cycle · $1.00+ a big move",
      bands: [
        { min: 1, word: "a big move" },
        { min: 0.3, word: "a cycle" },
        { min: 0, word: "a weak move" },
      ],
    },
    BTC: {
      note: "Sable's room scale for Bitcoin — under $300 a weak move · $300+ a cycle · $500+ a move · $800+ a better move · $1,000+ big big move",
      bands: [
        { min: 1000, word: "big big move" },
        { min: 800, word: "a better move" },
        { min: 500, word: "a move" },
        { min: 300, word: "a cycle" },
        { min: 0, word: "a weak move" },
      ],
    },
    ETH: {
      note: "Sable's room scale for Ethereum — under $9 a weak move · $9+ a cycle · $15+ a move · $30+ a big move",
      bands: [
        { min: 30, word: "a big move" },
        { min: 15, word: "a move" },
        { min: 9, word: "a cycle" },
        { min: 0, word: "a weak move" },
      ],
    },
  };
  function spreadBandWord(coin, spread) {
    var a = Math.abs(spread);
    var bands = SPREAD_SCALES[coin].bands;
    for (var i = 0; i < bands.length; i++) if (a >= bands[i].min) return bands[i].word;
    return "a weak move";
  }
  // Number words for the spoken relay — Sable's figure said the way
  // Sable's room says it: "one cent", "thirty cents", "three hundred
  // twelve dollars and forty cents".
  var NUM_ONES = [
    "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
    "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
  ];
  var NUM_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function numWords(n) {
    if (n < 20) return NUM_ONES[n] != null ? NUM_ONES[n] : String(n);
    if (n < 100) {
      var t = Math.floor(n / 10);
      var r = n % 10;
      return (NUM_TENS[t] || "") + (r ? "-" + (NUM_ONES[r] != null ? NUM_ONES[r] : String(r)) : "");
    }
    if (n < 1000) {
      var h = Math.floor(n / 100);
      var r2 = n % 100;
      return (NUM_ONES[h] != null ? NUM_ONES[h] : String(h)) + " hundred" + (r2 ? " " + numWords(r2) : "");
    }
    if (n < 1000000) {
      var th = Math.floor(n / 1000);
      var r3 = n % 1000;
      return numWords(th) + " thousand" + (r3 ? " " + numWords(r3) : "");
    }
    return String(n);
  }
  function spreadFigureWords(figure) {
    var a = Math.abs(figure);
    if (a > 0 && a < 0.005) return "under a cent";
    var dollars = Math.floor(a);
    var cents = Math.round((a - dollars) * 100);
    if (cents === 100) {
      dollars += 1;
      cents = 0;
    }
    if (dollars === 0) {
      if (cents === 0) return "zero cents";
      return numWords(cents) + " cent" + (cents === 1 ? "" : "s");
    }
    var d = numWords(dollars) + " dollar" + (dollars === 1 ? "" : "s");
    return cents > 0 ? d + " and " + numWords(cents) + " cent" + (cents === 1 ? "" : "s") : d;
  }
  function fmtUsd(v) {
    return v.toLocaleString("en-US", { style: "currency", currency: "USD" });
  }
  function buildCommentary(coin) {
    var meta = COMMENTARY_COINS[coin];
    var now = new Date();
    var bars1m = [];
    var bars30 = [];
    var dailyRaw = [];
    var weeklyRaw = [];
    var monthlyRaw = [];
    function orEmpty(p) {
      return p.catch(function () { return []; });
    }
    // All five series in parallel, off the coin's Yahoo tape — the
    // same one-after-another chain that stalled the board used to
    // stall her tape too. (The board falls back to the house quote
    // channel behind Yahoo; that channel has no browser door, so
    // this copy stands on Yahoo alone and holds if it stays silent.)
    return Promise.all([
      orEmpty(cached("yahoo:1m:" + meta.pair, function () { return yahooBars(meta.pair, "1m", "5d"); })),
      orEmpty(cached("yahoo:30m:" + meta.pair, function () { return yahooBars(meta.pair, "30m", "3mo"); })),
      orEmpty(cached("yahoo:1d:" + meta.pair, function () { return yahooBars(meta.pair, "1d", "10y"); })),
      orEmpty(cached("yahoo:1wk:" + meta.pair, function () { return yahooBars(meta.pair, "1wk", "5y"); })),
      orEmpty(cached("yahoo:1mo:" + meta.pair, function () { return yahooBars(meta.pair, "1mo", "10y"); })),
    ]).then(function (res) {
      bars1m = res[0];
      bars30 = res[1];
      dailyRaw = res[2];
      weeklyRaw = res[3];
      monthlyRaw = res[4];
      if (bars1m.length === 0 && dailyRaw.length === 0) throw new Error("No feed answered for this coin.");

      var lastIntra = bars1m[bars1m.length - 1];
      var price = lastIntra ? lastIntra.c : (dailyRaw.length ? dailyRaw[dailyRaw.length - 1].c : 0);

      // Forming DAY / WEEK / MONTH candles — the same assembly the
      // stock board runs: today's intraday merged into the day, the
      // week's days into the week, the month's days into the month.
      var latestKey = lastIntra ? etDateKey(new Date(lastIntra.t * 1000)) : etDateKey(now);
      var todayBars = bars1m.filter(function (b) { return etDateKey(new Date(b.t * 1000)) === latestKey; });
      var dailyBars = dailyRaw.slice();
      var todayBar = mergeBars(todayBars);
      var prevDailyBar = dailyRaw[dailyRaw.length - 1];
      if (todayBar) {
        var lastDailyDateStr = prevDailyBar ? new Date(prevDailyBar.t * 1000).toISOString().slice(0, 10) : "";
        if (lastDailyDateStr !== latestKey) dailyBars.push(todayBar);
        else if (dailyBars.length > 0) dailyBars[dailyBars.length - 1] = todayBar;
      }
      var todayKeyNow = etDateKey(now);
      var thisWeek = weekKey(todayKeyNow);
      var weekBarsFromDaily = dailyBars.filter(function (b) {
        return weekKey(new Date(b.t * 1000).toISOString().slice(0, 10)) === thisWeek;
      });
      var formingWeek = mergeBars(weekBarsFromDaily);
      var weeklyBars = weeklyRaw.length >= 3 ? weeklyRaw.slice() : [];
      if (formingWeek) {
        var lastW = weeklyBars[weeklyBars.length - 1];
        if (lastW && weekKey(new Date(lastW.t * 1000).toISOString().slice(0, 10)) === thisWeek) {
          weeklyBars[weeklyBars.length - 1] = formingWeek;
        } else weeklyBars.push(formingWeek);
      }
      if (weeklyBars.length < 3) {
        var byWeek = new Map();
        dailyBars.forEach(function (b) {
          var k = weekKey(new Date(b.t * 1000).toISOString().slice(0, 10));
          var arr = byWeek.get(k) || [];
          arr.push(b);
          byWeek.set(k, arr);
        });
        weeklyBars = [];
        Array.from(byWeek.keys()).sort().forEach(function (k) {
          var merged = mergeBars(byWeek.get(k) || []);
          if (merged) weeklyBars.push(merged);
        });
      }
      var thisMonth = todayKeyNow.slice(0, 7);
      var monthBarsFromDaily = dailyBars.filter(function (b) {
        return new Date(b.t * 1000).toISOString().slice(0, 7) === thisMonth;
      });
      var formingMonth = mergeBars(monthBarsFromDaily);
      var monthlyBars = monthlyRaw.length >= 3 ? monthlyRaw.slice() : [];
      if (formingMonth) {
        var lastM = monthlyBars[monthlyBars.length - 1];
        if (lastM && new Date(lastM.t * 1000).toISOString().slice(0, 7) === thisMonth) {
          monthlyBars[monthlyBars.length - 1] = formingMonth;
        } else monthlyBars.push(formingMonth);
      }
      if (monthlyBars.length < 3) {
        var byMonth = new Map();
        dailyBars.forEach(function (b) {
          var k = new Date(b.t * 1000).toISOString().slice(0, 7);
          var arr = byMonth.get(k) || [];
          arr.push(b);
          byMonth.set(k, arr);
        });
        monthlyBars = [];
        Array.from(byMonth.keys()).sort().forEach(function (k) {
          var merged = mergeBars(byMonth.get(k) || []);
          if (merged) monthlyBars.push(merged);
        });
      }

      var bars3m = aggregateMinutes(bars1m, 3);
      var bars1h = aggregateMinutes(bars30.length ? bars30 : bars1m, 60);
      var bars4h = aggregateMinutes(bars30.length ? bars30 : bars1m, 240);
      var bars6h = aggregateMinutes(bars30.length ? bars30 : bars1m, 360);

      // Sierra's room — the 3-minute survey, her gate and all.
      var sierra = makeRead("3M", "Sierra's Office — Three-Minute Reader", "Sierra", "Three-minute reader", bars3m, price, true);

      // The timeframe cadence she also carries — each frame read off
      // its own forming candle, in her reading order: 1H · 4H · 6H ·
      // DAY · WEEK · MONTH.
      var sable = makeRead("6H", "Sable's Office — Spread Watch", "Sable", "Six-hour spread watch", bars6h, price, false);
      var frames = [
        makeRead("1H", "1H Reader Office", "1H Reader", "One-hour timeframe reader", bars1h, price, false),
        makeRead("4H", "4H Reader Office", "4H Reader", "Four-hour timeframe reader", bars4h, price, false),
        sable,
        makeRead("DAY", "DAY Reader Office", "DAY Reader", "Day timeframe reader", dailyBars, price, false),
        makeRead("WEEK", "WEEK Reader Office", "WEEK Reader", "Week timeframe reader", weeklyBars, price, false),
        makeRead("MONTH", "MONTH Reader Office", "MONTH Reader", "Month timeframe reader", monthlyBars, price, false),
      ];

      // SABLE'S ROOM RELAY — her spread line is read OUT OF SABLE'S
      // ROOM: Sable's exact figure (PVC: live price vs her candle's
      // Heikin-Ashi close), Sable's direction, and Sable's band word
      // off her room's locked scale, in Sable's words. Calla never
      // computes a spread of her own off a separate tape.
      var spreadFigure = !sable.held && sable.haClose != null ? price - sable.haClose : null;
      var spreadBand = spreadFigure != null ? spreadBandWord(coin, spreadFigure) : null;
      var spreadLine = spreadFigure != null && spreadBand
        ? spreadFigure === 0
          ? meta.name + " six hour spread — dead flat, " + spreadBand
          : meta.name + " six hour spread — " + spreadFigureWords(spreadFigure) + " to the " + (spreadFigure > 0 ? "upside" : "downside") + ", " + spreadBand
        : null;
      var spread = {
        figure: spreadFigure,
        band: spreadBand,
        line: spreadLine,
        scaleNote: SPREAD_SCALES[coin].note,
      };

      // Terra's & Vega's rooms — the five frames, levels riding the
      // forming candles; a MONTH · WEEK · DAY hit carries her whole
      // line.
      var tempBarsByTf = { MONTH: monthlyBars, WEEK: weeklyBars, DAY: dailyBars, "4H": bars4h, "6H": bars6h };
      var candleKeyByTf = {
        MONTH: thisMonth,
        WEEK: thisWeek,
        DAY: latestKey,
        "4H": bars4h.length ? new Date(((bars4h[bars4h.length - 1] || {}).t || 0) * 1000).toISOString() : "none",
        "6H": bars6h.length ? new Date(((bars6h[bars6h.length - 1] || {}).t || 0) * 1000).toISOString() : "none",
      };
      function buildFrames(kind) {
        return ["MONTH", "WEEK", "DAY", "6H", "4H"].map(function (tf) {
          var f = tempFrame(tf, tempBarsByTf[tf] || [], kind);
          if (!f) return null;
          var onLevel = f.level != null && f.level > 0 && price > 0 && Math.abs(price - f.level) / f.level <= 0.003;
          var hit = onLevel && (tf === "MONTH" || tf === "WEEK" || tf === "DAY");
          var hitLine = hit && f.level != null
            ? kind === "bottom"
              ? meta.name + ". Temp bottom on the " + tf.toLowerCase() + ". Long the bottom, short the top. " + fmtUsd(f.level) + "."
              : meta.name + ". Temp top on the " + tf.toLowerCase() + ". Short the top, long the bottom. " + fmtUsd(f.level) + "."
            : null;
          return {
            tf: f.tf, light: f.light, call: f.call, level: f.level, fresh: f.fresh,
            candleKey: candleKeyByTf[tf] || "none", hit: hit, hitLine: hitLine,
          };
        }).filter(Boolean);
      }
      var terraFrames = buildFrames("bottom");
      var vegaFrames = buildFrames("top");
      function framesPhrase(n) { return n === 5 ? "all five frames" : n + " of the five frames"; }
      var terraVerdict = terraFrames.length === 0
        ? "HELD — no temp bottom read yet."
        : "Temp bottoms stand on " + framesPhrase(terraFrames.length) + " for " + meta.name + ". Levels ride the forming Heikin-Ashi candles.";
      var vegaVerdict = vegaFrames.length === 0
        ? "HELD — no temp top read yet."
        : "Temp tops stand on " + framesPhrase(vegaFrames.length) + " for " + meta.name + ". Levels ride the forming Heikin-Ashi candles.";

      var dataSource = "Yahoo Finance chart API — the coin tape";
      return {
        ok: true,
        coin: coin,
        coinName: meta.name,
        price: price || null,
        asOfEt: fmtNyc(now),
        dataSource: dataSource,
        feedNote: "Data source: " + dataSource + ". Calla reads the Day Brief (master copy) side of her room: Sierra's 3-minute survey and Terra's & Vega's temp rooms for " + meta.name + ", off the coin's own candles — the same candle setup and reading as the Day Brief.",
        error: null,
        sierra: sierra,
        frames: frames,
        sable: sable,
        spread: spread,
        terra: { frames: terraFrames, verdict: terraVerdict },
        vega: { frames: vegaFrames, verdict: vegaVerdict },
      };
    });
  }
  function heldCommentary(coin, err) {
    var meta = COMMENTARY_COINS[coin];
    var now = new Date();
    function held(tf, office, bot, job) { return heldRead(tf, office, bot, job, 0); }
    var sableHeld = held("6H", "Sable's Office — Spread Watch", "Sable", "Six-hour spread watch");
    return {
      ok: false,
      coin: coin,
      coinName: meta.name,
      price: null,
      asOfEt: fmtNyc(now),
      dataSource: "none — feed did not answer",
      feedNote: "The coin tape did not answer on this pass — Calla holds rather than read a stale figure as current.",
      error: "The coin feed did not answer for " + meta.name + ". (" + (err && err.message ? err.message : "feed error") + ")",
      sierra: held("3M", "Sierra's Office — Three-Minute Reader", "Sierra", "Three-minute reader"),
      frames: [
        held("1H", "1H Reader Office", "1H Reader", "One-hour timeframe reader"),
        held("4H", "4H Reader Office", "4H Reader", "Four-hour timeframe reader"),
        sableHeld,
        held("DAY", "DAY Reader Office", "DAY Reader", "Day timeframe reader"),
        held("WEEK", "WEEK Reader Office", "WEEK Reader", "Week timeframe reader"),
        held("MONTH", "MONTH Reader Office", "MONTH Reader", "Month timeframe reader"),
      ],
      sable: sableHeld,
      spread: { figure: null, band: null, line: null, scaleNote: SPREAD_SCALES[coin].note },
      terra: { frames: [], verdict: "HELD — no temp bottom read yet." },
      vega: { frames: [], verdict: "HELD — no temp top read yet." },
    };
  }

  // ── The actions ──────────────────────────────────────────────────
  var Actions = {
    getWatchlist: function () {
      return { stocks: ensureWatchlist() };
    },
    addStock: function (args) {
      var ticker = String((args && args.ticker) || "").trim().toUpperCase();
      if (!TICKER_RE.test(ticker)) throw new Error("Enter a valid ticker — 1 to 5 letters, like AAPL.");
      var stocks = ensureWatchlist();
      if (!stocks.some(function (s) { return s.ticker === ticker; })) {
        var name = String((args && args.name) || "").trim() || ticker;
        stocks.push({ ticker: ticker, name: name, locked: false });
        lsSet(LS_WATCH, stocks);
      }
      return { stocks: ensureWatchlist() };
    },
    removeStock: function (args) {
      var ticker = String((args && args.ticker) || "").trim().toUpperCase();
      var stocks = ensureWatchlist();
      var row = stocks.find(function (s) { return s.ticker === ticker; });
      if (row && row.locked) throw new Error(ticker + " is one of the locked seven — it stays on the board.");
      if (row) {
        stocks = stocks.filter(function (s) { return s.ticker !== ticker; });
        lsSet(LS_WATCH, stocks);
      }
      return { stocks: ensureWatchlist() };
    },
    getBoard: getBoard,
    getCommentary: function (args) {
      var coin = String((args && args.coin) || "LTC").trim().toUpperCase();
      if (!COMMENTARY_COINS[coin]) throw new Error("Invalid coin.");
      return buildCommentary(coin).catch(function (e) {
        return heldCommentary(coin, e);
      });
    },
    // Calla's voice is Aria — the warm American production voice the
    // Warlord picked — synthesized line by line through the house
    // TTS lane on the board's server. This static copy has no server
    // and no door to that lane, so the lane does not answer here:
    // her lines stand as text only in her room, and NO other voice
    // is substituted — the board itself answers exactly this way
    // whenever the lane does not answer.
    callaSpeak: function () {
      return { ok: false, audioUrl: null };
    },
    getNewsroom: function () {
      return getNewsroom();
    },
    getProofPage: function (args) {
      var page = (args && args.page) || "readers";
      var ticker = args && args.ticker;
      if (page === "warlord") {
        return gradeCryptoWarlordCalls(ledger()).then(function () {
          return loadProof(ticker, "warlord");
        }).catch(function () {
          return loadProof(ticker, "warlord");
        });
      }
      return loadProof(ticker, "readers");
    },
    auditProofPage: function () {
      return auditProofPage();
    },
    recordWarlordCall: function (args) {
      args = args || {};
      return writeWarlordCall({
        symbol: args.symbol != null ? args.symbol : (args.ticker != null ? args.ticker : ""),
        asset: args.asset, tf: args.tf, direction: args.direction,
        state: args.state, price: args.price,
      });
    },
    recordChatCall: function (args) {
      args = args || {};
      var symbol = normalizeSymbol(args.symbol || "");
      if (!SYMBOL_RE.test(symbol)) throw new Error("Invalid symbol.");
      var asset = args.asset || (CRYPTO_SYMBOLS.has(symbol) ? "CRYPTO" : "STOCK");
      var price = args.price;
      function finish(p) {
        if (p == null) {
          throw new Error("No price could be read for " + symbol + " — the call was not written down. Give the price it was called at.");
        }
        return writeWarlordCall({
          symbol: symbol, asset: asset, tf: args.tf,
          direction: args.direction, state: args.state, price: p,
        });
      }
      if (price != null) return finish(price);
      if (asset === "CRYPTO") return cryptoPrice(symbol).then(finish);
      var snap = lsGet(LS_SNAP + symbol, null);
      if (snap && snap.board && snap.board.price != null && snap.board.price > 0) {
        return finish(snap.board.price);
      }
      return buildBoard(symbol).then(function (board) {
        return finish(board.price);
      }).catch(function () {
        return finish(null);
      });
    },
    getChatLedger: function () {
      var proof = loadProof(undefined, "warlord");
      return {
        active: true,
        total: proof.stockCount + proof.cryptoCount,
        stockCount: proof.stockCount,
        cryptoCount: proof.cryptoCount,
        graded: proof.graded,
        correct: proof.correct,
        misses: proof.misses,
        open: proof.open,
        asOfEt: proof.asOfEt,
      };
    },
  };

  // Action names are normalized by the client the same way as the
  // board's HTTP API (lowercased) — register both spellings.
  var Dispatch = {};
  Object.keys(Actions).forEach(function (name) {
    Dispatch[name] = Actions[name];
    Dispatch[name.toLowerCase()] = Actions[name];
  });

  // ── The shim: answer the board's own action calls locally ───────
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var method = ((init && init.method) || (typeof input === "object" && input && input.method) || "GET").toUpperCase();
    var isAction = false;
    try {
      var u = new URL(url, location.href);
      isAction = method === "POST" && (u.pathname === "/actions" || u.pathname.slice(-8) === "/actions");
    } catch (e) {
      isAction = false;
    }
    if (!isAction) return rawFetch(input, init);
    var bodyText = init && typeof init.body === "string" ? init.body : "";
    var payload = null;
    try {
      payload = JSON.parse(bodyText);
    } catch (e) {
      payload = null;
    }
    var action = payload && payload.action;
    var args = (payload && payload.args) || {};
    var fn = action ? Dispatch[action] : null;
    var result;
    if (!fn) {
      result = Promise.reject(new Error("Unknown action: " + String(action)));
    } else {
      try {
        result = Promise.resolve(fn(args));
      } catch (e) {
        result = Promise.reject(e);
      }
    }
    return result.then(function (data) {
      return new Response(JSON.stringify({ data: data }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }).catch(function (err) {
      return new Response(JSON.stringify({ error: err && err.message ? err.message : String(err) }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
  };
})();
