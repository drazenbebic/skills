#!/usr/bin/env node
// Renders a drafted review as Markdown for the interactive walkthrough: each comment with the
// code it anchors to, why it matters, and the text that would be posted. Code is read from the
// fetched refs, never from the user's checkout.
//
//   node show.mjs <manifest.json> <review.json>                 # every comment
//   node show.mjs <manifest.json> <review.json> 2               # only the second comment
//   node show.mjs <manifest.json> <review.json> --context 6     # lines around the anchor (default 3)
//
// review.json is the file post.mjs takes. Comments may carry `severity`, `axis`, and `why` from
// the finding; post.mjs ignores those fields.
//
// Run from inside the repository.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const args = process.argv.slice(2);
const ctxIdx = args.indexOf('--context');
const context = ctxIdx >= 0 ? Number(args[ctxIdx + 1]) : 3;
const [manifestPath, reviewPath, only] = args.filter((a, i) => !a.startsWith('--') && (ctxIdx < 0 || i !== ctxIdx + 1));
if (!manifestPath || !reviewPath || !Number.isInteger(context) || context < 0 || (only && !/^\d+$/.test(only))) {
  console.error('usage: node show.mjs <manifest.json> <review.json> [n] [--context <lines>]');
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const review = JSON.parse(readFileSync(reviewPath, 'utf8'));
const entry = manifest.queue.find(q => q.pr === review.pr);
if (!entry) {
  console.error(`#${review.pr} is not in ${manifestPath}`);
  process.exit(2);
}
if (review.commit && review.commit !== entry.head) {
  console.error(`warning: ${reviewPath} was drafted for ${review.commit.slice(0, 9)}, the manifest has ${entry.head.slice(0, 9)}`);
}

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
// LEFT lines are numbered in the version the sub-agent diffed against: the merge base of the
// fixed point and the head, as `git diff <fixedPoint>...<head>` uses.
let leftRev;
const revFor = side => {
  if (side !== 'LEFT') return entry.head;
  leftRev ??= git('merge-base', entry.fixedPoint, entry.head).trim();
  return leftRev;
};

const files = new Map();
const lines = (rev, path) => {
  const key = `${rev}:${path}`;
  if (!files.has(key)) {
    try {
      files.set(key, git('show', key).split('\n'));
    } catch {
      files.set(key, null);
    }
  }
  return files.get(key);
};

const snippet = c => {
  const side = c.side ?? 'RIGHT';
  const text = lines(revFor(side), c.path);
  if (!text) return `_(${c.path} does not exist on the ${side === 'LEFT' ? 'base' : 'head'} side)_`;
  if (c.line < 1 || c.line > text.length) return `_(${c.path} has no line ${c.line})_`;
  const from = Math.max(1, c.line - context);
  const to = Math.min(text.length, c.line + context);
  const width = String(to).length;
  const body = [];
  for (let n = from; n <= to; n++) body.push(`${n === c.line ? '>' : ' '} ${String(n).padStart(width)} | ${text[n - 1]}`);
  // Longer than any backtick run in the code, so the fence can't close early.
  const fence = '`'.repeat(Math.max(3, ...(body.join('\n').match(/`+/g) ?? []).map(r => r.length + 1)));
  return [`${fence}${extname(c.path).slice(1)}`, ...body, fence].join('\n');
};

const comments = review.comments ?? [];
const picked = only ? [[Number(only), comments[Number(only) - 1]]] : comments.map((c, i) => [i + 1, c]);
if (only && !picked[0][1]) {
  console.error(`${reviewPath} has ${comments.length} comment(s), not ${only}`);
  process.exit(2);
}

const blocks = picked.map(([n, c]) => {
  const label = [c.severity, c.axis].filter(Boolean).join(' · ');
  const where = c.path ? `\`${c.path}${c.line ? `:${c.line}` : ''}\`${c.side === 'LEFT' ? ' (removed line)' : ''}` : 'whole PR';
  return [
    `### #${review.pr} — ${n}/${comments.length}${label ? ` · ${label}` : ''} · ${where}`,
    c.path && c.line ? snippet(c) : '',
    c.why ? `**Why:** ${c.why}` : '',
    `**Comment:**\n\n${c.body.split('\n').map(l => `> ${l}`).join('\n')}`,
  ]
    .filter(Boolean)
    .join('\n\n');
});
process.stdout.write(`${blocks.join('\n\n---\n\n')}\n`);
