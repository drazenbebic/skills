#!/usr/bin/env node
/**
 * Flag suspects in a game's story bible — the generic AI-story defaults and
 * the structural holes a model reliably misses in its own story work. It finds
 * suspects; judging them stays with the writer. It never edits files.
 *
 *   node check.mjs <file> [--scale S|M|L] [--ban a,b] [--allow a,b] [--scan-only]
 *   node check.mjs <premises file> --premises [--ban a,b] [--allow a,b]
 *
 * By default <file> is a STORY.md in the format of references/bible.md: the
 * scan checks run over the whole file and the structure checks over its
 * sections, entries, IDs and flags, at the scale its ```check block records
 * (M when there is none). --scale overrides the block; --ban and --allow add
 * to its lists. --scan-only runs just the scan checks, for a project's own
 * story doc in another format. --premises reads one premise per
 * `### <id> · <heading>` block and adds the checks across premises.
 *
 * Every check skips fenced code blocks and HTML comments; the scan checks also
 * skip the Changelog, which records old names and retired wording.
 *
 * Exit 0 clean, 1 findings, 2 usage error. Notes never fail a run.
 */

import { readFileSync, realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const USAGE =
  'usage: node check.mjs <file> [--scale S|M|L] [--ban a,b] [--allow a,b] [--scan-only]\n' +
  '       node check.mjs <premises file> --premises [--ban a,b] [--allow a,b]';

export class UsageError extends Error {}

const SCALES = ['S', 'M', 'L'];
const atLeast = (scale, level) => SCALES.indexOf(scale) >= SCALES.indexOf(level);

const unixLines = text => text.replace(/\r\n?/g, '\n');
const list = value => value.split(',').map(s => s.trim()).filter(Boolean);
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
// Typographic quotes become straight ones, one character for one, so match
// indices still point into the original text.
const straight = text => text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------------------------------------------------------------------------
// Scan lists. A string is a whole-word, case-insensitive phrase; a RegExp is
// matched whole-word, case-insensitive only if it carries the i flag.

// Hamilton & Mimno, EMNLP 2026, and Antislop, ICLR 2026: names models default to, measured across vendors.
export const DEFAULT_NAMES = ['Elias', 'Elara', 'Mara', 'Kael'];
// Practitioner lists of AI-default names; no corpus counts.
export const STOCK_NAMES = [
  'Lyra', 'Seraphina', 'Thorne', 'Voss', 'Kaelen', 'Aldric', 'Elowen', 'Nyx', 'Zephyr', 'Lysander', 'Eldoria',
  'Aethelgard',
];
// Lighthouse: Hamilton & Mimno, EMNLP 2026, and Antislop, ICLR 2026; "Whispering …" and "The Last Train": Rettberg & Wigers.
export const STOCK_SETTINGS = ['lighthouse keeper', 'lighthouse', /Whispering\s+\p{Lu}\p{L}*/u, /[Tt]he\s+Last\s+Train/u];
// Hamilton & Mimno, EMNLP 2026; Rettberg & Wigers: quiet craft + small place + secret + light.
export const TEMPLATE_WORDS = Object.freeze({
  'craft profession': [
    'keeper', 'clockmaker', 'cartographer', 'apothecary', 'archivist', 'librarian', 'baker', 'weaver', 'beekeeper',
    'bookbinder', 'lamplighter', 'glassblower', 'tinker',
  ],
  'quiet place': ['small town', 'village', 'coastal', 'seaside', 'harbour', 'harbor', 'fishing town', 'hamlet', 'lighthouse'],
  secret: ['secret', 'hidden', 'forgotten', 'long-lost'],
  'light imagery': ['light', 'glow', 'glowing', 'lantern', 'flicker', 'flickering', 'luminous', 'shimmer', 'shimmering'],
});
// Practitioner lists; no corpus counts.
export const STOCK_PLOTS = [
  'chosen one', 'prophecy', 'prophesied', 'foretold', 'ancient evil', 'dark lord',
  /(?:evil|darkness)\s+(?:awakens|returns|stirs)/iu, 'amnesia', 'amnesiac',
  /lost\s+(?:his|her|their)\s+(?:memory|memories)/iu, 'no memory of',
  /last\s+of\s+(?:his|her|their)\s+(?:kind|line|bloodline)/iu, 'destined',
];
// Practitioner lists; no corpus counts.
export const WORLD_STAKES = [
  'end of the world', 'destroy the world', /fate\s+of\s+the\s+(?:world|realm|kingdom)/iu,
  /save\s+the\s+(?:world|realm|kingdom)/iu, 'the world will end',
];
// Practitioner lists; no corpus counts.
export const SOFT_VILLAIN = [
  'misunderstood', 'just wanted to', 'only wanted to', 'was right all along', 'not truly evil', 'not really evil',
  /deep\s+down\s+(?:he|she|they)/iu, 'redeem', 'redeems', 'redeemed', 'redemption',
];
// Festival resolution: Hamilton & Mimno, EMNLP 2026, and Rettberg & Wigers; the rest: practitioner lists, no corpus counts.
export const SOFT_RESOLUTIONS = [
  'festival', 'celebration', 'heart-to-heart', /(?:peace|harmony)\s+(?:returns|is\s+restored)/iu, 'balance is restored',
  /(?:everyone|the\s+(?:whole\s+)?(?:town|village|city))\s+(?:comes|came)\s+together/iu,
  'reconcile', 'reconciles', 'reconciled', 'reconciliation',
];
// Practitioner lists; no corpus counts.
export const STATED_LESSONS = [
  'power of friendship', 'the real treasure', 'what truly matters', 'all along', 'the true meaning of',
  /(?:learn|learns|learned)\s+the\s+value\s+of/iu, /believe\s+in\s+(?:yourself|themselves|himself|herself)/iu,
];
// Practitioner lists; no corpus counts.
export const STOCK_WORDS = [
  'tapestry', 'testament to', 'nexus', 'the veil', 'the void', 'the sundering', 'the shattering', 'aether',
  'echoes of the past', 'whispers of',
];

// The phrase checks, in the order a tie between overlapping matches is settled.
export const SCAN_CHECKS = Object.freeze([
  {
    check: 'default-name', note: false, patterns: DEFAULT_NAMES,
    message: m => `"${m}" is a name models default to, measured across vendors — use the setting's naming spec, or allow it if the canon really uses it`,
  },
  {
    check: 'stock-name', note: true, patterns: STOCK_NAMES,
    message: m => `"${m}" is on practitioners' lists of AI-default names — check it against the naming spec`,
  },
  {
    check: 'stock-setting', note: false, patterns: STOCK_SETTINGS,
    message: m => `"${m}" is a setting or title models default to — replace it with the owner's particulars, or allow it`,
  },
  {
    check: 'stock-plot', note: true, patterns: STOCK_PLOTS,
    message: m => `"${m}" is a stock plot move — keep it only if the bible says why this game needs it and what it does differently`,
  },
  {
    check: 'world-stakes', note: true, patterns: WORLD_STAKES,
    message: m => `"${m}" is world-ending stakes — give the threat a face: one character the player has met, and what they lose`,
  },
  {
    check: 'soft-villain', note: false, patterns: SOFT_VILLAIN,
    message: m => `"${m}" softens the antagonist — check they keep a method and a counter-argument to the end`,
  },
  {
    check: 'soft-resolution', note: false, patterns: SOFT_RESOLUTIONS,
    message: m => `"${m}" is the model-default resolution — check the central conflict resolves through a costly action that changes world state`,
  },
  {
    check: 'stated-lesson', note: false, patterns: STATED_LESSONS,
    message: m => `"${m}" states a lesson aloud — the ending enacts the controlling idea; nobody says it`,
  },
  {
    check: 'stock-word', note: true, patterns: STOCK_WORDS,
    message: m => `"${m}" is stock AI-fantasy vocabulary — say the specific thing`,
  },
]);

const TEMPLATE_MESSAGE =
  'the model-default story template (quiet craft + small place + secret + light) — rebuild it from the owner\'s particulars';

// ---------------------------------------------------------------------------
// Matching

// Word edges are any letter or digit in any script — `\b` would split "Aždaja" at the Ž.
const EDGE_BEFORE = '(?<![\\p{L}\\p{N}])';
const EDGE_AFTER = '(?![\\p{L}\\p{N}])';

function compile(pattern) {
  if (pattern instanceof RegExp) {
    return new RegExp(`${EDGE_BEFORE}(?:${pattern.source})${EDGE_AFTER}`, pattern.flags.includes('i') ? 'giu' : 'gu');
  }
  return new RegExp(`${EDGE_BEFORE}${escape(straight(pattern)).replace(/\s+/g, '\\s+')}${EDGE_AFTER}`, 'giu');
}

// Expects text already passed through straight().
const findAll = (text, patterns) =>
  patterns.flatMap(pattern => [...text.matchAll(compile(pattern))].map(m => ({ index: m.index, length: m[0].length, text: m[0] })));

const overlaps = (a, b) => a.index < b.index + b.length && b.index < a.index + a.length;
const said = text => text.replace(/\s+/g, ' ');

// A short quote around a match, kept to the line(s) the match is on.
function excerpt(text, index, length, pad = 30) {
  const lineStart = text.lastIndexOf('\n', index - 1) + 1;
  const next = text.indexOf('\n', index + length);
  const lineEnd = next < 0 ? text.length : next;
  const start = Math.max(lineStart, index - pad);
  const end = Math.min(lineEnd, index + length + pad);
  const middle = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return `${start > lineStart ? '…' : ''}${middle}${end < lineEnd ? '…' : ''}`;
}

/**
 * The scan checks over one location's text. Returns hits with the check,
 * message, excerpt and a key that is the same for the same match, so a caller
 * can report each distinct match once per location. An `allow` entry found in
 * the text silences every built-in match it overlaps — allowing "lighthouse"
 * covers "lighthouse keeper" too — but never a `ban` match.
 */
export function scanText(raw, { ban = [], allow = [] } = {}) {
  const text = straight(raw);
  const hits = [];
  const hit = (check, note, message, at, wholeUnit = false, quote = excerpt(raw, at.index, at.length)) =>
    hits.push({ check, note, message, index: at.index, excerpt: quote, wholeUnit, key: `${check}|${said(at.text).toLowerCase()}` });

  for (const m of findAll(text, ban).sort((a, b) => a.index - b.index)) {
    hit('banned', false, `"${said(m.text)}" is banned in this project`, m);
  }

  const allowed = findAll(text, allow);
  const free = m => !allowed.some(a => overlaps(a, m));

  // Overlapping matches are one finding: the earliest wins, then the longest,
  // then the check listed first — "was right all along" is a softened villain,
  // not also a stated lesson.
  const candidates = SCAN_CHECKS.flatMap((spec, order) =>
    findAll(text, spec.patterns).filter(free).map(m => ({ ...m, spec, order })));
  candidates.sort((a, b) => a.index - b.index || b.length - a.length || a.order - b.order);
  let end = 0;
  for (const c of candidates) {
    if (c.index < end) continue;
    end = c.index + c.length;
    hit(c.spec.check, c.spec.note, c.spec.message(said(c.text)), c);
  }

  const found = Object.values(TEMPLATE_WORDS)
    .map(patterns => findAll(text, patterns).filter(free).sort((a, b) => a.index - b.index)[0])
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
  if (found.length >= 3) {
    const words = found.map(m => said(m.text));
    hits.push({
      check: 'template', note: false, message: TEMPLATE_MESSAGE, index: found[0].index, excerpt: words.join(' … '),
      wholeUnit: true, key: 'template',
    });
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Markdown

/**
 * Blank out fenced code blocks and HTML comments, line for line, and collect
 * the ```check blocks. A fence or comment that never closes is a usage error:
 * everything after it would go unchecked, and the report would say clean.
 */
export function maskMarkdown(text, { firstLine = 1, source = '' } = {}) {
  const prefix = source ? `${source}: ` : '';
  const masked = [];
  const checkBlocks = [];
  let fence = null;
  let comment = null;
  unixLines(text).split('\n').forEach((line, i) => {
    const n = firstLine + i;
    if (fence) {
      const close = /^ {0,3}(`{3,}|~{3,})[ \t]*$/.exec(line);
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null;
      else fence.block?.lines.push(line);
      masked.push('');
      return;
    }
    if (comment === null) {
      const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
      if (open && !(open[1][0] === '`' && open[2].includes('`'))) {
        fence = { char: open[1][0], length: open[1].length, line: n, block: null };
        if (open[2].trim() === 'check') {
          fence.block = { line: n, lines: [] };
          checkBlocks.push(fence.block);
        }
        masked.push('');
        return;
      }
    }
    let out = '';
    let rest = line;
    while (rest) {
      if (comment !== null) {
        const close = rest.indexOf('-->');
        if (close < 0) {
          out += ' '.repeat(rest.length);
          rest = '';
        } else {
          out += ' '.repeat(close + 3);
          rest = rest.slice(close + 3);
          comment = null;
        }
      } else {
        const open = rest.indexOf('<!--');
        if (open < 0) {
          out += rest;
          rest = '';
        } else {
          out += `${rest.slice(0, open)}    `;
          rest = rest.slice(open + 4);
          comment = n;
        }
      }
    }
    masked.push(out);
  });
  if (fence) {
    throw new UsageError(`${prefix}line ${fence.line} opens a code fence that never closes — everything after it would go unchecked`);
  }
  if (comment !== null) {
    throw new UsageError(`${prefix}line ${comment} opens an HTML comment that never closes — everything after it would go unchecked`);
  }
  return { lines: masked, checkBlocks };
}

const LIST_KEYS = ['allow', 'ban', 'external'];

function scaleValue(value, source) {
  const scale = value.trim().toUpperCase();
  if (!SCALES.includes(scale)) throw new UsageError(`${source} must be S, M or L, got "${value.trim()}"`);
  return scale;
}

export function parseCheckBlock(markdown, source) {
  const { checkBlocks } = maskMarkdown(markdown, { source });
  const config = { found: checkBlocks.length > 0, scale: null, allow: [], ban: [], external: [] };
  if (checkBlocks.length > 1) {
    throw new UsageError(`${source}: two \`\`\`check blocks (lines ${checkBlocks[0].line} and ${checkBlocks[1].line}) — keep one`);
  }
  if (!config.found) return config;
  for (const raw of checkBlocks[0].lines) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const pair = /^([\w-]+)\s*:\s*(.*)$/.exec(line);
    if (!pair) throw new UsageError(`${source}: cannot read "${raw.trim()}" in the check block`);
    const [, key, value] = pair;
    if (key === 'scale') {
      if (config.scale) throw new UsageError(`${source}: "scale" is set twice in the check block`);
      config.scale = scaleValue(value, `${source}: scale`);
    } else if (LIST_KEYS.includes(key)) {
      // Lists may span several lines, one per source; each line adds.
      config[key].push(...list(value));
    } else {
      throw new UsageError(`${source}: unknown key "${key}" in the check block — use scale, allow, ban or external`);
    }
  }
  return config;
}

// ---------------------------------------------------------------------------
// STORY.md structure (references/bible.md)

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
const ID = new RegExp(`\\b[BFPQ]-${SLUG}\\b`, 'g');
const idsIn = (text, letter) => [...text.matchAll(new RegExp(`\\b${letter}-${SLUG}\\b`, 'g'))].map(m => m[0]);
const leadingId = (text, letter) => new RegExp(`^(${letter}-${SLUG})\\b`).exec(text)?.[1] ?? null;

export const STATUSES = ['settled', 'as-built', 'proposed', 'open', 'cut'];
const STATUS_AT_END = /\s*([*_]?)\(\s*(settled|as-built|proposed|open|cut)(?=[\s,;:)—–])[^)]*\)\1\s*$/i;
const MARKER_AT_END = /\s*([*_])\(\s*([^)]*?)\s*\)\1\s*$/;

function splitStatus(text) {
  const known = STATUS_AT_END.exec(text);
  if (known) return { title: text.slice(0, known.index).trim(), status: known[2].toLowerCase(), unknown: null };
  const other = MARKER_AT_END.exec(text);
  if (other) return { title: text.slice(0, other.index).trim(), status: null, unknown: other[2] };
  return { title: text.trim(), status: null, unknown: null };
}

const keyOf = title => title.toLowerCase().replace(/\s+/g, ' ').trim();
const fieldKey = name => keyOf(name).replace(/\s*\/\s*/g, ' / ');

// `- **Key**: value`, `- [M] **Key**: value`, or `- **Key:** value`; more
// `**Key**: value` pairs may follow on the same line.
const FIELD = /^ ?[-*+]\s+(?:\[[SML]\]\s*)?\*\*([^*]+?)(?::\*\*|\*\*\s*:)[ \t]*(.*)$/;
const NEXT_FIELD = /\s+\*\*([^*]+?)(?::\*\*|\*\*\s*:)[ \t]*/g;

function fieldsOf(lines) {
  const fields = new Map();
  let last = null;
  for (const { n, text } of lines) {
    const field = FIELD.exec(text);
    if (field) {
      const pairs = [];
      let name = field[1];
      let from = 0;
      const rest = field[2];
      for (const next of rest.matchAll(NEXT_FIELD)) {
        pairs.push([name, rest.slice(from, next.index)]);
        name = next[1];
        from = next.index + next[0].length;
      }
      pairs.push([name, rest.slice(from)]);
      for (const [key, value] of pairs) {
        const prior = fields.get(fieldKey(key));
        if (prior) {
          prior.value = [prior.value, value.trim()].filter(Boolean).join(', ');
          prior.lines.push(n);
          last = prior;
        } else {
          last = { name: key.trim(), value: value.trim(), line: n, lines: [n] };
          fields.set(fieldKey(key), last);
        }
      }
    } else if (last && /^\s+\S/.test(text)) {
      // A value continues on following indented lines.
      last.value = `${last.value} ${text.trim()}`.trim();
      last.lines.push(n);
    } else {
      last = null;
    }
  }
  return fields;
}

function itemsOf(section, letter) {
  const items = [];
  let item = null;
  for (const { n, text } of section.lines.slice(1)) {
    const start = /^[-*+]\s+(.*)$/.exec(text);
    if (start) {
      item = { line: n, text: start[1].trim(), lines: [n] };
      items.push(item);
    } else if (item && /^\s+\S/.test(text)) {
      item.text += ` ${text.trim()}`;
      item.lines.push(n);
    } else {
      item = null;
    }
  }
  for (const it of items) {
    it.id = new RegExp(`^\\*\\*(${letter}-${SLUG})\\*\\*`).exec(it.text)?.[1] ?? null;
    const { status, unknown } = splitStatus(it.text);
    Object.assign(it, { status, unknown, location: { label: `${section.title} › ${it.id ?? '(no ID)'}`, line: it.line } });
  }
  return items;
}

/**
 * Read a STORY.md into sections (`## `), their entries (`### `) with fields,
 * and the items of Promises and Open questions. Code fences and comments are
 * already blank. Each line knows its most specific location.
 */
export function parseStory(text, source = '') {
  const { lines, checkBlocks } = maskMarkdown(text, { source });
  const preamble = { location: { label: 'Preamble', line: 1 }, own: [] };
  const sections = [];
  const where = [];
  let section = null;
  let entry = null;
  lines.forEach((content, i) => {
    const line = { n: i + 1, text: content };
    const h2 = /^##(?!#)\s+(.*?)\s*$/.exec(content);
    const h3 = /^###(?!#)\s+(.*?)\s*$/.exec(content);
    if (h2) {
      const { title, status, unknown } = splitStatus(h2[1]);
      section = {
        title, key: keyOf(title), line: line.n, status, unknown, location: { label: title, line: line.n },
        own: [line], lines: [line], entries: [],
      };
      sections.push(section);
      entry = null;
    } else if (h3 && section) {
      const { title, status, unknown } = splitStatus(h3[1]);
      const [label, ...role] = title.split(/\s+·\s+/);
      entry = {
        title, label: label.trim(), role: role.join(' · '), line: line.n, status, unknown,
        location: { label: `${section.title} › ${label.trim()}`, line: line.n }, lines: [line],
      };
      section.entries.push(entry);
      section.lines.push(line);
    } else if (section) {
      section.lines.push(line);
      (entry ? entry.lines : section.own).push(line);
    } else {
      preamble.own.push(line);
    }
    where.push((entry ?? section ?? preamble).location);
  });
  for (const s of sections) {
    for (const e of s.entries) e.fields = fieldsOf(e.lines.slice(1));
    const letter = { promises: 'P', 'open questions': 'Q' }[s.key];
    s.items = letter ? itemsOf(s, letter) : [];
    for (const item of s.items) for (const n of item.lines) where[n - 1] = item.location;
  }
  const sectionsNamed = name => sections.filter(s => s.key === keyOf(name));
  return { lines, checkBlocks, preamble, sections, sectionsNamed, locate: n => where[n - 1] };
}

const EXPLICIT_EMPTY = new Set(['—', '–', '-', 'none', 'n/a']);
const bare = value => (value ?? '').replace(/[`*_]/g, '').trim();
const isExplicitEmpty = value => EXPLICIT_EMPTY.has(bare(value).replace(/\.$/, '').toLowerCase());
const firstWord = value => bare(value).toLowerCase().split(/[^\p{L}\p{N}-]+/u).find(Boolean) ?? '';
const fieldOf = (entry, ...names) => names.map(name => entry.fields.get(fieldKey(name))).find(Boolean);
const filled = field => Boolean(field && bare(field.value) && !isExplicitEmpty(field.value));
const flagsIn = field =>
  field && !isExplicitEmpty(field.value)
    ? field.value.split(/[,;]/).map(t => t.replace(/`/g, '').trim().replace(/\.$/, '')).filter(t => t && !isExplicitEmpty(t))
    : [];
const loadBearing = beat => bare(fieldOf(beat, 'Weight')?.value).toLowerCase().startsWith('load-bearing');
const mentions = (text, word, flags = 'u') =>
  new RegExp(`(?<![\\p{L}\\p{N}_])${escape(word)}(?![\\p{L}\\p{N}_])`, flags).test(text);

const STOPWORDS = new Set((
  'a an the and or but nor so yet if then than of to in on at by for with from into onto over under as is are was ' +
  'were be been being am it its this that these those he she they them his her hers their theirs him i me my we us ' +
  'our you your who whom whose which what when where why how all any each every some no not only own same such too ' +
  'very can could will would shall should may might must do does did done has have had there here just also about ' +
  'up down out off again once more most other one'
).split(' '));
const plainWords = text =>
  straight(text.replace(/[*_`]/g, ''))
    .toLowerCase()
    .split(/[\s—–]+/)
    .map(word => word.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
const contentWords = text => new Set(plainWords(text).filter(word => !STOPWORDS.has(word)));

function jaccard(a, b) {
  const shared = [...a].filter(word => b.has(word)).length;
  return shared / (a.size + b.size - shared || 1);
}

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}

const S_SECTIONS = ['One-sheet', 'Synopsis', 'Rules', 'Truth', 'Cast', 'Beat map', 'Open questions', 'Changelog'];
const M_SECTIONS = [...S_SECTIONS, 'Key scenes', 'Reveals', 'Promises', 'Names'];
export const REQUIRED_SECTIONS = Object.freeze({ S: S_SECTIONS, M: M_SECTIONS, L: [...M_SECTIONS, 'Places and factions', 'Sources'] });
const sectionScale = name => SCALES.find(scale => REQUIRED_SECTIONS[scale].includes(name));

const required = (label, keys = [label]) => ({ label, keys });
const BEAT_FIELDS = {
  S: ['Where', 'Player', 'Change'].map(name => required(name)),
  M: ['Needs', 'Sets', 'Delivery', 'Weight'].map(name => required(name)),
  L: ['Gate', 'Theme'].map(name => required(name)),
};
const CAST_FIELDS = {
  S: [required('Want')],
  M: ['Tier', 'Weakness', 'Arc', 'Stance'].map(name => required(name)),
  L: [required('Lie (or Doubt)', ['Lie', 'Doubt']), required('Pressure choice'), required('Player should feel')],
};
const ANTAGONIST_FIELDS = [
  required('Shared goal / method', ['Shared goal / method', 'Shared goal']),
  required('Exploits'), required('Counter-argument'), required('Front'),
];
const MAY_BE_EMPTY = new Set(['Needs', 'Sets']);
const PLAYER_VERBS = ['does', 'finds', 'chooses', 'watches'];
const ENTRY_SECTIONS = ['Cast', 'Places and factions', 'Beat map', 'Reveals'];
const WHOLE_FILE = { label: 'Whole file', line: 0 };

function checkStructure(doc, { scale = 'M', external = [] } = {}) {
  const out = [];
  const add = (location, check, message, note = false) => out.push({ location, check, message, excerpt: '', note });
  const entriesIn = name => doc.sectionsNamed(name).flatMap(s => s.entries);
  const live = entry => entry.status !== 'cut';
  const upTo = table => SCALES.filter(level => atLeast(scale, level)).flatMap(level => table[level].map(f => [f, level]));

  function requireField(entry, check, { label, keys }, why) {
    const fields = keys.map(key => fieldOf(entry, key)).filter(Boolean);
    if (fields.some(filled)) return;
    const [field] = fields;
    if (!field) add(entry.location, check, `no ${label} — ${why}`);
    else if (!bare(field.value)) add(entry.location, check, `${label} is empty — ${why}`);
    else if (!MAY_BE_EMPTY.has(label)) {
      add(entry.location, check, `${label} is "${bare(field.value)}" — only Needs and Sets may be left explicitly empty`);
    }
  }

  // sections, legend
  for (const name of REQUIRED_SECTIONS[scale]) {
    if (!doc.sectionsNamed(name).length) {
      add(WHOLE_FILE, 'sections', `missing section "## ${name}" — required from scale ${sectionScale(name)}`);
    }
  }
  if (!doc.lines.some(line => /status legend/i.test(line))) {
    add(WHOLE_FILE, 'legend', 'no "Status legend" line — add "Status legend: settled · as-built · proposed · open · cut" under the title');
  }

  // status
  const promises = doc.sectionsNamed('Promises').flatMap(s => s.items);
  const questions = doc.sectionsNamed('Open questions').flatMap(s => s.items);
  const marked = [
    ...['One-sheet', 'Synopsis', 'Truth', 'Key scenes'].flatMap(name => doc.sectionsNamed(name)),
    ...ENTRY_SECTIONS.flatMap(entriesIn),
    ...promises,
  ];
  for (const thing of marked) {
    if (thing.status) continue;
    add(thing.location, 'status', thing.unknown !== null
      ? `"${thing.unknown}" isn't a status — use settled, as-built, proposed, open or cut`
      : 'no status marker — end it with *(settled)*, *(as-built)*, *(proposed)*, *(open)* or *(cut)*');
  }

  // ids
  const defined = new Map();
  const define = (id, location) => {
    if (defined.has(id)) add(location, 'ids', `${id} is defined twice — first at line ${defined.get(id)}`);
    else defined.set(id, location.line);
  };
  for (const [name, letter, form] of [['Beat map', 'B', 'a B- ID: "### B-<slug> · <title>"'], ['Reveals', 'F', 'an F- ID: "### F-<slug> · <the fact>"']]) {
    for (const entry of entriesIn(name)) {
      entry.id = leadingId(entry.title, letter);
      if (entry.id) define(entry.id, entry.location);
      else add(entry.location, 'ids', `${name} entry doesn't start with ${form}`);
    }
  }
  for (const [items, name, letter] of [[promises, 'Promises', 'P'], [questions, 'Open questions', 'Q']]) {
    for (const item of items) {
      if (item.id) define(item.id, item.location);
      else add(item.location, 'ids', `${name} item doesn't start with **${letter}-<slug>**`);
    }
  }

  // refs
  const reported = new Set();
  doc.lines.forEach((line, i) => {
    for (const [id] of line.matchAll(ID)) {
      const location = doc.locate(i + 1);
      const key = `${location.line}|${location.label}|${id}`;
      if (defined.has(id) || reported.has(key)) continue;
      reported.add(key);
      add(location, 'refs', `${id} is used but never defined`);
    }
  });

  // beats
  const beats = entriesIn('Beat map').filter(live);
  const beatMap = doc.sectionsNamed('Beat map')[0]?.location;
  const nameOf = entry => entry.id ?? entry.label;
  for (const beat of beats) {
    for (const [field, level] of upTo(BEAT_FIELDS)) requireField(beat, 'beat-fields', field, `required from scale ${level}`);
    if (atLeast(scale, 'L') && loadBearing(beat)) {
      requireField(beat, 'beat-fields', required('Fallback'), 'load-bearing beats need one at scale L');
    }
  }
  if (atLeast(scale, 'M')) {
    for (const beat of beats) {
      const player = fieldOf(beat, 'Player');
      if (!filled(player)) continue;
      const verb = firstWord(player.value);
      if (!PLAYER_VERBS.includes(verb)) {
        add(beat.location, 'player-verb', `Player starts "${verb || bare(player.value).split(/\s/)[0]}" — say how the player meets it: does, finds, chooses or watches`);
      }
    }
    const carrying = beats.filter(loadBearing);
    const watched = carrying.filter(beat => firstWord(fieldOf(beat, 'Player')?.value) === 'watches');
    if (carrying.length && watched.length > carrying.length / 2) {
      add(beatMap, 'watched-story',
        `${watched.length} of ${carrying.length} load-bearing beats start Player with "watches" — the story sits beside play rather than in it`, true);
    }
  }
  if (scale === 'M') {
    for (const beat of beats.filter(loadBearing)) {
      if (!filled(fieldOf(beat, 'Fallback'))) {
        add(beat.location, 'fallback', 'load-bearing beat with no Fallback — name the route if the NPC is dead, the item lost or the region skipped', true);
      }
    }
  }

  // flags
  const needs = beats.map(beat => ({ beat, flags: [...new Set(flagsIn(fieldOf(beat, 'Needs')))] }));
  const sets = beats.map(beat => ({ beat, flags: [...new Set(flagsIn(fieldOf(beat, 'Sets')))] }));
  const setAnywhere = new Set(sets.flatMap(s => s.flags));
  const neededAnywhere = new Set(needs.flatMap(s => s.flags));
  const outside = new Set(external);
  for (const { beat, flags } of needs) {
    for (const flag of flags) {
      if (setAnywhere.has(flag) || outside.has(flag)) continue;
      add(beat.location, 'flags', `needs "${flag}", which no beat sets and the check block doesn't list as external — a soft-lock or a missing beat`);
    }
  }
  const setsLines = new Set(entriesIn('Beat map').flatMap(beat => fieldOf(beat, 'Sets')?.lines ?? []));
  const elsewhere = doc.lines.filter((_, i) => !setsLines.has(i + 1)).join('\n');
  for (const { beat, flags } of sets) {
    for (const flag of flags) {
      if (neededAnywhere.has(flag) || mentions(elsewhere, flag)) continue;
      add(beat.location, 'flags-unread', `sets "${flag}", which no beat needs and nothing else in the file mentions — set but never read`, true);
    }
  }

  // reveals, not-before
  const facts = entriesIn('Reveals').filter(live);
  const carriers = new Map();
  for (const beat of beats) {
    for (const id of new Set(idsIn(fieldOf(beat, 'Reveals')?.value ?? '', 'F'))) {
      carriers.set(id, [...(carriers.get(id) ?? []), beat]);
    }
  }
  if (atLeast(scale, 'M')) {
    for (const fact of facts) {
      const mustKnow = fieldOf(fact, 'Must-know');
      const value = filled(mustKnow) ? firstWord(mustKnow.value) : null;
      if (!value) add(fact.location, 'reveals', 'no Must-know — say yes, no or hidden');
      else if (!['yes', 'no', 'hidden'].includes(value)) add(fact.location, 'reveals', `Must-know is "${value}" — use yes, no or hidden`);
      if (!fact.id) continue;
      const by = carriers.get(fact.id) ?? [];
      if (value !== 'hidden' && by.length === 0) {
        add(fact.location, 'reveals', 'no beat reveals it — it never reaches the player');
      } else if (value === 'yes' && by.length === 1) {
        add(fact.location, 'reveals', `must-know, but only ${nameOf(by[0])} reveals it — one carrier, players will miss it`);
      }
    }
  }
  const order = new Map(beats.filter(beat => beat.id).map(beat => [beat.id, beats.indexOf(beat)]));
  for (const fact of facts.filter(f => f.id)) {
    const [notBefore] = idsIn(fieldOf(fact, 'Not before')?.value ?? '', 'B');
    if (!order.has(notBefore)) continue;
    for (const beat of carriers.get(fact.id) ?? []) {
      if (beats.indexOf(beat) < order.get(notBefore)) {
        add(beat.location, 'not-before', `reveals ${fact.id}, but ${fact.id} is Not before ${notBefore}, which comes later in the beat map`);
      }
    }
  }

  // cast
  const cast = entriesIn('Cast').filter(live);
  for (const person of cast) {
    for (const [field, level] of upTo(CAST_FIELDS)) requireField(person, 'cast-fields', field, `required from scale ${level}`);
    const antagonist = /antagonist|villain/i.test(person.role) || Boolean(fieldOf(person, 'Front'));
    if (antagonist && atLeast(scale, 'M')) {
      for (const field of ANTAGONIST_FIELDS) requireField(person, 'cast-fields', field, 'antagonists need it from scale M');
    }
  }
  const beatMapText = [
    ...doc.sectionsNamed('Beat map').flatMap(s => s.own),
    ...beats.flatMap(beat => beat.lines),
  ].map(line => line.text).join('\n');
  for (const person of cast) {
    const tier = firstWord(fieldOf(person, 'Tier')?.value);
    if (tier !== 'core' && tier !== 'recurring') continue;
    const first = person.label.split(/\s+/)[0];
    if (mentions(beatMapText, person.label, 'iu') || mentions(beatMapText, first, 'iu')) continue;
    add(person.location, 'cast-unused', `${person.label} never appears in the Beat map — give them a beat, or lower their tier`, tier === 'recurring');
  }
  for (let j = 0; j < cast.length; j++) {
    for (let i = 0; i < j; i++) {
      const [a, b] = [cast[i], cast[j]].map(person => person.label.split(/\s+/)[0]);
      const sameLetter = a[0]?.toLowerCase() === b[0]?.toLowerCase();
      const distance = editDistance(a.toLowerCase(), b.toLowerCase());
      if (!sameLetter && distance > 2) continue;
      const how = [sameLetter && 'share a first letter', distance <= 2 && `are ${plural(distance, 'edit')} apart`].filter(Boolean);
      add(cast[j].location, 'name-collision', `"${b}" and "${a}" ${how.join(' and ')} — easy to mix up`, true);
    }
  }
  const stances = cast.map(person => contentWords(fieldOf(person, 'Stance')?.value ?? ''));
  for (let j = 0; j < cast.length; j++) {
    for (let i = 0; i < j; i++) {
      if (!stances[i].size || !stances[j].size) continue;
      const overlap = jaccard(stances[i], stances[j]);
      if (overlap >= 0.6) {
        add(cast[j].location, 'stance',
          `Stance shares ${Math.round(overlap * 100)}% of its content words with ${cast[i].label}'s — they answer the theme question the same way`, true);
      }
    }
  }

  // promises
  if (atLeast(scale, 'M')) {
    for (const item of promises) {
      if (item.status === 'cut' || /paid off at/i.test(item.text) || /acknowledged/i.test(item.text)) continue;
      add(item.location, 'promises', 'no "paid off at" — pay it off, or mark it acknowledged or cut');
    }
  }

  // peak, theme-midpoint
  if (beats.length) {
    const highs = beats.filter(beat => firstWord(fieldOf(beat, 'Peak')?.value) === 'high');
    if (highs.length) {
      const last = beats.indexOf(highs.at(-1));
      if (last < 0.75 * (beats.length - 1)) {
        add(beatMap, 'peak', `the last Peak: high beat, ${nameOf(highs.at(-1))}, is beat ${last + 1} of ${beats.length} — the climax is front-loaded`);
      }
    } else if (atLeast(scale, 'M')) {
      add(beatMap, 'peak', 'no beat marks Peak: high — mark the climax so its place in the beat map can be checked', true);
    }
    if (atLeast(scale, 'M') && !beats.some((beat, i) => i < beats.length / 2 && filled(fieldOf(beat, 'Theme')))) {
      add(beatMap, 'theme-midpoint', 'no beat in the first half of the beat map has a Theme — the theme first appears after the midpoint, and most players never finish', true);
    }
  }
  return out;
}

function scanUnits(units, rules, locate = null) {
  const findings = [];
  const seen = new Set();
  for (const unit of units) {
    const text = unit.lines.map(line => line.text).join('\n');
    const starts = [];
    let offset = 0;
    for (const line of unit.lines) {
      starts.push(offset);
      offset += line.text.length + 1;
    }
    for (const hit of scanText(text, rules)) {
      let k = 0;
      while (k + 1 < starts.length && starts[k + 1] <= hit.index) k++;
      const location = hit.wholeUnit || !locate ? unit.location : locate(unit.lines[k].n);
      const key = `${location.line}|${location.label}|${hit.key}`;
      if (seen.has(key)) continue;
      seen.add(key);
      findings.push({ location, check: hit.check, message: hit.message, excerpt: hit.excerpt, note: hit.note });
    }
  }
  return findings;
}

/**
 * All findings for a STORY.md: the scan checks over every location (the
 * preamble, each section's own text, each `###` entry — the Changelog
 * excepted), then the structure checks unless scanOnly.
 */
export function checkStory(text, rules = {}, { scanOnly = false, source = '' } = {}) {
  const doc = parseStory(text, source);
  const units = [{ location: doc.preamble.location, lines: doc.preamble.own }];
  for (const section of doc.sections) {
    if (section.key === 'changelog') continue;
    units.push({ location: section.location, lines: section.own });
    for (const entry of section.entries) units.push({ location: entry.location, lines: entry.lines });
  }
  const findings = scanUnits(units, rules, doc.locate);
  if (!scanOnly) findings.push(...checkStructure(doc, rules));
  return findings;
}

/** The rules for a story file: its check block, then the command line on top. */
export function resolveRules(text, source, { scale = null, ban = [], allow = [] } = {}) {
  const block = parseCheckBlock(text, source);
  return {
    scale: scale ?? block.scale ?? 'M',
    scaleFrom: scale ? '--scale' : block.scale ? 'check block' : null,
    hasBlock: block.found,
    ban: [...block.ban, ...ban],
    allow: [...block.allow, ...allow],
    external: block.external,
  };
}

// ---------------------------------------------------------------------------
// Premises

export function parsePremises(text) {
  const blocks = [];
  let stray = 0;
  unixLines(text).split('\n').forEach((line, i) => {
    const heading = /^###\s+(\S+)\s*(.*)$/.exec(line);
    if (heading) {
      blocks.push({ id: heading[1], heading: heading[2].replace(/^·\s*/, '').trim(), body: [], line: i + 1 });
    } else if (/^###/.test(line)) {
      // `###B`, `#### B`, `### ` would otherwise merge into the premise above, unchecked as a premise.
      throw new UsageError(`line ${i + 1} looks like a heading but isn't "### <id>": ${line.trim()}`);
    } else if (blocks.length) {
      blocks.at(-1).body.push(line);
    } else if (line.trim() && !stray) {
      stray = i + 1;
    }
  });
  if (stray) throw new UsageError(`text before the first ### heading (line ${stray}) would go unchecked`);
  if (!blocks.length) throw new UsageError('no premises: each premise starts with a "### <id> · <heading>" line');
  const parsed = blocks.map(({ id, heading, body, line }) => ({ id, heading, body: body.join('\n'), text: body.join('\n').trim(), line }));
  const empty = parsed.find(premise => !premise.text);
  if (empty) throw new UsageError(`premise ${empty.id} (line ${empty.line}) has no text`);
  return parsed;
}

export const ACROSS_PREMISES = Object.freeze({ label: 'Across premises', line: Infinity });

export function premiseLocation(premise) {
  return { label: [premise.id, premise.heading].filter(Boolean).join(' · '), line: premise.line };
}

export function checkPremises(premises, rules = {}) {
  const units = premises.map(premise => {
    const { lines } = maskMarkdown(premise.body, { firstLine: premise.line + 1 });
    return { premise, location: premiseLocation(premise), lines: lines.map((text, i) => ({ n: premise.line + 1 + i, text })) };
  });
  const findings = scanUnits(units, rules);
  const across = (check, message) => findings.push({ location: ACROSS_PREMISES, check, message, excerpt: '', note: false });
  const texts = units.map(unit => unit.lines.map(line => line.text).join('\n'));
  const words = texts.map(plainWords);
  const content = texts.map(contentWords);
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const [a, b] = [premises[i].id, premises[j].id];
      const opening = words[i].slice(0, 3).join(' ');
      const sameOpening = words[i].length >= 3 && opening === words[j].slice(0, 3).join(' ');
      const overlap = jaccard(content[i], content[j]);
      if (sameOpening) across('too-alike', `${a} and ${b} both open "${opening}" — one idea twice`);
      else if (overlap > 0.5) across('too-alike', `${a} and ${b} share ${Math.round(overlap * 100)}% of their content words — one idea twice`);
    }
  }
  if (premises.length < 2) {
    across('premise-count', `only ${plural(premises.length, 'premise')} — draft at least 2 that differ, so there is a choice`);
  }
  return findings;
}

// ---------------------------------------------------------------------------
// Report and command line

/**
 * Findings grouped by location in file order; `always` lists locations to
 * print even when clean (each premise). Notes are marked and never counted
 * as findings.
 */
export function formatReport(findings, { header, preface = [], always = [] }) {
  const keyFor = location => `${location.line}|${location.label}`;
  const groups = new Map();
  for (const location of always) groups.set(keyFor(location), { location, rows: [] });
  for (const finding of findings) {
    const key = keyFor(finding.location);
    if (!groups.has(key)) groups.set(key, { location: finding.location, rows: [] });
    groups.get(key).rows.push(finding);
  }
  const out = [header, ...preface, ''];
  for (const { location, rows } of [...groups.values()].sort((a, b) => a.location.line - b.location.line)) {
    const line = location.line > 0 && Number.isFinite(location.line) ? ` (line ${location.line})` : '';
    out.push(`${location.label}${line}${rows.length ? '' : '  clean'}`);
    for (const f of rows) out.push(`  ${f.note ? 'note ' : ''}[${f.check}] ${f.message}${f.excerpt ? ` — "${f.excerpt}"` : ''}`);
  }
  if (groups.size) out.push('');
  const failing = findings.filter(f => !f.note).length;
  out.push(`${plural(failing, 'finding')}, ${plural(findings.length - failing, 'note')}.`);
  return out.join('\n');
}

export function parseCli(argv) {
  const options = { file: null, scale: null, ban: [], allow: [], scanOnly: false, premises: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('-')) {
      if (options.file) throw new UsageError(`unexpected argument "${arg}"`);
      options.file = arg;
      continue;
    }
    const eq = arg.indexOf('=');
    const name = arg.slice(arg.startsWith('--') ? 2 : 1, eq < 0 ? undefined : eq);
    if (!arg.startsWith('--')) throw new UsageError(`unknown flag ${arg}`);
    if (name === 'scan-only' || name === 'premises') {
      if (eq >= 0) throw new UsageError(`--${name} takes no value`);
      options[name === 'scan-only' ? 'scanOnly' : 'premises'] = true;
      continue;
    }
    if (!['scale', 'ban', 'allow'].includes(name)) throw new UsageError(`unknown flag --${name}`);
    const value = eq < 0 ? argv[++i] : arg.slice(eq + 1);
    if (value === undefined) throw new UsageError(`--${name} needs a value`);
    if (name === 'scale') {
      if (options.scale) throw new UsageError('--scale is given twice');
      options.scale = scaleValue(value, '--scale');
    } else {
      options[name].push(...list(value));
    }
  }
  if (!options.file) throw new UsageError('no file given');
  if (options.premises && (options.scale || options.scanOnly)) {
    throw new UsageError('--premises takes only --ban and --allow');
  }
  return options;
}

const describeLists = rules =>
  ['ban', 'allow', 'external']
    .filter(key => rules[key]?.length)
    .map(key => ` · ${key}: ${rules[key].join(', ')}`)
    .join('');

function read(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch (error) {
    throw new UsageError(`cannot read ${path} (${error.code ?? error.message})`);
  }
}

export async function main(argv) {
  try {
    if (argv.includes('--help') || argv.includes('-h')) {
      console.log(USAGE);
      return 0;
    }
    const options = parseCli(argv);
    const text = read(options.file);
    let findings;
    let report;
    if (options.premises) {
      const premises = parsePremises(text);
      findings = checkPremises(premises, options);
      report = formatReport(findings, {
        header: `${options.file} · ${plural(premises.length, 'premise')}${describeLists(options)}`,
        always: premises.map(premiseLocation),
      });
    } else {
      const rules = resolveRules(text, options.file, options);
      findings = checkStory(text, rules, { scanOnly: options.scanOnly, source: options.file });
      const preface = [];
      if (!options.scanOnly && !rules.scaleFrom) {
        preface.push(rules.hasBlock
          ? `note: the check block sets no scale — checking at scale ${rules.scale}`
          : `note: no \`\`\`check block — checking at scale ${rules.scale}`);
      }
      const mode = options.scanOnly ? 'scan only' : `scale ${rules.scale} (${rules.scaleFrom ?? 'default'})`;
      report = formatReport(findings, { header: `${options.file} · ${mode}${describeLists(rules)}`, preface });
    }
    console.log(report);
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
