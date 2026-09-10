#!/usr/bin/env node
/**
 * Runtime probes against a real browser, under Lighthouse-equivalent
 * throttling. Use these whenever a Lighthouse audit makes a claim you want to
 * confirm before acting on it - a diagnostic that names the moving element and
 * its rects settles in one run what guessing settles in three deploys.
 *
 *   node probe.mjs cls     <url>              layout shifts, with what moved and why
 *   node probe.mjs console <url>              console errors and exceptions
 *   node probe.mjs paint   <url> [selectors]  layout of elements over time
 *   node probe.mjs hidden  <url>              content invisible until JS runs
 *
 * Flags: --desktop  --settle=<ms>  --no-throttle  --json
 */

import { DESKTOP, MOBILE, launch, parseArgs } from './cdp.mjs';

const { flags, positional } = parseArgs(process.argv.slice(2));
const [command, url, ...rest] = positional;

if (!command || !url) {
  console.error(
    'usage: node probe.mjs <cls|console|paint|hidden> <url> [selectors...]',
  );
  process.exit(1);
}

const profile = structuredClone(flags.desktop ? DESKTOP : MOBILE);
if (flags['no-throttle']) {
  profile.network = null;
  profile.cpuThrottling = 1;
}
const settleMs = Number(flags.settle ?? 9000);
const out = obj => console.log(JSON.stringify(obj, null, 2));

const commands = { cls, console: consoleErrors, hidden, paint };

if (!commands[command]) {
  console.error(`unknown command "${command}"`);
  process.exit(1);
}

const session = await launch({ profile });
try {
  await commands[command]();
} finally {
  await session.close();
}

/* ------------------------------------------------------------------ */

/**
 * Layout shifts, with the node that moved and its before/after rects.
 *
 * Worth running even when Lighthouse reports CLS 0, and especially when it
 * reports a number you cannot reproduce: Lighthouse's CLS is sensitive to the
 * harness, and a shift measured here - with rects and a timestamp - is a fact
 * you can act on, where the audit score alone is not.
 */
async function cls() {
  await session.beforeLoad(`
    window.__shifts = [];
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (entry.hadRecentInput) continue;
        window.__shifts.push({
          value: entry.value,
          timeMs: Math.round(entry.startTime),
          sources: (entry.sources || []).map(s => ({
            node: s.node
              ? s.node.tagName.toLowerCase() +
                (s.node.className && typeof s.node.className === 'string'
                  ? '.' + s.node.className.trim().split(/\\s+/).slice(0, 3).join('.')
                  : '')
              : 'unknown',
            text: s.node ? (s.node.textContent || '').trim().slice(0, 60) : '',
            from: rect(s.previousRect),
            to: rect(s.currentRect),
          })),
        });
      }
    }).observe({ buffered: true, type: 'layout-shift' });
    function rect(r) {
      return r ? { h: Math.round(r.height), w: Math.round(r.width), x: Math.round(r.x), y: Math.round(r.y) } : null;
    }
  `);

  await session.goto(url, { settleMs });
  const shifts = await session.evalJson('JSON.stringify(window.__shifts||[])');
  const total = shifts.reduce((sum, s) => sum + s.value, 0);

  if (flags.json) return out({ shifts, total });

  console.log(`CLS ${round(total)}  (${shifts.length} shift${shifts.length === 1 ? '' : 's'})`);
  for (const s of shifts) {
    if (s.value < 0.0001) continue;
    console.log(`\n  ${round(s.value)} at ${s.timeMs}ms`);
    for (const src of s.sources) {
      console.log(`    ${src.node}${src.text ? `  "${src.text}"` : ''}`);
      if (src.from && src.to) {
        const moved = src.to.y - src.from.y;
        const grew = src.to.h - src.from.h;
        console.log(
          `      y ${src.from.y}->${src.to.y} (${signed(moved)}px)  ` +
            `h ${src.from.h}->${src.to.h} (${signed(grew)}px)`,
        );
      }
    }
  }
  if (total < 0.0001) {
    console.log('\n  Nothing shifted. If an audit disagrees, suspect the audit harness.');
  }
}

/**
 * Console errors are a best-practices audit item, but they are more useful as
 * a correctness signal: a component that fails to resolve, or a hydration
 * mismatch, usually announces itself here long before it shows up in a metric.
 */
async function consoleErrors() {
  const seen = [];
  session.on(msg => {
    if (
      msg.method === 'Runtime.consoleAPICalled' &&
      ['error', 'warning'].includes(msg.params.type)
    ) {
      seen.push({
        kind: msg.params.type,
        text: msg.params.args
          .map(a => a.value ?? a.description ?? '')
          .join(' ')
          .slice(0, 200),
      });
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      seen.push({
        kind: 'exception',
        text: (msg.params.exceptionDetails.text || '').slice(0, 200),
      });
    }
  });

  await session.goto(url, { settleMs });

  const unique = [...new Map(seen.map(s => [s.kind + s.text, s])).values()];
  if (flags.json) return out({ messages: unique });

  if (!unique.length) return console.log('No console errors or warnings.');
  console.log(`${unique.length} distinct message(s):`);
  for (const m of unique) console.log(`  [${m.kind}] ${m.text}`);
}

/**
 * Samples the layout of chosen elements on every frame and prints each *change*.
 *
 * This is the tool for "why is my LCP element late". A box that measures 0 and
 * then snaps to its real size tells you space was never reserved; a text block
 * that changes height tells you a font swapped. Both are invisible in the
 * Lighthouse score and obvious here.
 */
async function paint() {
  const selectors = rest.length
    ? rest
    : ['main', 'h1', 'img', 'section', '[class*="hero"]'];

  await session.beforeLoad(`
    window.__states = [];
    window.__selectors = ${JSON.stringify(selectors)};
    window.__fontsReady = null;
    document.fonts.ready.then(() => { window.__fontsReady = Math.round(performance.now()); });
    (function tick() {
      const snapshot = window.__selectors.map(sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          sel,
          top: Math.round(r.top),
          height: Math.round(r.height),
          width: Math.round(r.width),
          opacity: Number(getComputedStyle(el).opacity),
          complete: el.tagName === 'IMG' ? el.complete : null,
          natural: el.tagName === 'IMG' ? el.naturalWidth + 'x' + el.naturalHeight : null,
        };
      });
      const key = JSON.stringify(snapshot);
      if (window.__lastKey !== key) {
        window.__lastKey = key;
        window.__states.push({ t: Math.round(performance.now()), snapshot });
      }
      requestAnimationFrame(tick);
    })();
  `);

  await session.goto(url, { settleMs });
  const states = await session.evalJson('JSON.stringify(window.__states||[])');
  const fontsReady = await session.eval('window.__fontsReady');

  if (flags.json) return out({ fontsReady, states });

  console.log(`fonts.ready at ${fontsReady}ms`);
  console.log(`${states.length} distinct layout state(s):\n`);
  for (const state of states) {
    const present = state.snapshot.filter(Boolean);
    if (!present.length) {
      console.log(`  t=${String(state.t).padStart(5)}ms  (no matching element in the DOM yet)`);
      continue;
    }
    console.log(`  t=${String(state.t).padStart(5)}ms`);
    for (const s of present) {
      console.log(
        `    ${s.sel.padEnd(22)} top=${String(s.top).padStart(5)} ` +
          `${String(s.width).padStart(4)}x${String(s.height).padStart(4)} ` +
          `opacity=${s.opacity}` +
          (s.natural ? `  natural=${s.natural} complete=${s.complete}` : ''),
      );
    }
  }
  if (states.length > 1) {
    console.log(
      '\n  More than one state means the page moved after first paint.\n' +
        '  A box going 0 -> real size means its space was never reserved.\n' +
        '  A text block changing height after fonts.ready means a font swap reflow.',
    );
  }
}

/**
 * Finds content that is present in the DOM but invisible until JavaScript runs.
 *
 * This is the highest-value single check on an App Router app. Scroll-reveal
 * libraries server-render their elements at opacity:0 and only reveal them
 * after hydration, which defeats the entire point of prerendering: the HTML
 * arrives fast and then nobody can see it. It also suppresses CLS, so fixing
 * it tends to expose layout shifts that were always there.
 */
async function hidden() {
  // Only elements intersecting the first viewport count. A scroll-reveal
  // section sitting below the fold is *supposed* to be invisible until you
  // scroll to it; conflating the two produces false alarms.
  const scan = `(() => {
    const inView = [], below = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (Number(cs.opacity) > 0.01) continue;
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      const rects = el.getClientRects();
      if (!rects.length) continue;
      const r = el.getBoundingClientRect();
      const record = {
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 70),
        text: (el.textContent || '').trim().slice(0, 60),
        top: Math.round(r.top),
      };
      (r.top < innerHeight && r.bottom > 0 ? inView : below).push(record);
    }
    return { below: below.slice(0, 25), inView: inView.slice(0, 25) };
  })()`;

  await session.goto(url, { settleMs: Math.min(settleMs, 2500) });
  const early = await session.evalJson(`JSON.stringify(${scan})`);

  // Give hydration time, then look again: whatever became visible in between
  // was gated behind JavaScript.
  await new Promise(r => setTimeout(r, 6000));
  const late = await session.evalJson(`JSON.stringify(${scan})`);

  if (flags.json) return out({ afterHydration: late, earlyInvisible: early });

  console.log(`In the first viewport, invisible early     : ${early.inView.length}`);
  for (const e of early.inView)
    console.log(`   ${e.tag}.${e.cls}${e.text ? `  "${e.text}"` : ''}`);
  console.log(`In the first viewport, invisible after JS  : ${late.inView.length}`);
  for (const e of late.inView) console.log(`   ${e.tag}.${e.cls}`);
  console.log(
    `Below the fold, invisible (scroll reveals) : ${late.below.length}  - expected, not a fault`,
  );

  if (early.inView.length && !late.inView.length) {
    console.log(
      '\n  Above-the-fold content painted only once JavaScript had hydrated.\n' +
        '  On a prerendered route that throws away the benefit of prerendering:\n' +
        '  the HTML arrives quickly and then nobody can see it. Prefer a\n' +
        '  CSS-driven reveal so first paint never waits on JS.\n' +
        '  Expect fixing this to *expose* layout shifts - invisible content\n' +
        '  does not count toward CLS, so the shifts were always there.',
    );
  } else if (late.inView.length) {
    console.log('\n  Above-the-fold content stays invisible even after hydration. Likely a bug.');
  } else {
    console.log('\n  Nothing above the fold is gated behind JavaScript. Good.');
  }
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}
function signed(n) {
  return n > 0 ? `+${n}` : String(n);
}
