#!/usr/bin/env node
/**
 * Flag suspects in drafted game dialogue — the things a model reliably misses
 * in its own text. It finds suspects; judging them stays with the writer.
 *
 *   node check.mjs <drafts> [--rules <voices file>] [--words min-max]
 *                  [--max-chars n] [--ban a,b] [--allow a,b] [--address any|neutral]
 *
 * <drafts> holds one block per take, each under a `### <id> <heading>` line.
 * House rules come from the ```check block in the game's voices file; flags
 * override it, and --ban / --allow add to its lists.
 *
 * Exit 0 clean, 1 findings, 2 usage error. Notes never fail a run.
 */

import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const USAGE =
  'usage: node check.mjs <drafts> [--rules <voices file>] [--words min-max] [--max-chars n]\n' +
  '                      [--ban a,b] [--allow a,b] [--address any|neutral]';

export class UsageError extends Error {}

export const DEFAULT_RULES = Object.freeze({ ban: [], allow: [], words: null, maxChars: null, address: 'any' });

const RULE_KEYS = new Set(['ban', 'allow', 'words', 'max-chars', 'address']);

const unixLines = text => text.replace(/\r\n?/g, '\n');

export function parseDrafts(text) {
  const takes = [];
  let stray = 0;
  unixLines(text).split('\n').forEach((line, i) => {
    const heading = /^###\s+(\S+)\s*(.*)$/.exec(line);
    if (heading) {
      takes.push({ id: heading[1], heading: heading[2].replace(/^·\s*/, '').trim(), body: [], line: i + 1 });
    } else if (/^###/.test(line)) {
      // `###B`, `#### B`, `### ` would otherwise merge into the take above, unchecked as a take.
      throw new UsageError(`line ${i + 1} looks like a heading but isn't "### <id>": ${line.trim()}`);
    } else if (takes.length) {
      takes.at(-1).body.push(line);
    } else if (line.trim() && !stray) {
      stray = i + 1;
    }
  });
  if (stray) throw new UsageError(`text before the first ### heading (line ${stray}) would go unchecked`);
  if (!takes.length) throw new UsageError('no takes: each take starts with a "### <id>" line');
  const parsed = takes.map(({ id, heading, body, line }) => ({ id, heading, text: body.join('\n').trim(), line }));
  const empty = parsed.find(take => !take.text);
  if (empty) throw new UsageError(`take ${empty.id} (line ${empty.line}) has no text`);
  return parsed;
}

const list = value => value.split(',').map(s => s.trim()).filter(Boolean);

function ruleValue(key, value, source) {
  switch (key) {
    case 'ban':
    case 'allow':
      return { [key]: list(value) };
    case 'words': {
      const range = /^(\d+)\s*[-–]\s*(\d+)$/.exec(value.trim());
      if (!range || +range[1] > +range[2]) throw new UsageError(`${source}: words must be "min-max", got "${value}"`);
      return { words: { min: +range[1], max: +range[2] } };
    }
    case 'max-chars': {
      if (!/^\d+$/.test(value.trim())) throw new UsageError(`${source}: max-chars must be a number, got "${value}"`);
      return { maxChars: +value.trim() };
    }
    case 'address': {
      const address = value.trim();
      if (address !== 'any' && address !== 'neutral') {
        throw new UsageError(`${source}: address must be "any" or "neutral", got "${value}"`);
      }
      return { address };
    }
    default:
      throw new UsageError(`${source}: unknown rule "${key}"`);
  }
}

export function parseRules(markdown, source) {
  const block = /^```check[ \t]*\n([\s\S]*?)^```/m.exec(unixLines(markdown));
  if (!block) throw new UsageError(`no \`\`\`check block in ${source}`);
  const rules = { ...DEFAULT_RULES, ban: [], allow: [] };
  const seen = new Set();
  for (const raw of block[1].split('\n')) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const pair = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (!pair) throw new UsageError(`${source}: cannot read "${raw.trim()}" in the check block`);
    const [, key, value] = pair;
    const parsed = ruleValue(key, value, source);
    // Lists may span several lines, one per source; a second value for anything else is a conflict.
    if (key === 'ban' || key === 'allow') {
      rules[key] = [...rules[key], ...parsed[key]];
    } else if (seen.has(key)) {
      throw new UsageError(`${source}: "${key}" is set twice in the check block`);
    } else {
      Object.assign(rules, parsed);
    }
    seen.add(key);
  }
  return rules;
}

export function parseCli(argv) {
  const flags = {};
  let drafts = null;
  let rulesPath = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      if (drafts) throw new UsageError(`unexpected argument "${arg}"`);
      drafts = arg;
      continue;
    }
    const eq = arg.indexOf('=');
    const name = arg.slice(2, eq < 0 ? undefined : eq);
    if (name !== 'rules' && !RULE_KEYS.has(name)) throw new UsageError(`unknown flag --${name}`);
    const value = eq < 0 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined) throw new UsageError(`--${name} needs a value`);
    if (name === 'rules') {
      rulesPath = value;
      continue;
    }
    const parsed = ruleValue(name, value, `--${name}`);
    if (parsed.ban) parsed.ban = [...(flags.ban ?? []), ...parsed.ban];
    if (parsed.allow) parsed.allow = [...(flags.allow ?? []), ...parsed.allow];
    Object.assign(flags, parsed);
  }
  if (!drafts) throw new UsageError('no drafts file given');
  return { drafts, rulesPath, flags };
}

export function mergeRules(base, flags) {
  return {
    ...base,
    ...flags,
    ban: [...base.ban, ...(flags.ban ?? [])],
    allow: [...base.allow, ...(flags.allow ?? [])],
  };
}

const MARKUP = /[*_]/g;

export function countWords(text) {
  return text
    .replace(MARKUP, '')
    .split(/[\s—–]+/)
    .filter(word => /[\p{L}\p{N}]/u.test(word)).length;
}

// Typographic quotes become straight ones, one character for one, so match
// indices still point into the original text.
const straight = text => text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whole-word matches of a phrase, case-insensitive unless asked. Word edges
// are any letter or digit in any script — `\b` would split "Aždaja" at the Ž.
function matches(text, phrase, { caseSensitive = false } = {}) {
  const pattern = escape(straight(phrase)).replace(/\s+/g, '\\s+');
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, caseSensitive ? 'gu' : 'giu');
  return [...straight(text).matchAll(re)].map(m => ({ index: m.index, length: m[0].length, phrase }));
}

// Every phrase's matches, left to right, dropping any that overlaps one
// already kept — "a testament to" is one finding, not two.
function phraseMatches(text, phrases, options) {
  const all = phrases.flatMap(phrase => matches(text, phrase, options)).sort((a, b) => a.index - b.index);
  const kept = [];
  for (const m of all) {
    const last = kept.at(-1);
    if (!last || m.index >= last.index + last.length) kept.push(m);
  }
  return kept;
}

function regexMatches(text, re, label) {
  return [...straight(text).matchAll(re)].map(m => ({ index: m.index, length: m[0].length, phrase: m[0], label }));
}

export const STOCK_PHRASES = [
  'a testament to', 'testament to', 'barely above a whisper', "can't help but", 'cannot help but',
  'shivers down', 'sends shivers', 'little did', 'in the grand scheme', 'palpable', 'a beacon of',
  'a stark reminder', 'every fiber of my being', 'the silence stretched', 'a dance of',
  // The genre's stock barks: every guard in every stealth game has said them.
  'show yourself', "you can't hide forever", "you can run but you can't hide", 'must have been the wind',
  "must've been the wind", 'trick of the light', 'eyes playing tricks', 'not on my watch', "I know you're there",
  'come out, come out', 'bad feeling about this',
];

// The weight of something abstract — "the weight of his words" — not of a
// load: "the weight of those things on the cage" is a fact.
const ABSTRACT_WEIGHT = new RegExp(
  '\\bthe weight of (?:(?:his|her|their|my|your|our|its|the|this|that|all|every)\\s+)?' +
    '(?:words?|world|guilt|grief|silence|years|memor(?:y|ies)|loss|decisions?|choices?|responsibilit(?:y|ies)|' +
    'expectations?|history|past|truth|it all|everything|command|sorrow|regret|sins?|duty|legacy|failure)\\b',
  'gi',
);

// "It's not about the gold, it's about the mountain."
const NOT_X_BUT_Y =
  /\b(?:it|this|that)(?:'s not|\s+is not|\s+isn't|\s+wasn't|\s+was not)\s+[^.!?]{1,40}?[,;—–]\s*(?:it|this|that)(?:'s|\s+is|\s+was)\b/gi;

export const DEFAULT_NAMES = [
  'Elara', 'Elias', 'Mara', 'Lyra', 'Kael', 'Thorne', 'Seraphina', 'Aldric', 'Eldrin', 'Silas', 'Zephyr',
];

export const EMOTION_WORDS = [
  'angry', 'sad', 'afraid', 'scared', 'frightened', 'terrified', 'furious', 'happy', 'hurt', 'ashamed', 'guilty',
  'jealous', 'lonely', 'anxious', 'worried', 'devastated', 'heartbroken', 'grateful', 'relieved', 'disappointed',
  'proud', 'overwhelmed',
];

const FEELING_PHRASES = ['I feel', 'makes me feel', 'made me feel'];

const NAMED_EMOTION = new RegExp(
  `(?<![\\p{L}\\p{N}])I(?:'m|\\s+am|\\s+was)\\s+(?:(?:so|very|really|truly)\\s+)?` +
    `(?:${EMOTION_WORDS.join('|')})(?![\\p{L}\\p{N}])`,
  'giu',
);

export const THERAPY_PHRASES = [
  'I hear you', "it's okay to", "it's ok to", "that's valid", 'your feelings are', 'closure', "I'm here for you",
  "you're not alone", 'how you feel', 'safe space', 'be gentle with yourself', 'process this',
];

export const GENDERED_ADDRESS = [
  'sir', 'madam', "ma'am", 'lad', 'lass', 'laddie', 'lassie', 'my lord', 'my lady', 'milord', 'milady', 'mister',
  'missus', 'young man', 'young lady', 'good man', 'good woman',
];

// A term of address is spoken *to* someone: it stands at the start of a sentence or after a comma,
// and a comma or the sentence's end follows it ("Welcome, lad." "Sir, you dropped this.") — not
// "He was a good man" or "Sir Roland".
function addressMatches(text, terms) {
  return terms.flatMap(term => {
    const pattern = escape(straight(term)).replace(/\s+/g, '\\s+');
    const re = new RegExp(`(?<=^|[,;:—–]\\s*|[.!?…]["”'’)]?\\s+)${pattern}(?=\\s*(?:[,.!?;:—–…]|$))`, 'giu');
    return [...straight(text).matchAll(re)].map(m => ({ index: m.index, length: m[0].length, phrase: term }));
  });
}

export function findPhrase(text, phrase) {
  return matches(text, phrase).map(m => m.index);
}

function excerpt(text, index, length, pad = 30) {
  const start = Math.max(0, index - pad);
  const end = Math.min(text.length, index + length + pad);
  const middle = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return `${start > 0 ? '…' : ''}${middle}${end < text.length ? '…' : ''}`;
}

export function checkTake(take, rules) {
  const findings = [];
  const add = (check, message, at = { index: 0, length: 0 }, note = false) =>
    findings.push({ takes: [take.id], check, message, excerpt: excerpt(take.text, at.index, at.length), note });

  const words = countWords(take.text);
  if (rules.words && (words < rules.words.min || words > rules.words.max)) {
    add('length', `${words} words, budget ${rules.words.min}–${rules.words.max}`);
  }
  const chars = [...take.text.replace(MARKUP, '')].length;
  if (rules.maxChars && chars > rules.maxChars) {
    add('length', `${chars} characters, limit ${rules.maxChars}`);
  }
  for (const term of rules.ban) {
    for (const at of matches(take.text, term)) add('banned', `"${term}" is banned in this project`, at);
  }

  const allowed = new Set(rules.allow.map(a => straight(a).toLowerCase()));
  const notAllowed = list => list.filter(p => !allowed.has(straight(p).toLowerCase()));
  const notAllowedMatch = ms => ms.filter(m => !allowed.has(m.phrase.toLowerCase()));

  const stock = [
    ...phraseMatches(take.text, notAllowed(STOCK_PHRASES)),
    ...notAllowedMatch(regexMatches(take.text, ABSTRACT_WEIGHT)),
    ...notAllowedMatch(regexMatches(take.text, NOT_X_BUT_Y, '"it\'s not X, it\'s Y"')),
  ];
  for (const at of stock.sort((a, b) => a.index - b.index)) {
    add('stock-phrase', at.label ?? `stock phrase "${at.phrase}"`, at);
  }
  for (const at of phraseMatches(take.text, notAllowed(DEFAULT_NAMES), { caseSensitive: true })) {
    add('default-name', `"${at.phrase}" is a name models reach for by default`, at);
  }
  const feelings = [...phraseMatches(take.text, FEELING_PHRASES), ...regexMatches(take.text, NAMED_EMOTION, 'feeling')];
  for (const at of notAllowedMatch(feelings).sort((a, b) => a.index - b.index)) {
    add('named-emotion', `names a feeling: "${at.phrase}"`, at);
  }
  for (const at of phraseMatches(take.text, notAllowed(THERAPY_PHRASES))) {
    add('therapy-speak', `therapy-speak: "${at.phrase}"`, at);
  }
  if (rules.address === 'neutral') {
    for (const at of addressMatches(take.text, notAllowed(GENDERED_ADDRESS)).sort((a, b) => a.index - b.index)) {
      add('gendered-address', `addresses someone as "${at.phrase}" — if that's the player, it genders them`, at);
    }
  }

  const lengths = sentenceLengths(take.text);
  if (lengths.length >= 4 && standardDeviation(lengths) < 2.5) {
    add('flat-rhythm', `${lengths.length} sentences of ${lengths.join(', ')} words — vary their length`, undefined, true);
  }
  return findings;
}

const sentenceLengths = text =>
  text
    .replace(MARKUP, '')
    .split(/(?<=[.!?…]["”'’)]?)\s+/)
    .map(countWords)
    .filter(n => n > 0);

function standardDeviation(values) {
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length);
}

const PLACEHOLDER = /\{\$?[A-Za-z_][\w.]*\}/g;

const plainWords = text =>
  straight(text.replace(MARKUP, ''))
    .toLowerCase()
    .split(/[\s—–]+/)
    .map(word => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);

function jaccard(a, b) {
  const shared = [...a].filter(word => b.has(word)).length;
  return shared / (a.size + b.size - shared || 1);
}

// Takes of one line share the id before its last dot: `smith.A` and `smith.B`
// are rival takes, `elder.A` another line. Ids without a dot are one line.
const lineOf = id => (id.includes('.') ? id.slice(0, id.lastIndexOf('.')) : '');

export function checkTakes(takes) {
  const lines = new Map();
  for (const take of takes) lines.set(lineOf(take.id), [...(lines.get(lineOf(take.id)) ?? []), take]);
  return [...lines.values()].flatMap(checkLine);
}

function checkLine(takes) {
  const findings = [];
  const across = (ids, check, message) => findings.push({ takes: ids, check, message, excerpt: '', note: false });

  const sets = takes.map(take => [...new Set(take.text.match(PLACEHOLDER) ?? [])].sort().join(' '));
  if (new Set(sets).size > 1) {
    across(
      takes.map(take => take.id),
      'placeholders',
      `takes use different placeholders — ${takes.map((take, i) => `${take.id}: ${sets[i] || 'none'}`).join('; ')}`,
    );
  }

  const words = takes.map(take => plainWords(take.text));
  for (let i = 0; i < takes.length; i++) {
    for (let j = i + 1; j < takes.length; j++) {
      const opening = words[i].slice(0, 3).join(' ');
      const sameOpening = words[i].length >= 3 && opening === words[j].slice(0, 3).join(' ');
      const overlap = jaccard(new Set(words[i]), new Set(words[j]));
      if (sameOpening || overlap > 0.6) {
        across(
          [takes[i].id, takes[j].id],
          'too-alike',
          sameOpening
            ? `both open "${opening}" — a rewording, not a different approach`
            : `share ${Math.round(overlap * 100)}% of their words — a rewording, not a different approach`,
        );
      }
    }
  }
  return findings;
}

function describeRules(rules) {
  const parts = [];
  if (rules.words) parts.push(`words ${rules.words.min}–${rules.words.max}`);
  if (rules.maxChars) parts.push(`max ${rules.maxChars} characters`);
  if (rules.ban.length) parts.push(`ban ${rules.ban.join(', ')}`);
  if (rules.allow.length) parts.push(`allow ${rules.allow.join(', ')}`);
  parts.push(`address ${rules.address}`);
  return parts.join('; ');
}

export function formatReport(takes, findings, rulesLabel) {
  const row = f => `     ${f.note ? 'note ' : ''}${f.check}  ${f.message}${f.excerpt ? ` — "${f.excerpt}"` : ''}`;
  const out = [`${takes.length} take${takes.length === 1 ? '' : 's'} · rules: ${rulesLabel}`, ''];
  for (const take of takes) {
    const own = findings.filter(f => f.takes.length === 1 && f.takes[0] === take.id);
    const label = [take.id, take.heading].filter(Boolean).join('  ');
    out.push(`${label}  (${countWords(take.text)} words)${own.length ? '' : '  clean'}`);
    out.push(...own.map(row));
  }
  const across = findings.filter(f => f.takes.length > 1);
  if (across.length) out.push('', 'Across takes', ...across.map(f => `${row(f)}  [${f.takes.join(', ')}]`));
  const failing = new Set(findings.filter(f => !f.note).flatMap(f => f.takes));
  out.push('', `${failing.size} take${failing.size === 1 ? '' : 's'} with findings, ${takes.length - failing.size} clean.`);
  return out.join('\n');
}

function read(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    throw new UsageError(`cannot read ${path} (${error.code ?? error.message})`);
  }
}

export async function main(argv) {
  try {
    const { drafts, rulesPath, flags } = parseCli(argv);
    const rules = mergeRules(rulesPath ? parseRules(read(rulesPath), rulesPath) : DEFAULT_RULES, flags);
    const takes = parseDrafts(read(drafts));
    const findings = [...takes.flatMap(take => checkTake(take, rules)), ...checkTakes(takes)];
    console.log(formatReport(takes, findings, `${rulesPath ?? 'defaults'} (${describeRules(rules)})`));
    return findings.some(f => !f.note) ? 1 : 0;
  } catch (error) {
    if (!(error instanceof UsageError)) throw error;
    console.error(`check.mjs: ${error.message}\n${USAGE}`);
    return 2;
  }
}

// Node runs a symlinked script from its real path, so compare against that:
// an installed skill may be a symlink, and a guard that never fires would
// exit 0 — a clean report for a file nobody checked.
if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  process.exitCode = await main(process.argv.slice(2));
}
