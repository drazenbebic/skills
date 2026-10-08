#!/usr/bin/env node
// Renders the prompt for one PR's review sub-agent, so nothing is pasted by hand: the
// code-review bindings from the manifest entry, the Correctness axis, the finding format, and —
// on a re-review — the pointer to your earlier comments. The template is
// references/pr-agent-brief.md, below its rule.
//
//   node brief.mjs <manifest.json> <pr>                           # prints the prompt
//   node brief.mjs <manifest.json> <pr> --preferences <file>      # paste in the user's coding preferences
//   node brief.mjs <manifest.json> <pr> --code-review <SKILL.md>  # when code-review is not in a usual place
//
// Run from inside the repository. Exits 2 when the code-review skill cannot be found.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const VALUE_FLAGS = ['--preferences', '--code-review'];
const flag = name => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const [manifestPath, prArg] = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));
if (!manifestPath || !/^\d+$/.test(prArg ?? '')) {
  console.error('usage: node brief.mjs <manifest.json> <pr> [--preferences <file>] [--code-review <SKILL.md>]');
  process.exit(2);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const entry = manifest.queue.find(q => q.pr === Number(prArg));
if (!entry) {
  console.error(`#${prArg} is not in ${manifestPath}`);
  process.exit(2);
}

// --- locate code-review ------------------------------------------------------------------------
// skills.sh installs into <root>/.agents/skills and symlinks from each harness's own directory;
// Claude Code plugins live in ~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/skills/**.
const isCodeReview = p => {
  try {
    return /^name:\s*code-review\s*$/m.test(readFileSync(p, 'utf8').slice(0, 2000));
  } catch {
    return false;
  }
};
const walk = (dir, depth) => {
  if (depth < 0) return [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter(e => e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules')
    .flatMap(e => {
      const skill = join(dir, e.name, 'SKILL.md');
      return e.name === 'code-review' && existsSync(skill) ? [skill] : walk(join(dir, e.name), depth - 1);
    });
};
const locateCodeReview = () => {
  const given = flag('--code-review');
  if (given) {
    if (existsSync(given)) return given;
    console.error(`--code-review: ${given} does not exist`);
    process.exit(2);
  }
  const harnessDirs = ['.agents/skills', '.claude/skills', '.codex/skills', '.cursor/skills', '.opencode/skills'];
  const roots = [process.cwd(), homedir()];
  const usual = roots.flatMap(r => harnessDirs.map(d => join(r, d, 'code-review', 'SKILL.md')));
  return usual.find(p => existsSync(p) && isCodeReview(p)) ?? walk(join(homedir(), '.claude', 'plugins', 'cache'), 6).find(isCodeReview);
};
const codeReview = locateCodeReview();
if (!codeReview) {
  console.error(
    [
      'The code-review skill (mattpocock/skills) is not installed. Install it with',
      '  npx skills add mattpocock/skills --skill code-review -g',
      'or pass --code-review <path to its SKILL.md>.',
    ].join('\n'),
  );
  process.exit(2);
}

// --- render ------------------------------------------------------------------------------------
const refs = join(import.meta.dirname, '..', 'references');
// Each reference file explains itself above a rule and holds the text to paste below it.
const belowRule = name => {
  const text = readFileSync(join(refs, name), 'utf8');
  const i = text.indexOf('\n---\n');
  return (i >= 0 ? text.slice(i + 5) : text).trim();
};
const prefFile = flag('--preferences');
const repo = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  } catch {
    return process.cwd();
  }
})();

const values = {
  pr: entry.pr,
  title: entry.title,
  repo,
  head: entry.head,
  codeReview,
  diffCommand: entry.diffCommand,
  logCommand: entry.logCommand,
  specPath: entry.specPath,
  priorReviewPath: entry.priorReviewPath ?? '',
  // Indented to stay inside the bullet that introduces them.
  preferences: ((prefFile ? readFileSync(prefFile, 'utf8').trim() : '') || 'none').replace(/\n/g, '\n  '),
  correctness: belowRule('correctness-brief.md'),
  format: belowRule('finding-format.md'),
};
const sections = {
  delta: entry.mode === 'delta',
  fullWithPrior: entry.mode === 'full' && Boolean(entry.priorReviewPath),
};

const unknown = new Set();
const prompt = belowRule('pr-agent-brief.md')
  .replace(/\{\{#(\w+)\}\}\n?([\s\S]*?)\{\{\/\1\}\}\n?/g, (m, name, body) => {
    if (!(name in sections)) unknown.add(`{{#${name}}}`);
    return sections[name] ? body : '';
  })
  .replace(/\{\{(\w+)\}\}/g, (m, name) => {
    if (!(name in values)) unknown.add(m);
    return name in values ? String(values[name]) : m;
  });
if (unknown.size) {
  console.error(`pr-agent-brief.md uses placeholders brief.mjs does not know: ${[...unknown].join(', ')}`);
  process.exit(2);
}
process.stdout.write(`${prompt}\n`);
