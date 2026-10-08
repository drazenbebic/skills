#!/usr/bin/env node
// Drops the refs one prepare.mjs run fetched, and only those.
//
//   node cleanup.mjs <manifest.json>

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const [manifestPath] = process.argv.slice(2);
if (!manifestPath) {
  console.error('usage: node cleanup.mjs <manifest.json>');
  process.exit(2);
}

const { refPrefix } = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (!refPrefix?.startsWith('refs/review-requests/')) {
  console.error(`refusing to clean unexpected ref prefix: ${refPrefix}`);
  process.exit(2);
}

const refs = execFileSync('git', ['for-each-ref', '--format=%(refname)', `${refPrefix}/`], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
for (const ref of refs) execFileSync('git', ['update-ref', '-d', ref]);
console.log(`removed ${refs.length} review ref(s)`);
