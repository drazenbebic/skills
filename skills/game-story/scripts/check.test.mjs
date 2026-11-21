// Tests for check.mjs. Run: node --test 'skills/game-story/scripts/*.test.mjs'
// (Node 22+ reads --test arguments as globs, so a bare directory finds no tests.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  USAGE,
  UsageError,
  checkPremises,
  checkStory,
  main,
  maskMarkdown,
  parseCheckBlock,
  parsePremises,
  resolveRules,
  scanText,
} from './check.mjs';

const dir = mkdtempSync(join(tmpdir(), 'game-story-check-'));
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

// Run main and keep what it printed.
async function capture(argv) {
  const { log, error } = console;
  const out = [];
  const err = [];
  console.log = (...args) => out.push(args.join(' '));
  console.error = (...args) => err.push(args.join(' '));
  try {
    const code = await main(argv);
    return { code, out: out.join('\n'), err: err.join('\n') };
  } finally {
    console.log = log;
    console.error = error;
  }
}

// A complete bible at scale L, original, with names from its own naming spec.
const VALID = `# Story — Brine Ledger

<!-- Maintained with the game-story skill. The owner decides canon; this file records it.
How characters sound: VOICES.md (game-dialogue). -->

Status legend: settled · as-built · proposed · open · cut

\`\`\`check
scale: L                      # S | M | L
ban: magic, wizard
external: tutorial_done       # set by the tutorial scene
\`\`\`

## One-sheet *(settled)*

- **Logline**: Tobrek, a salt-debt assessor, must certify the pump guild's books before the deep wards flood, but the books he certifies decide which wards drown.
- **Player fantasy**: be the one person in Querrat whose signature moves water.
- **Core conflict**: Tobrek wants his family's debt cleared; Vasgun wants the upper market kept dry at any price.
- **Protagonist**: wants the debt gone; needs to stop pricing people as debts.
- **Antagonist**: Vasgun Ader also wants Querrat standing, and would drown the lower wards to keep it.
- **World in a line**: a salt-mining city that sinks a finger's width a year, kept dry by guild pumps and paper.
- **Why now**: the Fourth Pump cracked last night, and the guild needs a licensed signature by the next shift bell.
- **Pillars**: every choice is a signature; numbers have names behind them; the city owns its cost (the story owns this one).
- **Theme question**: is a city worth what it costs the people underneath it?
- **Controlling idea**: a city lasts only when those above carry its cost, because a city that drowns its floor has already ended.
- **Tone**: dry, procedural, warm in the margins · matches the audit loop · no jokes at the Third Gallery memorial.
- **Contracts**: ludic — accurate assessments earn pay; narrative — the story asks Tobrek to value people over accuracy; B-pump-vote confronts the gap.
- **Not for**: players who want combat.

## Synopsis *(settled)*

Tobrek Sallum audits salt debts in Querrat, a mining city that sinks a finger's width a year. When the Fourth Pump cracks, guild master Vasgun Ader needs a licensed signature to close the lower sluices and keep the upper market dry. He offers to cancel the debt Tobrek's family has paid since the Third Gallery fell, if Tobrek signs.

Each assessment the player makes is a signature on someone's water. Going through the ward ledgers, Tobrek finds that the debt he has paid since he was twelve was written by the man now asking for his name, and that the gallery fell because Vasgun sold the brine. At the sluice vote he signs, refuses, or audits the guild itself, and the water goes where the paper sends it.

## Rules

### World rules

- Brine pumps run on signed work orders; an unsigned pump stops at the shift bell — limitation or cost: every order spends guild credit — the decision it forces on someone: whose order Tobrek signs — must the player understand it to solve something? yes *(settled)*
- Salt is weighed, never counted — limitation or cost: scales drift in damp galleries — the decision it forces on someone: which way an assessor rounds — must the player understand it to solve something? no *(settled)*

### Writing rules

- The Third Gallery dead are never shown; the memorial wall stands for them.
- Nobody states the theme question in dialogue.
- No collapse happens for spectacle; every collapse is somebody's paperwork.

## Truth *(settled)*

1. Twenty-two years ago Vasgun Ader, then a junior pump clerk, rerouted brine from the Third Gallery to sell the salt it carried.
2. The rerouted channel undercut the gallery floor. It fell during a night shift and drowned forty-one miners, Tobrek's mother Sella Sallum among them.
3. Vasgun blamed the miners' union for skipped maintenance, wrote the losses as union debt, and rose to guild master on the savings.
4. The union debt passed to the families. Tobrek has paid on his share since he was twelve.
5. Now the Fourth Pump has cracked. Vasgun plans to close the lower sluices and let the lower wards fill, to keep the upper market dry.

## Cast

### Tobrek Sallum · protagonist, salt-debt assessor *(settled)*

- **Tier**: core
- **Want**: clear his family's share of the Third Gallery debt before he turns thirty.
- **Weakness**: moral — he prices everyone, and calls it fairness.
- **Lie**: a debt paid in full makes a family clean.
- **Arc**: positive — turns at B-pump-vote.
- **Stance**: no — a city that drowns its floor is already finished; he audits until the cost lands on the guild.
- **Pressure choice**: whether to sign Vasgun's sluice order at B-pump-vote.
- **Player should feel**: competent → complicit → responsible.
- **Ties**: owes Gudrem a week's wages and has never said so.

### Vasgun Ader · antagonist, pump guild master *(settled)*

- **Tier**: core
- **Want**: keep the upper market dry through the flood season.
- **Weakness**: psychological — he cannot admit a single error, so every error grows.
- **Doubt**: whether the lower wards ever trusted him.
- **Arc**: flat — the city changes around him.
- **Stance**: yes — the city outlives any ward, so the wards with least to lose pay first.
- **Pressure choice**: offers Tobrek his mother's debt cancelled for one signature, at B-pump-vote.
- **Player should feel**: respect → unease → dread.
- **Shared goal / method**: keep Querrat standing / sacrifice the lower wards to do it.
- **Exploits**: Tobrek's need to see the family debt cleared.
- **Counter-argument**: "Close the sluices and four wards drown; leave them open and all eleven do."
- **Front**: the Fourth Pump cracks (B-first-assessment) → the lower-ward ledgers go missing (B-ward-ledgers) → the sluice vote is called early (B-pump-vote) → the sluices close at the shift bell if nobody signs against them (B-upper-market).

### Gudrem Tusk · pump-crew foreman *(settled)*

- **Tier**: recurring
- **Want**: keep his crew paid through the flood.
- **Weakness**: psychological — he trusts paper more than people.
- **Doubt**: whether the union ever deserved the blame.
- **Arc**: flat — he holds his line, and Tobrek bends toward it.
- **Stance**: no, but slowly — pump the lower wards by hand and send the bill upstairs.
- **Pressure choice**: hands Tobrek the union's real ledgers at B-ward-ledgers.
- **Player should feel**: suspicion → trust.

### Merdak Vol · guild runner *(proposed)*

- **Tier**: functional
- **Want**: a seat on the guild bench.
- **Weakness**: moral — sells gossip by the line.
- **Lie**: rank keeps you dry.
- **Arc**: corruption — turns at B-gallery-descent.
- **Stance**: whatever keeps him above the waterline.
- **Pressure choice**: reports Tobrek's descent to Vasgun at B-gallery-descent.
- **Player should feel**: amusement → contempt.

## Places and factions

### The pump guild *(settled)*

- **In the story**: issues every work order; B-first-assessment, B-pump-vote.
- **Goal / contested resource / internal dissent / stance**: a dry market / pump hours / junior clerks who doubt Vasgun / yes to the sluice order.
- **Pressure from the past**: the Third Gallery savings built its hall.

### The lower wards *(settled)*

- **In the story**: B-ward-ledgers and B-gallery-descent happen here.
- **Pressure from the past**: forty-one names on the memorial wall.
- **Hazards and who is there**: ankle-deep brine, Gudrem's crew, families still paying the union debt.

## Beat map

Ordered as most players meet them.

### B-first-assessment · The first assessment *(settled)*

- **Where**: \`mission_01_ledger\`
- **Player**: does — weighs Gudrem's crew wages against the pump order and signs or refuses it.
- **Change**: Tobrek's licence: probationary → full.
- **Needs**: —
- **Sets**: \`assessor_licensed\`
- **Delivery**: system
- **Weight**: load-bearing
- **Gate**: free
- **Theme**: states — the first sum the player balances has a family on the other side.
- **Reveals**: F-gallery-debt
- **Peak**: low
- **Fallback**: the licence is granted on load if a save skips the tutorial.
- **Purpose**: teaches a mechanic.

### B-ward-ledgers · The ward ledgers *(settled)*

- **Where**: \`mission_02_wards\`
- **Player**: finds — the union's own ledgers under Gudrem's bunk, the debts written in two hands.
- **Change**: Tobrek's trust in the guild books: whole → cracked.
- **Needs**: \`assessor_licensed\`, \`tutorial_done\`
- **Sets**: \`ledgers_found\`
- **Delivery**: environment
- **Weight**: load-bearing
- **Gate**: hub return
- **Theme**: echoes — the same debt, priced twice.
- **Reveals**: F-gallery-debt, F-rerouted-brine   **Withholds**: F-mother-signed
- **Fallback**: if Gudrem is dismissed, his crew leaves the ledgers on the assessor's desk.
- **Purpose**: introduces someone.

### B-pump-vote · The sluice vote *(settled)*

- **Where**: \`mission_03_vote\`
- **Player**: chooses — sign Vasgun's sluice order, sign against it, or abstain and let the bell decide.
- **Change**: who carries the flood: undecided → named.
- **Needs**: \`ledgers_found\`
- **Sets**: \`sluice_vote\`
- **Delivery**: scene
- **Weight**: load-bearing
- **Gate**: rank
- **Theme**: counterpoints — Vasgun's sum is correct and still wrong.
- **Reveals**: F-rerouted-brine
- **Fallback**: abstaining counts as a vote for the order; the scene still plays.
- **Purpose**: story beat.

### B-gallery-descent · Down the Third Gallery *(proposed)*

- **Where**: \`mission_04_descent\`
- **Player**: watches — Merdak lead guild clerks into the drowned gallery to strip its pump fittings.
- **Change**: the memorial: intact → stripped.
- **Needs**: \`sluice_vote\`
- **Sets**: \`fittings_stripped\`
- **Delivery**: cutscene
- **Weight**: modular
- **Gate**: free
- **Theme**: echoes — the guild prices even the dead.
- **Purpose**: breather.

### B-upper-market · The market pays *(settled)*

- **Where**: \`mission_05_market\`
- **Player**: chooses — send the flood bill to the upper market or to the wards, with Vasgun at the guild bench.
- **Change**: the city's cost: on the floor → on the market.
- **Needs**: \`sluice_vote\`
- **Sets**: —
- **Delivery**: scene
- **Weight**: load-bearing
- **Gate**: boss
- **Theme**: states — the bill lands where the controlling idea says it must.
- **Peak**: high
- **Fallback**: if the player abstained at B-pump-vote, Gudrem's crew forces the vote at the bench.
- **Pays off**: P-sluice-vote
- **Purpose**: story beat.

## Key scenes *(settled)*

- **The first assessment** (B-first-assessment): a damp gallery, a scale that drifts, a foreman watching Tobrek round down. The player learns that a number has a family behind it before they learn the rules.
- **The sluice vote** (B-pump-vote): the guild hall, the order on the table, the pen already inked. Vasgun lays the cancelled debt beside it. The player chooses, and the shift bell rings either way.

## Reveals

### F-gallery-debt · The Third Gallery debt was written against the dead, not the union *(settled)*

- **Must-know**: yes
- **Not before**: B-first-assessment
- **Who knows**: Gudrem — from the start; Tobrek — learns at B-ward-ledgers.

### F-rerouted-brine · Vasgun rerouted the brine that undercut the Third Gallery *(settled)*

- **Must-know**: yes
- **Not before**: B-ward-ledgers
- **Who knows**: Vasgun — from the start; Tobrek — learns at B-pump-vote.

### F-mother-signed · Sella Sallum countersigned the reroute order without reading it *(proposed)*

- **Must-know**: hidden
- **Who knows**: Vasgun — from the start; Tobrek — never.

## Promises

- **P-sluice-vote** — the game tells the player the sluice vote decides who carries the flood — set up at
  B-first-assessment — paid off at B-upper-market *(settled)*
- **P-mother-ledger** — Tobrek keeps his mother's ledger shut — set up at B-ward-ledgers — acknowledged: it stays
  shut, and the closing codex page says so *(proposed)*

## Names

- **Glossary**: Querrat — the city — KWEH-raht — from the guild's word for a weighing pan.
- **Naming spec** (Querrat miners): consonants t d k g r s m n v b l; vowels a e o u; two syllables, stress on the first; no "th", no "y"; three examples: Tobrek, Vasgun, Merdak.

## Sources

- **Inspiration**: keeps the weight of a signature from bureaucratic puzzle games · changes the office into a sinking salt city · the originals never made paperwork drown anyone · names, setting, characters and text are original.
- **Particulars**: pump schedules and salt weighing from the owner's visits to a working brine spring; flood-debt law from published histories of mining districts.

## Open questions

- **Q-codex-epilogue** — does the closing codex read \`fittings_stripped\` to show the stripped memorial? — yes / no — the codex art budget — the owner decides.

## Changelog

- 2026-11-20 — first outline approved — owner review — reconciled with the pitch deck — revisit: VOICES.md, mission scripts.
`;

// Replace one occurrence of each `from`, failing if it isn't there, so an edit
// to the fixture can't leave a test checking an unchanged bible.
function mutate(text, ...pairs) {
  for (const [from, to] of pairs) {
    const at = text.indexOf(from);
    assert.notEqual(at, -1, `fixture has no "${from}"`);
    text = text.slice(0, at) + to + text.slice(at + from.length);
  }
  return text;
}

const lineOf = (text, fragment) => text.split('\n').findIndex(line => line.includes(fragment)) + 1;
const story = (text, options = {}) =>
  checkStory(text, resolveRules(text, 'STORY.md', options), { scanOnly: options.scanOnly });
const only = (findings, check) => findings.filter(f => f.check === check);
const scan = (text, rules) => scanText(text, rules).map(h => h.check);

// ---------------------------------------------------------------------------
// The valid fixture

for (const scale of ['S', 'M', 'L']) {
  test(`the valid bible is clean at scale ${scale}`, () => {
    assert.deepEqual(story(VALID, { scale }), []);
  });
}

test('the valid bible exits 0 at every scale through main', async () => {
  const path = fixture(VALID);
  for (const argv of [[path], [path, '--scale', 'S'], [path, '--scale=M'], [path, '--scale', 'L']]) {
    assert.equal(await quiet(() => main(argv)), 0, argv.join(' '));
  }
});

// ---------------------------------------------------------------------------
// Scan checks

test('banned flags the project ban list, and allow does not silence it', () => {
  const [hit] = scanText('Go down to the next Floor.', { ban: ['floor'] });
  assert.equal(hit.check, 'banned');
  assert.match(hit.message, /"Floor" is banned/);
  assert.match(hit.excerpt, /next Floor/);
  assert.deepEqual(scan('Go down to the next floor.', { ban: ['floor'], allow: ['floor'] }), ['banned']);
  assert.deepEqual(scan('The floorboards creak.', { ban: ['floor'] }), []);
});

test('default-name flags the measured default names, whole-word and in any case', () => {
  for (const name of ['Elias', 'Elara', 'Mara', 'Kael', 'elara']) {
    assert.deepEqual(scan(`Ask ${name} at the well.`), ['default-name'], name);
  }
  assert.deepEqual(scan('Elara’s well.'), ['default-name']);
  assert.deepEqual(scan('Ran the marathon past Kaelen.'), ['stock-name']);
  assert.deepEqual(scan('Ask Elara at the well.', { allow: ['elara'] }), []);
});

test('stock-name is a note', () => {
  for (const name of ['Lyra', 'Seraphina', 'Thorne', 'Voss', 'Aldric', 'Elowen', 'Nyx', 'Eldoria', 'Aethelgard']) {
    const [hit] = scanText(`Then ${name} spoke.`);
    assert.deepEqual([hit.check, hit.note], ['stock-name', true], name);
  }
});

test('stock-setting flags lighthouses, Whispering titles and The Last Train', () => {
  assert.deepEqual(scan('A lighthouse on the rocks.'), ['stock-setting']);
  const hits = scanText('The old lighthouse keeper.');
  assert.deepEqual(hits.map(h => h.message.split(' is ')[0]), ['"lighthouse keeper"']);
  for (const title of ['Whispering Pines', 'Whispering Hollow', 'The Last Train', 'the Last Train']) {
    assert.deepEqual(scan(`Welcome to ${title}.`), ['stock-setting'], title);
  }
  for (const line of ['She kept whispering softly.', 'the whispering pines', 'whispering Pines']) {
    assert.deepEqual(scan(line), [], line);
  }
  assert.deepEqual(scan('The old lighthouse keeper.', { allow: ['lighthouse'] }), []);
  assert.deepEqual(scan('Down in Whispering Gallery.', { allow: ['Whispering Gallery'] }), []);
});

test('template needs words from three of the four categories in one location', () => {
  const [hit] = scanText('The baker of the village keeps a lantern lit.');
  assert.equal(hit.check, 'template');
  assert.equal(hit.excerpt, 'baker … village … lantern');
  assert.deepEqual(scan('The baker of the village keeps the books.'), []);
  assert.deepEqual(scan('A secret, a glow, and a weaver.'), ['template']);
  assert.deepEqual(scan('The baker of the village keeps a lantern lit.', { allow: ['lantern'] }), []);
});

test('template does not add up words from different locations', () => {
  const text = mutate(VALID,
    ['- **Want**: a seat on the guild bench.', '- **Want**: a seat on the guild bench, like the village baker.'],
    ['- **Tier**: recurring', '- **Tier**: recurring\n- **Ties**: keeps a lantern for a secret reason.']);
  assert.deepEqual(story(text), []);
});

test('stock-plot is a note', () => {
  for (const line of ['She is the chosen one.', 'As the prophecy says.', 'It was foretold.', 'An ancient evil.',
    'The darkness stirs.', 'Evil returns.', 'She lost her memories.', 'He has no memory of it.',
    'The last of their kind.', 'He was destined to rule.', 'An amnesiac clerk.']) {
    const hits = scanText(line);
    assert.deepEqual(hits.map(h => [h.check, h.note]), [['stock-plot', true]], line);
  }
  assert.deepEqual(scan('She chose one door.'), []);
});

test('world-stakes is a note', () => {
  for (const line of ['We must save the kingdom.', 'The end of the world.', 'The fate of the realm.', 'Destroy the world.']) {
    assert.deepEqual(scanText(line).map(h => [h.check, h.note]), [['world-stakes', true]], line);
  }
  assert.deepEqual(scan('Save the ward.'), []);
});

test('soft-villain flags a softened antagonist', () => {
  for (const line of ['He just wanted to be loved.', 'Her redemption arc.', 'Deep down she cared.', 'He was misunderstood.',
    'She is not truly evil.']) {
    assert.deepEqual(scan(line), ['soft-villain'], line);
  }
});

test('soft-resolution flags the default ending, including the whole town or city coming together', () => {
  for (const line of ['A harvest festival.', 'Peace is restored.', 'Harmony returns.', 'Balance is restored.',
    'The village came together.', 'The whole town comes together.', 'The whole city came together.',
    'Then the city comes together.', 'Everyone comes together.', 'They reconcile.', 'A heart-to-heart.']) {
    assert.deepEqual(scan(line), ['soft-resolution'], line);
  }
  assert.match(scanText('In the end the whole town comes together.')[0].message, /^"the whole town comes together"/);
  assert.deepEqual(scan('The town came apart.'), []);
});

test('stated-lesson flags a lesson said aloud, and overlapping matches count once', () => {
  for (const line of ['The power of friendship.', 'Believe in yourself.', 'She learned the value of rest.',
    'The real treasure was us.', 'It was here all along.']) {
    assert.deepEqual(scan(line), ['stated-lesson'], line);
  }
  assert.deepEqual(scan('The villain was right all along.'), ['soft-villain']);
});

test('stock-word is a note', () => {
  for (const line of ['A tapestry of lives.', 'Beyond the veil.', 'A testament to grit.', 'Whispers of war.']) {
    assert.deepEqual(scanText(line).map(h => [h.check, h.note]), [['stock-word', true]], line);
  }
});

test('typographic quotes match straight ones, in text and in allow', () => {
  assert.deepEqual(scan('They named it Mara’s Rest.', { allow: ["Mara's Rest"] }), []);
  assert.deepEqual(scan('The duke’s men.', { ban: ["duke's men"] }), ['banned']);
});

test('each distinct match is reported once per location', () => {
  const text = mutate(VALID, ['- **Want**: a seat on the guild bench.', '- **Want**: Elara, Elara and ELARA.']);
  const hits = only(story(text), 'default-name');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].location.label, 'Cast › Merdak Vol');
  assert.equal(hits[0].location.line, lineOf(text, '### Merdak Vol'));
});

test('scan findings are placed at the most specific location', () => {
  const text = mutate(VALID, ['shut, and the closing codex page says so', 'shut, as foretold']);
  const [hit] = only(story(text), 'stock-plot');
  assert.deepEqual(hit.location, { label: 'Promises › P-mother-ledger', line: lineOf(text, '**P-mother-ledger**') });
});

test('code fences and HTML comments are skipped', () => {
  const plot = '# Plot\n\n```\nElara keeps the lighthouse.\n```\n\n<!-- Elara, again -->\nThe ferry runs at dawn. <!-- Mara\n-->\n';
  assert.deepEqual(story(plot, { scanOnly: true }), []);
  assert.deepEqual(scan('```'), []);
});

test('a fence or comment that never closes is a usage error, not a clean report', () => {
  assert.throws(() => maskMarkdown('text\n```\nElara\n'), /line 2 opens a code fence/);
  assert.throws(() => maskMarkdown('text\n<!-- Elara\n'), /line 2 opens an HTML comment/);
});

test('the scan checks skip the Changelog, which records old names', () => {
  const text = mutate(VALID, ['first outline approved', 'renamed Elara to Tobrek']);
  assert.deepEqual(story(text), []);
});

// ---------------------------------------------------------------------------
// The check block

test('parseCheckBlock reads scale and adds repeated list lines', () => {
  const md = 'x\n```check\nscale: S  # small\nallow: Mara, Elara\nallow: Kael\nban: floor\nexternal: a, b\nexternal: c\n```\n';
  assert.deepEqual(parseCheckBlock(md, 'STORY.md'),
    { found: true, scale: 'S', allow: ['Mara', 'Elara', 'Kael'], ban: ['floor'], external: ['a', 'b', 'c'] });
  assert.equal(parseCheckBlock('```check\r\nscale: m\r\n```\r\n', 'v').scale, 'M');
});

test('parseCheckBlock without a block returns the defaults', () => {
  assert.deepEqual(parseCheckBlock('# Story\n', 'STORY.md'), { found: false, scale: null, allow: [], ban: [], external: [] });
  assert.equal(parseCheckBlock('````markdown\n```check\nscale: Q\n```\n````\n', 'v').found, false);
});

test('parseCheckBlock rejects unknown keys, bad or repeated scales, unreadable lines and a second block', () => {
  for (const [body, pattern] of [
    ['banned: x', /unknown key "banned"/],
    ['Scale: M', /unknown key "Scale"/],
    ['scale: XL', /scale must be S, M or L, got "XL"/],
    ['scale:', /scale must be S, M or L/],
    ['scale: S\nscale: L', /"scale" is set twice/],
    ['just words', /cannot read "just words"/],
  ]) {
    assert.throws(() => parseCheckBlock(`\`\`\`check\n${body}\n\`\`\`\n`, 'STORY.md'), pattern, body);
  }
  assert.throws(() => parseCheckBlock('```check\nscale: S\n```\n```check\nban: x\n```\n', 'v'), /two ```check blocks/);
});

test('a usage error in the check block exits 2', async () => {
  const path = fixture(mutate(VALID, ['scale: L', 'scale: XL']));
  assert.equal(await quiet(() => main([path])), 2);
});

// ---------------------------------------------------------------------------
// Command line

test('--help prints the usage and exits 0', async () => {
  const run = await capture(['--help']);
  assert.deepEqual([run.code, run.out], [0, USAGE]);
  assert.equal((await capture(['STORY.md', '--bogus', '-h'])).code, 0);
});

test('usage errors exit 2 with the message and usage on stderr', async () => {
  const path = fixture(VALID);
  for (const argv of [[], [join(dir, 'missing.md')], [path, '--bogus'], [path, '-x'], [path, '--scale', 'XL'],
    [path, '--scale'], [path, '--scale', 'S', '--scale', 'M'], [path, '--premises', '--scale', 'M'],
    [path, '--premises', '--scan-only'], [path, '--scan-only=yes'], [path, path]]) {
    const run = await capture(argv);
    assert.equal(run.code, 2, argv.join(' '));
    assert.match(run.err, /^check\.mjs: .+\nusage: node check\.mjs/, argv.join(' '));
  }
});

test('--scale overrides the check block', async () => {
  const path = fixture(mutate(VALID, ['## Names', '## Naming']));
  assert.equal(await quiet(() => main([path])), 1);
  const run = await capture([path, '--scale', 'S']);
  assert.equal(run.code, 0);
  assert.match(run.out, /^.* · scale S \(--scale\)/);
});

test('--ban and --allow add to the check block', async () => {
  const path = fixture(VALID);
  const banned = await capture([path, '--ban', 'sluices', '--ban=wizard']);
  assert.equal(banned.code, 1);
  assert.match(banned.out, /ban: magic, wizard, sluices, wizard/);
  assert.match(banned.out, /\[banned\] "sluices" is banned in this project/);
  const named = fixture(mutate(VALID, ['- **Want**: a seat on the guild bench.', '- **Want**: a seat beside Elara.']));
  assert.equal(await quiet(() => main([named])), 1);
  assert.equal(await quiet(() => main([named, '--allow', 'Kael,Elara'])), 0);
});

test('without a check block the scale is M, with a note saying so', async () => {
  const text = mutate(VALID, [VALID.slice(VALID.indexOf('```check'), VALID.indexOf('## One-sheet')), ''],
    [', `tutorial_done`', '']);
  const run = await capture([fixture(text)]);
  assert.equal(run.code, 0);
  assert.match(run.out, /scale M \(default\)\nnote: no ```check block — checking at scale M/);
  const noScale = await capture([fixture(mutate(VALID, ['scale: L', '']))]);
  assert.match(noScale.out, /note: the check block sets no scale — checking at scale M/);
});

test('--scan-only runs only the scan checks, still reading a check block', async () => {
  const plot = fixture('# Plot\n\nThe ferry runs at dawn.\n');
  assert.equal(await quiet(() => main([plot, '--scan-only'])), 0);
  assert.equal(await quiet(() => main([plot])), 1);
  const named = fixture('# Plot\n\n```check\nallow: Kael\nban: ferry\n```\n\nKael and Elara take the ferry.\n');
  const run = await capture([named, '--scan-only']);
  assert.equal(run.code, 1);
  assert.match(run.out, /scan only · ban: ferry · allow: Kael/);
  assert.match(run.out, /\[banned\] "ferry"/);
  assert.match(run.out, /\[default-name\] "Elara"/);
  assert.doesNotMatch(run.out, /"Kael"|\[sections\]/);
});

test('the report groups by location, marks notes and counts both', async () => {
  const text = mutate(VALID,
    ['- **Needs**: `ledgers_found`', '- **Needs**: `ledgers_found`; `rope_bought`'],
    ['- **Want**: a seat on the guild bench.', '- **Want**: a seat beside Lyra.']);
  const run = await capture([fixture(text)]);
  assert.equal(run.code, 1);
  assert.match(run.out, new RegExp(`\\nCast › Merdak Vol \\(line ${lineOf(text, '### Merdak Vol')}\\)\\n  note \\[stock-name\\] "Lyra"`));
  assert.match(run.out, new RegExp(`\\nBeat map › B-pump-vote \\(line ${lineOf(text, '### B-pump-vote')}\\)\\n  \\[flags\\] needs "rope_bought"`));
  assert.match(run.out, /\n\n1 finding, 1 note\.$/);
});

test('runs as a CLI through a symlink, as an installed skill may be', () => {
  const link = join(dir, 'check-link.mjs');
  symlinkSync(fileURLToPath(new URL('./check.mjs', import.meta.url)), link);
  const run = spawnSync(process.execPath, [link, fixture('# Plot\n\nElara.\n'), '--scan-only'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stdout, /default-name/);
});

// ---------------------------------------------------------------------------
// Structure checks

test('sections: each scale requires its sections', () => {
  const noNames = mutate(VALID, ['## Names', '## Naming']);
  assert.deepEqual(only(story(noNames, { scale: 'M' }), 'sections').map(f => [f.message, f.location.label]),
    [['missing section "## Names" — required from scale M', 'Whole file']]);
  assert.deepEqual(story(noNames, { scale: 'S' }), []);
  const noSources = mutate(VALID, ['## Sources', '## Credits']);
  assert.equal(only(story(noSources, { scale: 'L' }), 'sections').length, 1);
  assert.deepEqual(story(noSources, { scale: 'M' }), []);
  assert.match(only(story(mutate(VALID, ['## Changelog', '## History']), { scale: 'S' }), 'sections')[0].message, /Changelog/);
});

test('sections: Synopsis from S, Key scenes from M, both need a status', () => {
  const noSynopsis = mutate(VALID, ['## Synopsis *(settled)*', '## Summary *(settled)*']);
  assert.match(only(story(noSynopsis, { scale: 'S' }), 'sections')[0].message, /"## Synopsis" — required from scale S/);
  const noScenes = mutate(VALID, ['## Key scenes *(settled)*', '## Moments *(settled)*']);
  assert.deepEqual(story(noScenes, { scale: 'S' }), []);
  assert.match(only(story(noScenes, { scale: 'M' }), 'sections')[0].message, /"## Key scenes" — required from scale M/);
  assert.deepEqual(story(mutate(VALID, ['## Key scenes *(settled)*', '## Key scenes'])).map(f => f.check), ['status']);
});

test('sections match case-insensitively and with a status marker', () => {
  assert.deepEqual(story(mutate(VALID, ['## Beat map', '## BEAT MAP *(proposed)*'])), []);
});

test('legend: a Status legend line is required', () => {
  const text = mutate(VALID, ['Status legend: settled · as-built · proposed · open · cut\n', '']);
  assert.deepEqual(story(text).map(f => f.check), ['legend']);
});

test('status: headings, entries and promises need a known marker', () => {
  const unmarked = mutate(VALID, ['### Gudrem Tusk · pump-crew foreman *(settled)*', '### Gudrem Tusk · pump-crew foreman']);
  assert.deepEqual(story(unmarked).map(f => [f.check, f.location.label]), [['status', 'Cast › Gudrem Tusk']]);
  const draft = mutate(VALID, ['### The lower wards *(settled)*', '### The lower wards *(draft)*']);
  assert.match(only(story(draft), 'status')[0].message, /"draft" isn't a status/);
  assert.deepEqual(story(mutate(VALID, ['## Truth *(settled)*', '## Truth'])).map(f => [f.check, f.location.label]),
    [['status', 'Truth']]);
  assert.deepEqual(story(mutate(VALID, ['## One-sheet *(settled)*', '## One-sheet'])).map(f => f.check), ['status']);
  const promise = mutate(VALID, ['shut, and the closing codex page says so *(proposed)*', 'shut, and the closing codex page says so']);
  assert.deepEqual(story(promise).map(f => [f.check, f.location.label]), [['status', 'Promises › P-mother-ledger']]);
});

test('status: words may follow the status, and the plain or as-built forms count', () => {
  const text = mutate(VALID,
    ['### The pump guild *(settled)*', '### The pump guild (settled in outline)'],
    ['### Gudrem Tusk · pump-crew foreman *(settled)*', '### Gudrem Tusk · pump-crew foreman *(as-built)*']);
  assert.deepEqual(story(text), []);
});

test('ids: beats and facts start with their ID, items with theirs, and no ID is defined twice', () => {
  const noBeatId = story(mutate(VALID, ['### B-gallery-descent · Down the Third Gallery', '### Down the Third Gallery']));
  assert.match(only(noBeatId, 'ids')[0].message, /^Beat map entry doesn't start with a B- ID/);
  assert.ok(only(noBeatId, 'refs').length);
  const noFactId = story(mutate(VALID, ['### F-mother-signed · Sella', '### Sella']));
  assert.match(only(noFactId, 'ids')[0].message, /^Reveals entry doesn't start with an F- ID/);
  const twice = mutate(VALID, ['### B-gallery-descent · Down', '### B-pump-vote · Down']);
  assert.deepEqual(only(story(twice), 'ids').map(f => [f.message, f.location.line]),
    [[`B-pump-vote is defined twice — first at line ${lineOf(twice, '### B-pump-vote · The sluice vote')}`,
      lineOf(twice, '### B-pump-vote · Down')]]);
  const promise = story(mutate(VALID, ['- **P-mother-ledger** —', '- **Mother ledger** —']));
  assert.deepEqual(only(promise, 'ids').map(f => [f.message, f.location.label]),
    [["Promises item doesn't start with **P-<slug>**", 'Promises › (no ID)']]);
  const question = story(mutate(VALID, ['- **Q-codex-epilogue** —', '- Codex epilogue —']));
  assert.match(only(question, 'ids')[0].message, /^Open questions item/);
});

test('refs: an ID used but never defined, outside fences and comments', () => {
  const text = mutate(VALID, ['- **Pays off**: P-sluice-vote', '- **Pays off**: P-sluice-votes']);
  assert.deepEqual(story(text).map(f => [f.check, f.message, f.location.label]),
    [['refs', 'P-sluice-votes is used but never defined', 'Beat map › B-upper-market']]);
  const hidden = mutate(VALID, ['Ordered as most players meet them.', 'Ordered as most players meet them. <!-- B-nowhere -->\n\n```\nB-nowhere\n```']);
  assert.deepEqual(story(hidden), []);
});

test('beat-fields: required fields per scale', () => {
  const noChange = mutate(VALID, ['- **Change**: the memorial: intact → stripped.\n', '']);
  assert.deepEqual(story(noChange, { scale: 'S' }).map(f => [f.check, f.message, f.location.label]),
    [['beat-fields', 'no Change — required from scale S', 'Beat map › B-gallery-descent']]);
  const noDelivery = mutate(VALID, ['- **Delivery**: cutscene\n', '']);
  assert.deepEqual(story(noDelivery, { scale: 'M' }).map(f => f.message), ['no Delivery — required from scale M']);
  assert.deepEqual(story(noDelivery, { scale: 'S' }), []);
  const noGate = mutate(VALID, ['- **Gate**: rank\n', '']);
  assert.deepEqual(story(noGate, { scale: 'L' }).map(f => f.message), ['no Gate — required from scale L']);
  assert.deepEqual(story(noGate, { scale: 'M' }), []);
});

test('beat-fields: only Needs and Sets may be explicitly empty', () => {
  assert.deepEqual(story(mutate(VALID, ['- **Where**: `mission_03_vote`', '- **Where**: —'])).map(f => f.message),
    ['Where is "—" — only Needs and Sets may be left explicitly empty']);
  assert.deepEqual(story(mutate(VALID, ['- **Where**: `mission_03_vote`', '- **Where**: n/a'])).map(f => f.check), ['beat-fields']);
  assert.deepEqual(story(mutate(VALID, ['- **Where**: `mission_03_vote`', '- **Where**:'])).map(f => f.message),
    ['Where is empty — required from scale S']);
  assert.deepEqual(story(mutate(VALID, ['- **Sets**: `sluice_vote`', '- **Sets**: none'], ['- **Needs**: `sluice_vote`', '- **Needs**: none'],
    ['- **Needs**: `sluice_vote`', '- **Needs**: none'])), []);
});

test('beat-fields: [S] prefixes, a colon inside the bold and continued values are read', () => {
  const text = mutate(VALID,
    ['- **Where**: `mission_03_vote`', '- [S] **Where:** `mission_03_vote`'],
    ['- **Gate**: rank', '- [L] **Gate**:\n  rank, after the hub return']);
  assert.deepEqual(story(text), []);
});

test('beat-fields: a load-bearing beat needs a Fallback at L, a note at M, nothing at S', () => {
  const text = mutate(VALID, ['- **Fallback**: abstaining counts as a vote for the order; the scene still plays.\n', '']);
  assert.deepEqual(story(text, { scale: 'L' }).map(f => [f.check, f.message]),
    [['beat-fields', 'no Fallback — load-bearing beats need one at scale L']]);
  assert.deepEqual(story(text, { scale: 'M' }).map(f => [f.check, f.note, f.location.label]),
    [['fallback', true, 'Beat map › B-pump-vote']]);
  assert.deepEqual(story(text, { scale: 'S' }), []);
});

test('cut entries are kept for reference and not checked', () => {
  const text = mutate(VALID,
    ['### B-gallery-descent · Down the Third Gallery *(proposed)*', '### B-gallery-descent · Down the Third Gallery *(cut)*'],
    ['- **Change**: the memorial: intact → stripped.\n', '']);
  assert.deepEqual(story(text), []);
});

test('player-verb: Player starts with does, finds, chooses or watches, from M', () => {
  const text = mutate(VALID, ['- **Player**: does — weighs', '- **Player**: weighs']);
  assert.deepEqual(story(text, { scale: 'M' }).map(f => [f.check, f.message]),
    [['player-verb', 'Player starts "weighs" — say how the player meets it: does, finds, chooses or watches']]);
  assert.deepEqual(story(text, { scale: 'S' }), []);
});

test('watched-story: a note when most load-bearing beats are watched', () => {
  const three = mutate(VALID,
    ['- **Player**: does — weighs', '- **Player**: watches — Tobrek weigh'],
    ['- **Player**: finds — the union', '- **Player**: watches — Gudrem find the union'],
    ['- **Player**: chooses — sign Vasgun', '- **Player**: watches — Tobrek sign Vasgun']);
  assert.deepEqual(story(three, { scale: 'M' }).map(f => [f.check, f.note, f.message]),
    [['watched-story', true, '3 of 4 load-bearing beats start Player with "watches" — the story sits beside play rather than in it']]);
  assert.deepEqual(story(three, { scale: 'S' }), []);
  const two = mutate(VALID,
    ['- **Player**: does — weighs', '- **Player**: watches — Tobrek weigh'],
    ['- **Player**: finds — the union', '- **Player**: watches — Gudrem find the union']);
  assert.deepEqual(story(two, { scale: 'M' }), []);
});

test('flags: a needed flag nobody sets is a finding, unless it is external', () => {
  const text = mutate(VALID, ['- **Needs**: `ledgers_found`', '- **Needs**: `ledgers_found`; `rope_bought`']);
  assert.deepEqual(story(text, { scale: 'S' }).map(f => [f.check, f.message, f.location.label]),
    [['flags', 'needs "rope_bought", which no beat sets and the check block doesn\'t list as external — a soft-lock or a missing beat',
      'Beat map › B-pump-vote']]);
  assert.deepEqual(story(mutate(text, ['external: tutorial_done', 'external: tutorial_done\nexternal: rope_bought'])), []);
  assert.deepEqual(story(mutate(VALID, ['external: tutorial_done', 'external:'])).map(f => f.message),
    ['needs "tutorial_done", which no beat sets and the check block doesn\'t list as external — a soft-lock or a missing beat']);
});

test('flags-unread: a note for a flag set and never read anywhere', () => {
  const text = mutate(VALID, ['does the closing codex read `fittings_stripped` to show', 'does the closing codex show']);
  assert.deepEqual(story(text).map(f => [f.check, f.note, f.message, f.location.label]),
    [['flags-unread', true, 'sets "fittings_stripped", which no beat needs and nothing else in the file mentions — set but never read',
      'Beat map › B-gallery-descent']]);
});

test('reveals: Must-know, carriers and facts that never reach the player, from M', () => {
  const noMustKnow = mutate(VALID, ['- **Must-know**: hidden\n', '']);
  assert.deepEqual(story(noMustKnow, { scale: 'M' }).map(f => [f.check, f.message, f.location.label]), [
    ['reveals', 'no Must-know — say yes, no or hidden', 'Reveals › F-mother-signed'],
    ['reveals', 'no beat reveals it — it never reaches the player', 'Reveals › F-mother-signed'],
  ]);
  assert.deepEqual(story(noMustKnow, { scale: 'S' }), []);
  const oneCarrier = mutate(VALID, ['- **Reveals**: F-rerouted-brine\n', '']);
  assert.deepEqual(story(oneCarrier, { scale: 'M' }).map(f => f.message),
    ['must-know, but only B-ward-ledgers reveals it — one carrier, players will miss it']);
  assert.deepEqual(story(mutate(VALID, ['- **Must-know**: hidden', '- **Must-know**: no'])).map(f => f.message),
    ['no beat reveals it — it never reaches the player']);
  assert.deepEqual(story(mutate(VALID, ['- **Must-know**: hidden', '- **Must-know**: maybe'])).map(f => f.message),
    ['Must-know is "maybe" — use yes, no or hidden', 'no beat reveals it — it never reaches the player']);
});

test('not-before: a beat reveals a fact earlier than its Not before', () => {
  const text = mutate(VALID, ['- **Not before**: B-ward-ledgers', '- **Not before**: B-pump-vote']);
  assert.deepEqual(story(text, { scale: 'S' }).map(f => [f.check, f.message, f.location.label]),
    [['not-before', 'reveals F-rerouted-brine, but F-rerouted-brine is Not before B-pump-vote, which comes later in the beat map',
      'Beat map › B-ward-ledgers']]);
});

test('cast-fields: required fields per scale', () => {
  assert.deepEqual(story(mutate(VALID, ['- **Want**: keep his crew paid through the flood.\n', '']), { scale: 'S' })
    .map(f => [f.check, f.message, f.location.label]),
  [['cast-fields', 'no Want — required from scale S', 'Cast › Gudrem Tusk']]);
  const noWeakness = mutate(VALID, ['- **Weakness**: psychological — he trusts paper more than people.\n', '']);
  assert.deepEqual(story(noWeakness, { scale: 'M' }).map(f => f.message), ['no Weakness — required from scale M']);
  assert.deepEqual(story(noWeakness, { scale: 'S' }), []);
  const noDoubt = mutate(VALID, ['- **Doubt**: whether the union ever deserved the blame.\n', '']);
  assert.deepEqual(story(noDoubt, { scale: 'L' }).map(f => f.message), ['no Lie (or Doubt) — required from scale L']);
  assert.deepEqual(story(noDoubt, { scale: 'M' }), []);
});

test('cast-fields: antagonists need their four fields from M', () => {
  const noCounter = mutate(VALID, ['- **Counter-argument**: "Close the sluices and four wards drown; leave them open and all eleven do."\n', '']);
  assert.deepEqual(story(noCounter, { scale: 'M' }).map(f => [f.message, f.location.label]),
    [['no Counter-argument — antagonists need it from scale M', 'Cast › Vasgun Ader']]);
  assert.deepEqual(story(noCounter, { scale: 'S' }), []);
  const villain = story(mutate(VALID, ['### Gudrem Tusk · pump-crew foreman', '### Gudrem Tusk · villain of the crew']));
  assert.deepEqual(villain.map(f => f.message), ['no Shared goal / method — antagonists need it from scale M',
    'no Exploits — antagonists need it from scale M', 'no Counter-argument — antagonists need it from scale M',
    'no Front — antagonists need it from scale M']);
  const front = story(mutate(VALID, ['- **Want**: keep his crew paid through the flood.', '- **Want**: keep his crew paid.\n- **Front**: the pumps stop (B-pump-vote).']));
  assert.equal(only(front, 'cast-fields').length, 3);
  assert.deepEqual(story(mutate(VALID, ['**Shared goal / method**', '**Shared goal**'])), []);
});

const HOLLIS = '### Hollis Brandt · clerk *(proposed)*\n\n- **Tier**: TIER\n- **Want**: a dry desk.\n\n## Places and factions';

test('cast-unused: a core character with no beat is a finding, a recurring one a note', () => {
  const add = tier => mutate(VALID, ['## Places and factions', HOLLIS.replace('TIER', tier)]);
  assert.deepEqual(story(add('core'), { scale: 'S' }).map(f => [f.check, f.note, f.message, f.location.label]),
    [['cast-unused', false, 'Hollis Brandt never appears in the Beat map — give them a beat, or lower their tier', 'Cast › Hollis Brandt']]);
  assert.deepEqual(only(story(add('recurring'), { scale: 'S' }), 'cast-unused').map(f => f.note), [true]);
  assert.deepEqual(story(add('functional'), { scale: 'S' }), []);
  assert.deepEqual(story(mutate(add('core'), ['- **Purpose**: breather.', '- **Purpose**: breather; Hollis counts the fittings.']),
    { scale: 'S' }), []);
});

test('name-collision: a note for names sharing a first letter or within two edits', () => {
  const letter = story(mutate(VALID, ['### Merdak Vol', '### Gerdak Vol']));
  assert.deepEqual(letter.map(f => [f.check, f.note, f.message]),
    [['name-collision', true, '"Gerdak" and "Gudrem" share a first letter — easy to mix up']]);
  assert.deepEqual(story(mutate(VALID, ['### Merdak Vol', '### Sobrek Vol'])).map(f => f.message),
    ['"Sobrek" and "Tobrek" are 1 edit apart — easy to mix up']);
  assert.deepEqual(story(mutate(VALID, ['### Merdak Vol', '### Vasgan Vol'])).map(f => f.message),
    ['"Vasgan" and "Vasgun" share a first letter and are 1 edit apart — easy to mix up']);
});

test('stance: a note when two stances share most of their content words', () => {
  const text = mutate(VALID, ['- **Stance**: no, but slowly — pump the lower wards by hand and send the bill upstairs.',
    '- **Stance**: no — a city that drowns its floor is already finished; she audits until the cost lands on the guild.']);
  assert.deepEqual(story(text).map(f => [f.check, f.note, f.message, f.location.label]),
    [['stance', true, "Stance shares 100% of its content words with Tobrek Sallum's — they answer the theme question the same way",
      'Cast › Gudrem Tusk']]);
});

test('promises: each needs "paid off at" from M, unless cut or acknowledged', () => {
  const text = mutate(VALID, [' — paid off at B-upper-market', '']);
  assert.deepEqual(story(text, { scale: 'M' }).map(f => [f.check, f.message, f.location.label]),
    [['promises', 'no "paid off at" — pay it off, or mark it acknowledged or cut', 'Promises › P-sluice-vote']]);
  assert.deepEqual(story(text, { scale: 'S' }), []);
  assert.deepEqual(story(mutate(VALID, [' — paid off at B-upper-market *(settled)*', ' *(cut)*'])), []);
});

test('peak: a front-loaded climax is a finding at every scale', () => {
  // The final beat's high goes first; otherwise the second swap would undo the first.
  const first = mutate(VALID, ['- **Peak**: high', '- **Peak**: low'], ['- **Peak**: low', '- **Peak**: high']);
  for (const scale of ['S', 'M', 'L']) {
    assert.deepEqual(story(first, { scale }).map(f => [f.check, f.message, f.location.label]),
      [['peak', 'the last Peak: high beat, B-first-assessment, is beat 1 of 5 — the climax is front-loaded', 'Beat map']], scale);
  }
  const third = mutate(VALID, ['- **Peak**: high', '- **Peak**: low'], ['- **Purpose**: story beat.', '- **Peak**: high\n- **Purpose**: story beat.']);
  assert.match(only(story(third), 'peak')[0].message, /B-pump-vote, is beat 3 of 5/);
  const fourth = mutate(VALID, ['- **Purpose**: breather.', '- **Peak**: high\n- **Purpose**: breather.']);
  assert.deepEqual(story(fourth), []);
});

test('peak: a note from M when no beat marks Peak: high', () => {
  const text = mutate(VALID, ['- **Peak**: high', '- **Peak**: low']);
  assert.deepEqual(story(text, { scale: 'M' }).map(f => [f.check, f.note]), [['peak', true]]);
  assert.deepEqual(story(text, { scale: 'S' }), []);
});

test('theme-midpoint: a note from M when no first-half beat has a Theme', () => {
  const text = mutate(VALID,
    ['- **Theme**: states — the first sum the player balances has a family on the other side.\n', ''],
    ['- **Theme**: echoes — the same debt, priced twice.\n', ''],
    ['- **Theme**: counterpoints — Vasgun\'s sum is correct and still wrong.\n', '- **Theme**: —\n']);
  assert.deepEqual(story(text, { scale: 'M' }).map(f => [f.check, f.note, f.message]),
    [['theme-midpoint', true, 'no beat in the first half of the beat map has a Theme — the theme first appears after the midpoint, and most players never finish']]);
  assert.deepEqual(story(text, { scale: 'S' }), []);
});

// ---------------------------------------------------------------------------
// Premises

test('parsePremises splits blocks by ### heading', () => {
  const premises = parsePremises('### A · Salt ferry\nA ferry.\n\n### B\nA pump.\n');
  assert.deepEqual(premises.map(p => [p.id, p.heading, p.text, p.line]), [['A', 'Salt ferry', 'A ferry.', 1], ['B', '', 'A pump.', 4]]);
  assert.equal(parsePremises('### A\r\nOne.\r\n### B\r\nTwo.\r\n')[1].text, 'Two.');
});

test('parsePremises rejects stray text, no blocks, empty blocks and malformed headings', () => {
  assert.throws(() => parsePremises('Just a line.'), UsageError);
  assert.throws(() => parsePremises('stray\n### A\nOne.'), /text before the first ### heading \(line 1\)/);
  assert.throws(() => parsePremises('### A\nOne.\n### B\n\n'), /premise B \(line 3\) has no text/);
  for (const bad of ['###B\nTwo.', '#### B\nTwo.', '### \nTwo.']) {
    assert.throws(() => parsePremises(`### A\nOne.\n${bad}\n`), UsageError, bad);
  }
});

const premises = text => checkPremises(parsePremises(text));

test('premises that differ pass', () => {
  assert.deepEqual(premises('### A · ferry\nA salt-ferry pilot owes the pump guild her boat.\n\n' +
    '### B · audit\nAn assessor must sign the flood order that drowns his own ward.\n'), []);
});

test('too-alike: premises opening alike, or sharing most content words', () => {
  const opening = premises('### A\nA ferry pilot owes the guild.\n### B\nA ferry pilot steals a pump.\n');
  assert.deepEqual(opening.map(f => [f.check, f.message, f.location.label]),
    [['too-alike', 'A and B both open "a ferry pilot" — one idea twice', 'Across premises']]);
  const overlap = premises('### A\nThe guild drowns the lower wards to keep the market dry.\n' +
    '### B\nTo keep the market dry, the guild drowns lower wards.\n');
  assert.match(overlap[0].message, /^A and B share \d+% of their content words — one idea twice$/);
});

test('premise-count: fewer than two premises is a finding', () => {
  assert.deepEqual(premises('### A\nA ferry pilot owes the guild.\n').map(f => [f.check, f.message]),
    [['premise-count', 'only 1 premise — draft at least 2 that differ, so there is a choice']]);
});

test('scan checks run on each premise block on its own', () => {
  const findings = premises('### A · keeper\nA baker in a seaside hamlet, and Elara. <!-- Mara -->\n\n' +
    '### B · glow\nA secret lantern under the salt flats.\n');
  assert.deepEqual(findings.map(f => [f.check, f.location.label]), [['default-name', 'A · keeper']]);
});

test('--premises runs the premise checks through main', async () => {
  const different = fixture('### A · ferry\nA salt-ferry pilot owes the pump guild her boat.\n\n' +
    '### B · audit\nAn assessor must sign the flood order that drowns his own ward.\n');
  const run = await capture([different, '--premises']);
  assert.equal(run.code, 0);
  assert.match(run.out, /2 premises\n\nA · ferry \(line 1\)  clean\nB · audit \(line 4\)  clean\n\n0 findings, 0 notes\.$/);
  const banned = await capture([different, '--premises', '--ban', 'ferry']);
  assert.equal(banned.code, 1);
  assert.match(banned.out, /\[banned\] "ferry"/);
  assert.equal(await quiet(() => main([fixture('No heading.\n'), '--premises'])), 2);
});
