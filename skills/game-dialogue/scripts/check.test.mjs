// Tests for check.mjs. Run: node --test 'skills/game-dialogue/scripts/*.test.mjs'
// (Node 22+ reads --test arguments as globs, so a bare directory finds no tests.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_RULES,
  UsageError,
  checkTake,
  checkTakes,
  countWords,
  findPhrase,
  main,
  mergeRules,
  parseDrafts,
  parseRules,
} from './check.mjs';

const dir = mkdtempSync(join(tmpdir(), 'game-dialogue-check-'));
let fixtures = 0;
function fixture(text) {
  const path = join(dir, `f${++fixtures}.md`);
  writeFileSync(path, text);
  return path;
}

// Keep main's report and usage errors out of the test output.
async function quiet(fn) {
  const { log, error } = console;
  console.log = console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
}

test('parseDrafts splits takes by ### heading', () => {
  const takes = parseDrafts('### A · Maren → player\nThat is his shield.\n\n### B\nNo body.\n');
  assert.deepEqual(takes.map(t => [t.id, t.heading, t.text, t.line]),
    [['A', 'Maren → player', 'That is his shield.', 1], ['B', '', 'No body.', 4]]);
});

test('parseDrafts accepts CRLF', () => {
  assert.equal(parseDrafts('### A\r\nOne.\r\n### B\r\nTwo.\r\n')[1].text, 'Two.');
});

test('parseDrafts rejects a file with no heading', () => {
  assert.throws(() => parseDrafts('Just a line.'), UsageError);
});

test('parseDrafts rejects text before the first heading', () => {
  assert.throws(() => parseDrafts('stray\n### A\nOne.'), UsageError);
});

test('parseRules reads the check block', () => {
  const md = 'x\n```check\nban: floor, floors, Ashwick\nwords: 80-120  # long reading box\naddress: any\n```\n';
  assert.deepEqual(parseRules(md, 'VOICES.md'),
    { ban: ['floor', 'floors', 'Ashwick'], allow: [], words: { min: 80, max: 120 }, maxChars: null, address: 'any' });
});

test('parseRules accepts CRLF', () => {
  assert.deepEqual(parseRules('```check\r\nban: floor\r\n```\r\n', 'v').ban, ['floor']);
});

test('parseRules without a check block names the file', () => {
  assert.throws(() => parseRules('# Voices\n', 'docs/VOICES.md'), /docs\/VOICES\.md/);
});

test('parseRules extends repeated ban and allow lines', () => {
  const r = parseRules('```check\nban: floor  # canon\nban: Ashwick  # style guide\nallow: Mara\nallow: Elara\n```', 'v');
  assert.deepEqual([r.ban, r.allow], [['floor', 'Ashwick'], ['Mara', 'Elara']]);
});

test('parseRules rejects a repeated scalar rule', () => {
  assert.throws(() => parseRules('```check\nwords: 10-20\nwords: 30-40\n```', 'v'), UsageError);
});

test('parseDrafts rejects an empty take', () => {
  assert.throws(() => parseDrafts('### A\nOne.\n### B\n\n'), /B/);
});

test('parseDrafts rejects a malformed heading instead of merging it', () => {
  for (const bad of ['###B\nTwo.', '#### B\nTwo.', '### \nTwo.']) {
    assert.throws(() => parseDrafts(`### A\nOne.\n${bad}\n`), UsageError, bad);
  }
});

test('parseRules rejects an unknown key', () => {
  assert.throws(() => parseRules('```check\nbanned: x\n```', 'v'), UsageError);
});

test('mergeRules: scalars replace, lists extend', () => {
  const r = mergeRules({ ...DEFAULT_RULES, ban: ['floor'], words: { min: 80, max: 120 } },
    { ban: ['Ashwick'], words: { min: 10, max: 20 } });
  assert.deepEqual([r.ban, r.words], [['floor', 'Ashwick'], { min: 10, max: 20 }]);
});

test('countWords ignores markup and dashes, counts a placeholder as one', () => {
  assert.equal(countWords('Welcome to *Ashford*, stranger — such as it is. {class}'), 9);
});

test('findPhrase matches whole words across diacritics and case', () => {
  assert.equal(findPhrase('The Aždaja, and aždaja.', 'Aždaja').length, 2);
  assert.equal(findPhrase('Aždajin rep', 'Aždaja').length, 0);
  assert.equal(findPhrase('floorboards', 'floor').length, 0);
});

test('checkTake flags length outside the budget', () => {
  const f = checkTake({ id: 'A', heading: '', text: 'Too short.', line: 1 },
    { ...DEFAULT_RULES, words: { min: 80, max: 120 } });
  assert.deepEqual(f.map(x => x.check), ['length']);
});

test('checkTake flags max-chars', () => {
  const f = checkTake({ id: 'A', heading: '', text: 'x'.repeat(41), line: 1 }, { ...DEFAULT_RULES, maxChars: 40 });
  assert.deepEqual(f.map(x => x.check), ['length']);
});

test('checkTake flags banned words, quoting the passage', () => {
  const [f] = checkTake({ id: 'A', heading: '', text: 'Go down to the next Floor.', line: 1 },
    { ...DEFAULT_RULES, ban: ['floor'] });
  assert.equal(f.check, 'banned');
  assert.match(f.excerpt, /next Floor/);
});

test('main exits 2 on usage errors and 0 on a clean file', async () => {
  assert.equal(await quiet(() => main([])), 2);
  assert.equal(await quiet(() => main([fixture('### A\nThat is his shield.\n')])), 0);
  assert.equal(await quiet(() => main([fixture('### A\nThat is his shield.\n'), '--rules', fixture('# no block\n')])), 2);
});

test('main exits 1 when a take has findings', async () => {
  assert.equal(await quiet(() => main([fixture('### A\nThe floor is wet.\n'), '--ban', 'floor'])), 1);
});

const take = text => ({ id: 'A', heading: '', text, line: 1 });
const checks = (text, rules = DEFAULT_RULES) => checkTake(take(text), rules).map(f => f.check);

test('stock phrases are flagged once per passage', () => {
  assert.deepEqual(checks('Your return is a testament to the old ways.'), ['stock-phrase']);
});

test('genre-stock barks are flagged as stock phrases', () => {
  for (const line of ['You can’t hide forever.', 'Show yourself!', "Must've been the wind.", 'Just a trick of the light.',
    'Not on my watch.', "I know you're there."]) {
    assert.deepEqual(checks(line), ['stock-phrase'], line);
  }
  assert.deepEqual(checks('Who goes there?'), []);
});

test('the not-X-it-is-Y construction is flagged', () => {
  assert.deepEqual(checks("It's not about the gold, it's about the mountain."), ['stock-phrase']);
  assert.deepEqual(checks("It's not far. Watch your step."), []);
});

test('default names are flagged unless allowed', () => {
  assert.deepEqual(checks('Ask Elara at the well.'), ['default-name']);
  assert.deepEqual(checks('Ask Elara at the well.', { ...DEFAULT_RULES, allow: ['Elara'] }), []);
});

test('named emotions are flagged, typographic apostrophes too', () => {
  assert.deepEqual(checks('I’m so afraid of the stone.'), ['named-emotion']);
  assert.deepEqual(checks('I feel the cold in my bones.'), ['named-emotion']);
  assert.deepEqual(checks("That's relief in my voice, isn't it."), []);
});

test('therapy-speak is flagged', () => {
  assert.deepEqual(checks("It's okay to grieve him."), ['therapy-speak']);
});

test('gendered address only under address: neutral', () => {
  assert.deepEqual(checks('Welcome, lad.'), []);
  assert.deepEqual(checks('Welcome, lad.', { ...DEFAULT_RULES, address: 'neutral' }), ['gendered-address']);
  assert.deepEqual(checks('Saladin rode in.', { ...DEFAULT_RULES, address: 'neutral' }), []);
});

test('a human-written line passes clean', () => {
  assert.deepEqual(checks("Bridge held, by the way. In case you wondered. Don't look at me like that. " +
    "You weren't there. You didn't see the water come up over the rail and take the cart.",
    { ...DEFAULT_RULES, ban: ['floor', 'floors', 'Ashwick'] }), []);
});

test('ordinary game dialogue passes clean', () => {
  for (const line of ['Healing potions, two silver.', 'You deserve to hang for this.', 'Mind the old tapestry.',
    'We delve at dawn.', 'A mix of iron and bone, that blade.']) {
    assert.deepEqual(checks(line), [], line);
  }
});

test('gendered address flags only direct address, under neutral', () => {
  const neutral = { ...DEFAULT_RULES, address: 'neutral' };
  for (const line of ['Welcome, lad.', 'Yes, sir!', 'Sir, you dropped this.', 'Good day to you, my lady.']) {
    assert.deepEqual(checks(line, neutral), ['gendered-address'], line);
  }
  for (const line of ['He was a good man.', 'Sir Roland rode in.', 'Ask the lad.']) {
    assert.deepEqual(checks(line, neutral), [], line);
  }
});

test('allow silences regex-matched stock phrases too', () => {
  assert.deepEqual(checks('The weight of the world.', { ...DEFAULT_RULES, allow: ['the weight of the world'] }), []);
});

const t = (id, text) => ({ id, heading: '', text, line: 1 });

test('placeholders must match across takes', () => {
  const f = checkTakes([t('A', 'Welcome. {class} Go down.'), t('B', 'Welcome. Go down.')])
    .find(x => x.check === 'placeholders');
  assert.deepEqual(f.takes, ['A', 'B']);
});

test('Yarn-style {$var} placeholders count', () => {
  assert.deepEqual(checkTakes([t('A', 'Hi {$name}.'), t('B', 'Hey {$name}, late again.')]), []);
});

test('takes that open alike are flagged', () => {
  const f = checkTakes([t('A', "That's his shield. Keep it."), t('B', "That's his shield, then. Sell it.")]);
  assert.deepEqual(f.map(x => x.check), ['too-alike']);
});

test('takes sharing most words are flagged', () => {
  const f = checkTakes([t('A', 'Keep the shield and go down now.'), t('B', 'Go down now and keep the shield.')]);
  assert.deepEqual(f.map(x => x.check), ['too-alike']);
});

test('different approaches pass', () => {
  assert.deepEqual(checkTakes([t('A', 'No body on the ledge. Well.'), t('B', 'Take it. I want it out of my house.')]), []);
});

test('cross-take checks compare only takes of the same line (id before the last dot)', () => {
  assert.deepEqual(checkTakes([t('elder.A', 'Welcome. {class} Go.'), t('smith.A', 'Iron, then.')]), []);
  const f = checkTakes([t('heard.1', 'Who goes there?'), t('heard.2', 'Who goes there now?'), t('seen.1', 'There!')]);
  assert.deepEqual(f.map(x => [x.check, x.takes]), [['too-alike', ['heard.1', 'heard.2']]]);
});

test('"the weight of" is flagged only as an abstract weight', () => {
  assert.deepEqual(checks('He felt the weight of his words.'), ['stock-phrase']);
  assert.deepEqual(checks('The weight of those things on the cage broke it.'), []);
});

test('flat rhythm is a note and does not fail the run', async () => {
  const [f] = checkTake(t('A', 'I went home. I ate some bread. I fed the cat. I went to bed.'), DEFAULT_RULES);
  assert.deepEqual([f.check, f.note], ['flat-rhythm', true]);
  assert.equal(await quiet(() => main([fixture('### A\nI went home. I ate some bread. I fed the cat. I went to bed.\n')])), 0);
});

test('runs as a CLI through a symlink, as an installed skill may be', () => {
  const link = join(dir, 'check-link.mjs');
  symlinkSync(fileURLToPath(new URL('./check.mjs', import.meta.url)), link);
  const run = spawnSync(process.execPath, [link, fixture('### A\nThe floor is wet.\n'), '--ban=floor'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /banned/);
});
