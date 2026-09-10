#!/usr/bin/env node
/**
 * Static inspection of what a route actually serves. No browser, no Lighthouse.
 *
 *   node inspect.mjs <url>                     document + headers + redirects
 *   node inspect.mjs <url> --chunks            also download and fingerprint the JS
 *   node inspect.mjs <url> --chunks --probe=FriendlyCaptcha,embla,storyblok
 *
 * Most of the expensive findings in an App Router audit are visible right here,
 * before any measurement: content server-rendered at opacity:0, a shell that is
 * all skeletons, @font-face rules multiplied by a pointless weight array, a
 * redirect on the entry URL, Set-Cookie defeating the CDN.
 */

import { parseArgs } from './cdp.mjs';

const { flags, positional } = parseArgs(process.argv.slice(2));
const url = positional[0];
if (!url) {
  console.error('usage: node inspect.mjs <url> [--chunks] [--probe=A,B,C]');
  process.exit(1);
}

const kib = n => `${Math.round(n / 1024)}KiB`;
const count = (s, re) => (s.match(re) || []).length;

await main();

async function main() {
  await reportHeaders();
  const html = await fetchText(url);
  reportDocument(html);
  if (flags.chunks) await reportChunks(html);
}

/**
 * A redirect on the entry URL is the most commonly missed finding on a
 * localised site: it is invisible when you browse in the default locale, but
 * Googlebot and PageSpeed Insights both send en-US and both pay for it.
 */
async function reportHeaders() {
  console.log('== response ==');
  for (const lang of ['en-US,en;q=0.9', 'de-AT,de;q=0.9']) {
    const res = await fetch(url, {
      headers: { 'Accept-Language': lang },
      redirect: 'manual',
    });
    const loc = res.headers.get('location');
    console.log(
      `  Accept-Language ${lang.split(',')[0].padEnd(6)} -> ${res.status}${loc ? ` -> ${loc}` : ''}`,
    );
  }

  const res = await fetch(url, { headers: { 'Accept-Language': 'en-US' } });
  const interesting = [
    'cache-control',
    'age',
    'set-cookie',
    'x-vercel-cache',
    'x-nextjs-prerender',
  ];
  for (const h of interesting) {
    const v = res.headers.get(h);
    if (v) console.log(`  ${h}: ${v}`);
  }
  if (res.headers.get('set-cookie')) {
    console.log('  ^ no shared cache stores a response carrying Set-Cookie');
  }
  if (!res.headers.get('x-nextjs-prerender')) {
    console.log('  ^ no x-nextjs-prerender: this route may be rendering per request');
  }
  console.log('');
}

function reportDocument(html) {
  const dom = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '');
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1].length);
  const inlineScript = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map(m => m[1].length)
    .reduce((a, b) => a + b, 0);

  const mainStart = dom.indexOf('<main');
  const mainEnd = dom.indexOf('</main>');
  const shell = mainStart >= 0 && mainEnd > mainStart ? dom.slice(mainStart, mainEnd) : '';

  console.log('== document ==');
  console.log(`  html                ${kib(html.length)} (${html.length} bytes)`);
  console.log(`  inline <style>      ${styles.map(kib).join(', ') || 'none'}`);
  console.log(`  inline script       ${kib(inlineScript)}  (mostly the RSC flight payload)`);
  console.log(`  @font-face rules    ${count(html, /@font-face\{/g)}`);
  console.log(`  font preloads       ${count(html, /as="font"/g)}`);
  console.log(`  image preload       ${count(html, /as="image"/g)}`);

  const hidden = count(dom, /style="opacity:0/g);
  const sections = count(dom, /<section/g);
  console.log(`  opacity:0 elements  ${hidden}${sections ? ` (of ${sections} sections)` : ''}`);

  const unresolved = count(dom, /<!--\$\?-->/g);
  const streamed = count(dom, /<div hidden id="S:/g);
  console.log(`  streamed boundaries ${unresolved} unresolved, ${streamed} hidden blocks`);
  if (shell) console.log(`  shell <main>        ${shell.length} bytes`);

  const notes = [];
  if (hidden > 0)
    notes.push(
      'Content is server-rendered invisible. It cannot paint until JS hydrates,\n' +
        '    which defeats prerendering. Run: probe.mjs hidden <url>',
    );
  const faceCount = count(html, /@font-face\{/g);
  if (faceCount > 40)
    notes.push(
      `${faceCount} @font-face rules. Expect roughly (families x subsets), doubled\n` +
        '    if experimental.inlineCss is on, since the CSS is inlined into both the\n' +
        '    <style> tag and the flight payload. Two variable families lands near 30.\n' +
        '    Much more than that usually means a `weight` array: for a variable font\n' +
        '    every weight points at the same file and only multiplies the rules.',
    );
  if (shell && shell.length < html.length / 20 && streamed)
    notes.push(
      'The shell is a small fraction of the document, so first paint is whatever\n' +
        '    the Suspense fallbacks render. On a prerendered route there is usually\n' +
        '    nothing to wait for - consider dropping the boundary.',
    );
  if (notes.length) {
    console.log('');
    for (const n of notes) console.log(`  - ${n}`);
  }
  console.log('');
}

/**
 * Downloads every referenced script and reports size plus fingerprints.
 *
 * The question this answers is "is this page shipping code it has no use for".
 * A component registry imported from a 'use client' module, or a form widget
 * reachable from a page with no form, both show up as a fingerprint hit on a
 * route where that feature does not exist.
 */
async function reportChunks(html) {
  // Distinctive identifiers only. Short or common strings produce false
  // positives against minified code: "motion" matches prefers-reduced-motion,
  // "qs" and "LCP" match minified identifiers and base64 blobs. If a probe
  // result surprises you, check the match before believing it.
  const probes = (flags.probe ? String(flags.probe).split(',') : [
    'FriendlyCaptcha',
    'embla',
    'ariakit',
    'storyblokInit',
    'IntlMessageFormat',
    'react-dom',
    'framer-motion',
  ]).map(s => s.trim()).filter(Boolean);

  const base = new URL(url);
  const paths = [
    ...new Set([...html.matchAll(/\/_next\/static\/[a-zA-Z0-9_\/-]+\.js/g)].map(m => m[0])),
  ];

  console.log(`== scripts (${paths.length} referenced) ==`);
  let total = 0;
  const rows = [];
  for (const p of paths) {
    const body = await fetchText(new URL(p, base).href).catch(() => '');
    if (!body) continue;
    total += body.length;
    rows.push({ hits: probes.filter(x => body.includes(x)), path: p, size: body.length });
  }
  rows.sort((a, b) => b.size - a.size);
  for (const r of rows) {
    console.log(
      `  ${kib(r.size).padStart(8)}  ${r.path.split('/').pop().padEnd(28)}${r.hits.join(', ')}`,
    );
  }
  console.log(`  ${kib(total).padStart(8)}  total (uncompressed)`);
  console.log(
    '\n  Fingerprints tell you what is present, not whether it is needed. If a\n' +
      '  probe matches on a route that has no such feature, something is dragging\n' +
      '  it in - usually a client component importing a module that transitively\n' +
      '  imports everything.\n' +
      '  These are substring matches against minified code, so short or generic\n' +
      '  probe strings will lie to you. Confirm a surprising hit before acting.',
  );
}

async function fetchText(target) {
  const res = await fetch(target, { headers: { 'Accept-Language': 'en-US' } });
  return res.text();
}
