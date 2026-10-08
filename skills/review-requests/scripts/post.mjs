#!/usr/bin/env node
// Posts one review. Anchors are checked against the PR's own diff first, because GitHub
// rejects the whole review if a single inline comment points outside a hunk.
//
//   node post.mjs <review.json> [--dry-run]
//
// review.json:
//   { "pr": 123, "commit": "<head sha you reviewed>",
//     "verdict": "APPROVE" | "COMMENT" | "REQUEST_CHANGES",
//     "body": "",
//     "comments": [{ "path": "src/x.ts", "line": 42, "side": "RIGHT", "body": "..." }] }
//
// Comments that do not anchor are folded into the review body as `path:line — text`
// instead of being dropped.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [file, ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');
if (!file) {
  console.error('usage: node post.mjs <review.json> [--dry-run]');
  process.exit(2);
}

const review = JSON.parse(readFileSync(file, 'utf8'));
const VERDICTS = ['APPROVE', 'COMMENT', 'REQUEST_CHANGES'];
if (!VERDICTS.includes(review.verdict)) {
  console.error(`verdict must be one of ${VERDICTS.join(', ')}`);
  process.exit(2);
}

const gh = (args, input) =>
  execFileSync('gh', args, { encoding: 'utf8', input, maxBuffer: 64 * 1024 * 1024 }).trim();

const head = gh(['pr', 'view', String(review.pr), '--json', 'headRefOid', '--jq', '.headRefOid']);
if (review.commit && review.commit !== head) {
  console.error(`#${review.pr} moved since review (${review.commit.slice(0, 9)} → ${head.slice(0, 9)}). Re-review before posting.`);
  process.exit(3);
}

const anchors = new Map();
const raw = gh(['api', '--paginate', `repos/{owner}/{repo}/pulls/${review.pr}/files`, '--jq', '.[] | @json']);
for (const f of raw ? raw.split('\n').map(l => JSON.parse(l)) : []) {
  const right = new Set();
  const left = new Set();
  let oldLine = 0;
  let newLine = 0;
  for (const l of (f.patch ?? '').split('\n')) {
    const hunk = l.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
    } else if (l.startsWith('+')) {
      right.add(newLine++);
    } else if (l.startsWith('-')) {
      left.add(oldLine++);
    } else if (!l.startsWith('\\')) {
      right.add(newLine++);
      left.add(oldLine++);
    }
  }
  anchors.set(f.filename, { RIGHT: right, LEFT: left });
}

const inline = [];
const unanchored = [];
for (const c of review.comments ?? []) {
  const side = c.side ?? 'RIGHT';
  if (anchors.get(c.path)?.[side]?.has(c.line)) {
    inline.push({ path: c.path, line: c.line, side, body: c.body });
  } else {
    unanchored.push(`\`${c.path}:${c.line}\` — ${c.body}`);
  }
}

const body = [review.body?.trim(), ...unanchored].filter(Boolean).join('\n\n');
// GitHub refuses COMMENT / REQUEST_CHANGES reviews with neither body nor comments.
if (review.verdict !== 'APPROVE' && !body && !inline.length) {
  console.error(`#${review.pr}: ${review.verdict} needs at least one comment or a body.`);
  process.exit(2);
}

const payload = { commit_id: head, event: review.verdict, body, comments: inline };

if (dryRun) {
  console.log(JSON.stringify({ pr: review.pr, ...payload }, null, 2));
  if (unanchored.length) console.error(`${unanchored.length} comment(s) did not anchor and went into the body.`);
  process.exit(0);
}

const out = gh(['api', '-X', 'POST', `repos/{owner}/{repo}/pulls/${review.pr}/reviews`, '--input', '-', '--jq', '"\\(.state) \\(.html_url)"'], JSON.stringify(payload));
console.log(`#${review.pr} ${out}${unanchored.length ? ` (${unanchored.length} folded into body)` : ''}`);
