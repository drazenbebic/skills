#!/usr/bin/env node
/**
 * Run Lighthouse repeatedly, report medians, and compare labelled runs.
 *
 *   node measure.mjs <url> --label=before [--runs=5] [--simulated]
 *   node measure.mjs --compare before after
 *
 * Defaults to --throttling-method=devtools (real throttling) because that is
 * the mode you can actually steer by. See references/measurement.md for why
 * the default simulated mode is close to useless for A/B work.
 *
 * Results land in /tmp/nextperf/<label>/ so a later --compare can find them.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { parseArgs } from './cdp.mjs';

const { flags, positional } = parseArgs(process.argv.slice(2));
const ROOT = flags.out || '/tmp/nextperf';

if (flags.compare) {
  const [a, b] = positional.length >= 2 ? positional : [flags.compare, positional[0]];
  compare(a, b);
} else {
  const url = positional[0];
  if (!url) {
    console.error(
      'usage: node measure.mjs <url> --label=<name> [--runs=5] [--simulated]\n' +
        '       node measure.mjs --compare <labelA> <labelB>',
    );
    process.exit(1);
  }
  await run(url);
}

async function run(url) {
  const label = flags.label || 'run';
  const runs = Number(flags.runs ?? 5);
  const dir = `${ROOT}/${label}`;
  mkdirSync(dir, { recursive: true });

  const lhBin = resolveLighthouse();
  const mode = flags.simulated ? 'simulated' : 'devtools';

  console.log(`${url}\n${runs} runs, ${mode} throttling -> ${dir}\n`);

  for (let i = 1; i <= runs; i++) {
    const args = [
      url,
      '--quiet',
      '--chrome-flags=--headless=new',
      '--output=json',
      `--output-path=${dir}/run-${i}.json`,
      '--only-categories=performance,accessibility,best-practices,seo',
    ];
    if (!flags.simulated) args.push('--throttling-method=devtools');
    if (flags.desktop) args.push('--preset=desktop');

    try {
      execFileSync(lhBin.cmd, [...lhBin.prefix, ...args], { stdio: 'ignore' });
      process.stdout.write(`  run ${i}: ${fmt(read(`${dir}/run-${i}.json`))}\n`);
    } catch {
      console.log(`  run ${i}: FAILED`);
    }
  }

  console.log('');
  summarise(label);
}

function summarise(label) {
  const rows = load(label);
  if (!rows.length) return console.log(`no results for "${label}"`);
  const m = medians(rows);
  console.log(
    `${label}: perf ${m.perf}  lcp ${m.lcp}ms  fcp ${m.fcp}ms  si ${m.si}ms  ` +
      `tbt ${m.tbt}ms  cls ${m.cls}  transfer ${m.transfer}KiB  (n=${rows.length})`,
  );
  const spread = rows.map(r => r.perf).sort((a, b) => a - b);
  if (spread.at(-1) - spread[0] >= 8) {
    console.log(
      `  scores ranged ${spread[0]}-${spread.at(-1)} [${spread.join(', ')}].\n` +
        `  That much spread means the median is weak evidence. Add runs, or\n` +
        `  switch to devtools throttling if you are on simulated.`,
    );
  }
  return m;
}

function compare(a, b) {
  const A = load(a);
  const B = load(b);
  if (!A.length || !B.length) {
    console.error(`need results for both labels under ${ROOT}`);
    console.error(`have: ${existsSync(ROOT) ? readdirSync(ROOT).join(', ') : '(nothing)'}`);
    process.exit(1);
  }
  const ma = medians(A);
  const mb = medians(B);
  const keys = [
    ['perf', 'perf score', 1],
    ['lcp', 'LCP (ms)', -1],
    ['fcp', 'FCP (ms)', -1],
    ['si', 'Speed Index (ms)', -1],
    ['tbt', 'TBT (ms)', -1],
    ['cls', 'CLS', -1],
    ['transfer', 'transfer (KiB)', -1],
  ];
  const pad = s => String(s).padStart(12);
  console.log(`${''.padEnd(18)}${pad(a)}${pad(b)}${pad('delta')}`);
  for (const [key, name, better] of keys) {
    const delta = mb[key] - ma[key];
    const mark = Math.abs(delta) < 1e-9 ? '' : delta * better > 0 ? '  better' : '  worse';
    console.log(`${name.padEnd(18)}${pad(ma[key])}${pad(mb[key])}${pad(round(delta))}${mark}`);
  }
  console.log(`\n  n = ${A.length} vs ${B.length} runs.`);
}

function load(label) {
  const dir = `${ROOT}/${label}`;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        return read(`${dir}/${f}`);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function read(path) {
  const r = JSON.parse(readFileSync(path, 'utf8'));
  const a = r.audits;
  const net = a['network-requests']?.details?.items || [];
  const sum = type =>
    Math.round(
      net
        .filter(i => !type || i.resourceType === type)
        .reduce((acc, i) => acc + (i.transferSize || 0), 0) / 1024,
    );
  return {
    cls: a['cumulative-layout-shift'].numericValue,
    fcp: Math.round(a['first-contentful-paint'].numericValue),
    font: sum('Font'),
    image: sum('Image'),
    lcp: Math.round(a['largest-contentful-paint'].numericValue),
    perf: Math.round(r.categories.performance.score * 100),
    requests: net.length,
    script: sum('Script'),
    si: Math.round(a['speed-index'].numericValue),
    tbt: Math.round(a['total-blocking-time'].numericValue),
    transfer: sum(null),
  };
}

function medians(rows) {
  const mid = key => {
    const v = rows.map(r => r[key]).sort((x, y) => x - y);
    const n = v.length;
    return round(n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2);
  };
  return Object.fromEntries(
    ['perf', 'lcp', 'fcp', 'si', 'tbt', 'cls', 'transfer', 'script', 'font', 'image', 'requests'].map(
      k => [k, mid(k)],
    ),
  );
}

function fmt(r) {
  return (
    `perf=${String(r.perf).padStart(3)} lcp=${r.lcp} fcp=${r.fcp} si=${r.si} ` +
    `tbt=${r.tbt} cls=${round(r.cls)} transfer=${r.transfer}KiB`
  );
}

function round(n) {
  return Math.round(n * 1000) / 1000;
}

function resolveLighthouse() {
  try {
    execFileSync('lighthouse', ['--version'], { stdio: 'ignore' });
    return { cmd: 'lighthouse', prefix: [] };
  } catch {
    return { cmd: 'npx', prefix: ['--yes', 'lighthouse'] };
  }
}
