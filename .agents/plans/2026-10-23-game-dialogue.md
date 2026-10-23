# game-dialogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `skills/game-dialogue` — a workflow skill, seven on-demand references and a dependency-free checker — that writes, revises and reviews any in-world voiced text for a game, plus the repo changes that publish it.

**Architecture:** `SKILL.md` carries the seven-step workflow and routes to `references/*.md` by line type; `scripts/check.mjs` mechanically flags suspects in a plain-text drafts file using house rules read from the game's voices file. The skill's knowledge comes from the research report, copied into `.agents/research/` as evidence and never linked from the skill. Baselines run before the skill is written; with-skill runs and grading close the loop.

**Tech Stack:** Markdown (Agent Skills standard frontmatter), Node ≥ 22 ESM with no dependencies, `node:test`.

**Spec:** `.agents/specs/2026-10-23-game-dialogue-design.md`

## Global Constraints

- Everything the skill needs lives in `skills/game-dialogue/`; no link or path in it points outside that folder (it is installed from skills.sh, which copies only the skill's folder).
- Scripts: Node ≥ 22, ESM `.mjs`, no `package.json`, no dependencies (ADR 0001); style as `skills/*/scripts/*.mjs` — a header comment with usage, single quotes, two-space indent, semicolons.
- Spelling "dialogue", never "dialog", in names and prose.
- The project's house rules beat the skill's defaults; the skill never calls its own output finished, authentic or canon.
- Prose rules from `AGENTS.md`-style writing in this repo's skills: plain, direct, second person to the agent, no history.
- The original Ponor repo (`~/RustRoverProjects/ponor`) is read-only for this work; tests run on a copy.
- Commit on `feat/game-dialogue`, never `main`; never push.

## Review Focus

1. A drafts file with no `###` heading, or with text before the first heading → exit 2 with a message, never a "clean" report (Task 1).
2. Typographic apostrophes and quotes (`’ “ ”`) → matched exactly like straight ones, so `I’m so afraid` is flagged (Task 2).
3. Non-ASCII words (Croatian `Aždaja`, `zduhać`) in `ban`/`allow` and in text → whole-word matching works; `\b` is not used (Tasks 1–2).
4. Windows line endings in drafts and rules files → parsed identically to `\n` (Task 1).
5. `--rules` pointing at a file with no `check` block → exit 2 naming the file, never silently default rules (Task 1).

---

## File Structure

| Path | Responsibility |
|---|---|
| `skills/game-dialogue/scripts/check.mjs` | Parse drafts and rules, run checks, print the report, exit code |
| `skills/game-dialogue/scripts/check.test.mjs` | Unit tests for every export and the CLI |
| `skills/game-dialogue/SKILL.md` | Frontmatter, workflow, modes, router, standing rules |
| `skills/game-dialogue/references/craft.md` | Line and scene craft |
| `skills/game-dialogue/references/voices.md` | Intake, profile template, voices-file format |
| `skills/game-dialogue/references/line-types.md` | Per-type rules |
| `skills/game-dialogue/references/interactive.md` | Branching, choices, state, pools, interruption |
| `skills/game-dialogue/references/player-character.md` | PC models and address |
| `skills/game-dialogue/references/production.md` | VO, on-screen text, localization, formats |
| `skills/game-dialogue/references/review.md` | Anti-patterns, AI failure modes, checklist |
| `.agents/research/game-dialogue.md` | The research report (evidence) |
| `.agents/adr/0003-game-skills.md` | Naming and conventions for game skills |
| `.agents/evals/game-dialogue/scenarios.md` | The five eval scenarios, prompts and rubrics |
| `README.md`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` | Publishing |

---

### Task 1: Checker core — parsing, rules, CLI, length and bans

**Files:**
- Create: `skills/game-dialogue/scripts/check.mjs`
- Test: `skills/game-dialogue/scripts/check.test.mjs`

**Interfaces:**
- Produces (all exported from `check.mjs`):
  - `parseDrafts(text: string) -> Take[]`, `Take = { id: string, heading: string, text: string, line: number }` — `id` is the first whitespace-delimited token after `###`, `heading` the rest trimmed (a leading `·` stripped), `text` the body trimmed, `line` the heading's 1-based line. Throws `UsageError` when there is no heading or non-blank text precedes the first one. Normalises `\r\n` to `\n`.
  - `parseRules(markdown: string, source: string) -> Rules`, `Rules = { ban: string[], allow: string[], words: {min: number, max: number} | null, maxChars: number | null, address: 'any' | 'neutral' }` — reads the first fenced block whose info string is `check`; keys `ban`, `allow` (comma lists), `words` (`min-max`), `max-chars`, `address`; `#` starts a comment. Throws `UsageError` naming `source` when no block exists, on an unknown key, or a malformed value.
  - `DEFAULT_RULES: Rules` = `{ ban: [], allow: [], words: null, maxChars: null, address: 'any' }`.
  - `parseCli(argv: string[]) -> { drafts: string, rulesPath: string | null, flags: Partial<Rules> }` — flags `--rules`, `--words`, `--max-chars`, `--ban`, `--allow`, `--address`; both `--x v` and `--x=v`. Throws `UsageError` on a missing drafts path or unknown flag.
  - `mergeRules(base: Rules, flags: Partial<Rules>) -> Rules` — scalars replace; `ban` and `allow` extend.
  - `countWords(text: string) -> number` — strips `*` and `_`, splits on whitespace and `—`/`–`, counts tokens holding a letter or digit; a `{placeholder}` counts as one word.
  - `findPhrase(text: string, phrase: string) -> number[]` — indices of whole-word, case-insensitive matches; boundaries are `(?<![\p{L}\p{N}])` / `(?![\p{L}\p{N}])` with flags `giu`; `’` and `‘` are matched as `'`.
  - `checkTake(take: Take, rules: Rules) -> Finding[]`, `Finding = { takes: string[], check: string, message: string, excerpt: string, note: boolean }`.
  - `formatReport(takes: Take[], findings: Finding[], rulesLabel: string) -> string`.
  - `main(argv: string[]) -> Promise<number>` — the exit code; CLI entry runs only when the file is executed directly (`import.meta.url === pathToFileURL(process.argv[1]).href`).
  - `class UsageError extends Error`.

- [ ] **Step 1: Write the failing tests** in `check.test.mjs` with `node:test` and `node:assert/strict`:

```js
test('parseDrafts splits takes by ### heading', () => {
  const takes = parseDrafts('### A · Radomir → player\nThat is his shield.\n\n### B\nNo body.\n');
  assert.deepEqual(takes.map(t => [t.id, t.heading, t.text, t.line]),
    [['A', 'Radomir → player', 'That is his shield.', 1], ['B', '', 'No body.', 4]]);
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
  const md = 'x\n```check\nban: floor, floors, Borna\nwords: 80-120  # Diablo 2 length\naddress: any\n```\n';
  assert.deepEqual(parseRules(md, 'VOICES.md'),
    { ban: ['floor', 'floors', 'Borna'], allow: [], words: { min: 80, max: 120 }, maxChars: null, address: 'any' });
});
test('parseRules accepts CRLF', () => {
  assert.deepEqual(parseRules('```check\r\nban: floor\r\n```\r\n', 'v').ban, ['floor']);
});
test('parseRules without a check block names the file', () => {
  assert.throws(() => parseRules('# Voices\n', 'docs/VOICES.md'), /docs\/VOICES\.md/);
});
test('parseRules rejects an unknown key', () => {
  assert.throws(() => parseRules('```check\nbanned: x\n```', 'v'), UsageError);
});
test('mergeRules: scalars replace, lists extend', () => {
  const r = mergeRules({ ...DEFAULT_RULES, ban: ['floor'], words: { min: 80, max: 120 } },
    { ban: ['Borna'], words: { min: 10, max: 20 } });
  assert.deepEqual([r.ban, r.words], [['floor', 'Borna'], { min: 10, max: 20 }]);
});
test('countWords ignores markup and dashes, counts a placeholder as one', () => {
  assert.equal(countWords('Welcome to *Kamenica*, stranger — such as it is. {class}'), 9);
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
  assert.equal(await main([]), 2);
  assert.equal(await main([fixture('### A\nThat is his shield.\n')]), 0);
  assert.equal(await main([fixture('### A\nThat is his shield.\n'), '--rules', fixture('# no block\n')]), 2);
});
test('main exits 1 when a take has findings', async () => {
  assert.equal(await main([fixture('### A\nThe floor is wet.\n'), '--ban', 'floor']), 1);
});
```

`fixture(text)` is a test helper writing `text` to a fresh file under `os.tmpdir()` and returning its path.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test skills/game-dialogue/scripts/`
Expected: FAIL — `check.mjs` does not exist.

- [ ] **Step 3: Implement the Task 1 exports in `check.mjs`.** `formatReport` prints a header (`N takes · rules: <label>`), then each take with findings as `<id>  <heading>  (<words> words)` followed by one indented row per finding (`<check>  <message> — "<excerpt>"`), then an `Across takes` group for findings with several `takes`, then a summary line (`X takes with findings, Y clean`). Excerpts are the match with up to 30 characters each side, `…` where cut. `main` prints usage errors to stderr and returns 2; returns 1 if any finding has `note: false`, else 0. Notes never change the exit code.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test skills/game-dialogue/scripts/`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add skills/game-dialogue/scripts/
git commit -m "feat(game-dialogue): the checker's drafts, rules, length and bans"
```

---

### Task 2: Checker — language checks

**Files:**
- Modify: `skills/game-dialogue/scripts/check.mjs`
- Test: `skills/game-dialogue/scripts/check.test.mjs`

**Interfaces:**
- Consumes: `findPhrase`, `checkTake`, `Rules`, `Finding` from Task 1.
- Produces: exported constants `STOCK_PHRASES: string[]`, `DEFAULT_NAMES: string[]`, `THERAPY_PHRASES: string[]`, `GENDERED_ADDRESS: string[]`, `EMOTION_WORDS: string[]`; `checkTake` gains the checks `stock-phrase`, `default-name`, `named-emotion`, `therapy-speak`, `gendered-address`. Any phrase or name in `rules.allow` is skipped by every check.

The lists (exact copy):

- `STOCK_PHRASES`: `a testament to`, `testament to`, `tapestry`, `barely above a whisper`, `the weight of`, `can't help but`, `cannot help but`, `a mix of`, `a mixture of`, `shivers down`, `sends shivers`, `little did`, `in the grand scheme`, `palpable`, `delve`, `a beacon of`, `a stark reminder`, `every fiber of my being`, `the silence stretched`, `a dance of`. When `testament to` and `a testament to` overlap, report one finding.
- The "not X, it's Y" construction, as a regex (case-insensitive, `’` normalised): `/\b(?:it|this|that)(?:'s not|\s+is not|\s+isn't|\s+wasn't|\s+was not)\s+[^.!?]{1,40}?[,;—–]\s*(?:it|this|that)(?:'s|\s+is|\s+was)\b/i`, reported as `stock-phrase`.
- `DEFAULT_NAMES` (case-sensitive, whole word): `Elara`, `Elias`, `Mara`, `Lyra`, `Kael`, `Thorne`, `Seraphina`, `Aldric`, `Eldrin`, `Silas`, `Zephyr`.
- `named-emotion`: `I feel`, `makes me feel`, `made me feel`, and `I'm|I am|I was` + optional `so|very|really|truly` + one of `EMOTION_WORDS`: `angry`, `sad`, `afraid`, `scared`, `frightened`, `terrified`, `furious`, `happy`, `hurt`, `ashamed`, `guilty`, `jealous`, `lonely`, `anxious`, `worried`, `devastated`, `heartbroken`, `grateful`, `relieved`, `disappointed`, `proud`, `overwhelmed`.
- `THERAPY_PHRASES`: `I hear you`, `it's okay to`, `it's ok to`, `that's valid`, `your feelings are`, `closure`, `I'm here for you`, `you're not alone`, `how you feel`, `safe space`, `be gentle with yourself`, `you deserve to`, `process this`, `healing`.
- `GENDERED_ADDRESS` (only when `rules.address === 'neutral'`): `sir`, `madam`, `ma'am`, `lad`, `lass`, `laddie`, `lassie`, `my lord`, `my lady`, `milord`, `milady`, `mister`, `missus`, `young man`, `young lady`, `good man`, `good woman`.

- [ ] **Step 1: Write the failing tests**

```js
const take = text => ({ id: 'A', heading: '', text, line: 1 });
const checks = (text, rules = DEFAULT_RULES) => checkTake(take(text), rules).map(f => f.check);

test('stock phrases are flagged once per passage', () => {
  assert.deepEqual(checks('Your return is a testament to the old ways.'), ['stock-phrase']);
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
test('a Ponor settled line passes clean', () => {
  assert.deepEqual(checks("That's his shield. I'd know it anywhere — I watched Tvrtko rivet the boss. " +
    "Don't look at me like that. You weren't here. You didn't hear it.",
    { ...DEFAULT_RULES, ban: ['floor', 'floors', 'Borna'] }), []);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test skills/game-dialogue/scripts/`
Expected: the new tests FAIL; Task 1's still pass.

- [ ] **Step 3: Add the lists and the five checks to `checkTake`**, each finding with a message naming what matched (`stock phrase "a testament to"`, `names a feeling: "I'm so afraid"`).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test skills/game-dialogue/scripts/`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add skills/game-dialogue/scripts/
git commit -m "feat(game-dialogue): the checker's stock phrasing, names, feelings and address"
```

---

### Task 3: Checker — across takes

**Files:**
- Modify: `skills/game-dialogue/scripts/check.mjs`
- Test: `skills/game-dialogue/scripts/check.test.mjs`

**Interfaces:**
- Consumes: `Take`, `Finding`, `countWords` from Task 1.
- Produces: `checkTakes(takes: Take[]) -> Finding[]` (exported; `main` calls it after `checkTake` for each take); `checkTake` gains `flat-rhythm`.
  - `placeholders`: placeholders match `/\{\$?[A-Za-z_][\w.]*\}/g`; one finding with every take's id when the takes do not all share the same set, its message listing each take's set.
  - `too-alike`: per pair, when their first three words (lower-cased, punctuation and markup stripped) are equal, or the Jaccard index of their distinct lower-cased words exceeds `0.6` — one finding per pair, whichever fired.
  - `flat-rhythm` (`note: true`): sentences split after `.`, `!`, `?`, `…` followed by whitespace or end; with 4 or more sentences, flagged when the population standard deviation of their word counts is below `2.5`.

- [ ] **Step 1: Write the failing tests**

```js
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
test('flat rhythm is a note and does not fail the run', async () => {
  const [f] = checkTake(t('A', 'I went home. I ate some bread. I fed the cat. I went to bed.'), DEFAULT_RULES);
  assert.deepEqual([f.check, f.note], ['flat-rhythm', true]);
  assert.equal(await main([fixture('### A\nI went home. I ate some bread. I fed the cat. I went to bed.\n')]), 0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test skills/game-dialogue/scripts/`
Expected: the new tests FAIL.

- [ ] **Step 3: Implement `checkTakes` and `flat-rhythm`; wire `checkTakes` into `main`.**

- [ ] **Step 4: Run the tests and a smoke run**

Run: `node --test skills/game-dialogue/scripts/`
Expected: all pass.
Run: `printf '### A · test\nI feel it is a testament to the floor.\n' > /tmp/gd.txt && node skills/game-dialogue/scripts/check.mjs /tmp/gd.txt --ban floor; echo "exit $?"`
Expected: findings `named-emotion`, `stock-phrase`, `banned`; `exit 1`.

- [ ] **Step 5: Commit**

```bash
git add skills/game-dialogue/scripts/
git commit -m "feat(game-dialogue): the checker's placeholders, alike takes and rhythm"
```

---

### Task 4: Evidence, decision record and baselines

**Files:**
- Create: `.agents/research/game-dialogue.md` — the research report, copied verbatim from the session scratchpad (`…/scratchpad/reports/Game dialogue writing craft.md`), with a two-line header: what it is and that the skill's references are condensed from it.
- Create: `.agents/adr/0003-game-skills.md` — in ADR 0001/0002's format (`# 0003 — Game skills`, `Status: accepted`, Context, Decision, Why, Consequences): skills about making games are named `game-<discipline>` (`game-dialogue` first; later e.g. `game-narrative-design`, `game-ui-text`); "dialogue", not "dialog" (a UI dialog box); a game skill reads the project's canon first and the project's rules beat its defaults; its working files (the voices file) live in the game's repo, never in the skill; its evidence lives in `.agents/research/`, unlinked from the shipped skill.
- Create: `.agents/evals/game-dialogue/scenarios.md` — the five scenarios below: prompt, fixture, and rubric each.

**Interfaces:**
- Produces: the Ponor fixture at `<scratchpad>/evals/ponor/` and five baseline outputs at `<scratchpad>/evals/baseline/<n>.md`, consumed by Task 9.

The scenarios (each prompt ends: *You cannot ask the user questions: where you would ask, write the question and the assumption you made, then continue. Write files only under `<out dir>`.*):

1. **Ponor hidden line.** Fixture: copy `docs/`, `content/`, `AGENTS.md`, `CONTEXT.md`, `README.md` of `~/RustRoverProjects/ponor` to `<scratchpad>/evals/ponor/`; remove Biljana's *After the Navje* line from the fixture's `docs/PLOT.md` and every copy of its distinctive sentences elsewhere in the fixture (find them with `grep -rn` on two of its phrases; confirm zero hits after). Prompt: "In the Ponor project at `<fixture>`, write Biljana's village line for the stage after the Navje." Rubric: no "floor"/"Borna"; 80–120 words; consistent with her canon (§5, her other lines); subtext over statement; read existing lines first; matches the catalog format (`*marked*` phrases).
2. **Ponor new content.** Same fixture, nothing removed. Prompt: "Write Tvrtko's quest ask for his boy (M4.3b in docs/ROADMAP.md / PLOT.md)." Rubric: canon-consistent; no silent new canon (new facts listed for approval); voice; format; a profile built or stated first.
3. **Barks.** Prompt: "A stealth game: write the guard bark pool for four triggers — heard a noise, saw something, lost the target, found a body — as a TSV with ID, trigger, line." Rubric: one fact per bark; frequent triggers blander; 5+ variants per trigger; stable IDs; honest to the guard's knowledge; no stock phrasing.
4. **Branching in Yarn Spinner.** Prompt: "A cozy farming game in Yarn Spinner 3. The player-created character (any name, any gender) meets Wren, a grumpy beekeeper who lost her hives to a frost, for the first time. Write the first conversation with one choice that matters later." Rubric: neutral address; three options as three different moves; option text predicts the line; a flag set and named; `#line:` IDs; `[select]` for any gendered word; no concatenation; valid Yarn 3 syntax.
5. **Review.** Fixture: `<scratchpad>/evals/flawed-scene.md`, written in this task: a 10-line scene in which a widow tells the hero about her dead husband, containing an "As you know" exposition dump, two named emotions, a quip undercutting her grief, and a choice labelled "Comfort her" whose line mocks her. Prompt: "Review this scene." Rubric: all four planted problems found; each with a suggested rewrite; the file unchanged.

- [ ] **Step 1: Write the three files** above.
- [ ] **Step 2: Build the fixtures** (Ponor copy with the line removed; the flawed scene). Verify: `grep -rn "<phrase 1>\|<phrase 2>" <scratchpad>/evals/ponor` prints nothing.
- [ ] **Step 3: Launch the five baseline agents in parallel** (no skill), each writing its final answer to `<scratchpad>/evals/baseline/<n>.md`. They run in the background while Tasks 5–8 are written.
- [ ] **Step 4: Commit**

```bash
git add .agents/research/game-dialogue.md .agents/adr/0003-game-skills.md .agents/evals/game-dialogue/scenarios.md
git commit -m "docs: game-dialogue's research, ADR 0003 and its eval scenarios"
```

---

### Task 5: References — craft and voices

**Files:**
- Create: `skills/game-dialogue/references/craft.md`
- Create: `skills/game-dialogue/references/voices.md`

**Interfaces:**
- Consumes: `.agents/research/game-dialogue.md` (sections "Good lines do two jobs…", "Voice is engineered…", "Dialect…"); the checker's `check` block keys from Task 1.
- Produces: section anchors `SKILL.md` links to — craft.md: `## Want, tactic, status`, `## Subtext`, `## Exposition as ammunition`, `## Emotion unsaid`, `## Humour`, `## Length`, `## Scene shape`, `## Dialect and period speech`, `## Before and after`. voices.md: `## Before writing a character`, `## The profile`, `## Who they are talking to`, `## Building a profile from existing lines`, `## The voices file`.

Content each section must carry (rules, not essays; a source in parentheses per rule):
- craft.md: McKee's said/unsaid/unsayable and the line as a tactic; Mamet's three questions; Johnstone's status; Ingold's fix the subtext, vary the text; the subtext toolkit (terse talker, deflection into logistics, precise about the trivial, action for a reply, high status asking permission, answering the feeling not the question) and the forbidden "I feel X because Y"; exposition as ammunition, table dusting, "as you know", the character who doesn't know, optional lore; Adams' humour rules and the joke test (would this character, in this state, say it to this listener — tactic or wink?); the numbers (25 words a balloon, 2 × 38–42 characters a subtitle, ≈12–15 words a card, cut drafts to ½–⅓, 1–5-word choice text, ~3 options) with the rule that a project's length beats them; the beat template; dialect by syntax and diction, no phonetic spelling, no default "thee and thou", invented expletives; four before/after pairs, two from the report and two new ones.
- voices.md: the intake list (who, wants, needs, lie, wound, what the player should feel and how it moves, register, attitude, topics sought and avoided, quirks, never-says, under stress, who they risk sounding like, relationships, arc, sources in canon); the profile template as a fill-in block with each field marked *core* or *arc*; relationships as ordered pairs; deriving a profile from a character's existing lines (collect every line, mark recurring diction, sentence length, address, tactics, what they avoid; quote 5–10 lines as samples; never contradict them); the voices file format — title, a comment naming the canon doc, `## House rules` holding the ```` ```check ```` block (keys and meaning as Task 1's `parseRules`) and the prose rules that can't be checked, then `## <Name>` per character; where it lives (beside the narrative docs, `VOICES.md`) and that it is shown to the owner before it is written.

- [ ] **Step 1: Write both files.**
- [ ] **Step 2: Verify** headings exist and nothing links outside the skill: `grep -c '^## ' skills/game-dialogue/references/{craft,voices}.md` (9 and 5); `grep -rnE '\]\((\.\./|/|~)' skills/game-dialogue` prints nothing.
- [ ] **Step 3: Verify the voices format against the checker** — write a sample voices file with the documented `check` block to `/tmp/gd-voices.md` and run `node skills/game-dialogue/scripts/check.mjs /tmp/gd.txt --rules /tmp/gd-voices.md`; expected: no usage error.
- [ ] **Step 4: Commit**

```bash
git add skills/game-dialogue/references/craft.md skills/game-dialogue/references/voices.md
git commit -m "feat(game-dialogue): craft and voices references"
```

---

### Task 6: References — line types, interactive, player character

**Files:**
- Create: `skills/game-dialogue/references/line-types.md`
- Create: `skills/game-dialogue/references/interactive.md`
- Create: `skills/game-dialogue/references/player-character.md`

**Interfaces:**
- Consumes: the research report's sections "Structure decides…", "The player's own lines…", "Frequency, not content…".
- Produces: line-types.md opens with `## Before any line` (the five facts: trigger, frequency, speaker, what the player sees, interruptible) and has one `##` per type: `Barks`, `Ambient chatter`, `Companion banter`, `Quest-givers, objectives and journals`, `Hints and nags`, `Narrators, death and retry lines`, `Player-character self-talk`, `Notes, letters and carvings`, `Item and codex flavour`, `Boss and set-piece speeches`, `Vendors and greetings`, `Efforts`; each states trigger and frequency, form and length, the governing rule, the signature failure, and — where sourcing is thin — says so. interactive.md: `## Choosing a structure`, `## Three options, three moves`, `## Option text and the spoken line`, `## Consequences`, `## State`, `## Pools`, `## Interruption`, `## Outlining`. player-character.md: `## Which protagonist`, `## Option labels for a voiced protagonist`, `## The silent protagonist`, `## Addressing a player-made character`, `## Variants by gender, class or origin`.

Must-carry rules: one fact per bark; distinctiveness inverse to frequency; overgenerate (≈100 → 5–10); size pools so a line rarely recurs in a session (no published standard); barks may state the obvious; honest to what the AI knows. Ambient lines subtle, rumours point to real content. Banter as resumable 2–4-line beats with explicit triggers, critical info never in a cuttable beat. Quest: objective = imperative + target, under ~8 words, journal in voice, the ask stated once plainly. Hints: a ladder (silence → notice → name the mechanic → near-solution), each step gated on time *and* evidence of being stuck, capped, with a setting. Notes and carvings: a scene with a stake, order-independent. Item flavour: function first, one oblique fact, never what comes next. Choice rules: ~3 options as Accept / Reject / Deflect, no filler, the NPC may refuse or leave; label must predict intent and tone, the line adds no threat, lie, commitment or reveal the label didn't signal, no two options resolving to the same line unless state differs; silence as an option; a promised consequence has at least one later line; every foldback leaves a flag; pools: write the generic fallback first, add specificity in layers, each line order-independent or its dependency stated, each line writes a memory fact; interruption: 1–2-line beats with a resume rule, pickups, cut-off tails ending in a dash, critical info early. PC: the table of five models; neutral address defaults (second person, title, role, earned epithet, fixed callsign; never the typed name in voiced lines; no sir/madam/lad/lass outside an explicit variant); gendered variants as whole lines, never word swaps; per-class sentences added to a shared line (Ponor's `{class}` pattern) only where the class truly changes something.

- [ ] **Step 1: Write the three files.**
- [ ] **Step 2: Verify** with `grep -c '^## '` (13, 8, 5) and the outside-link grep from Task 5.
- [ ] **Step 3: Commit**

```bash
git add skills/game-dialogue/references/{line-types,interactive,player-character}.md
git commit -m "feat(game-dialogue): line types, interactive and player-character references"
```

---

### Task 7: References — production and review

**Files:**
- Create: `skills/game-dialogue/references/production.md`
- Create: `skills/game-dialogue/references/review.md`

**Interfaces:**
- Consumes: the report's "Production rules…", "The worst dialogue failures…", "Language models fail…" sections; the checker's check names from Tasks 1–3.
- Produces: production.md: `## Learn the project's format first`, `## Voice-over scripts`, `## On-screen text and subtitles`, `## Localization`, `## Writing other languages`, `## Ink`, `## Yarn Spinner`, `## Fountain and spreadsheets`. review.md: `## The checker`, `## Reading tests`, `## Anti-patterns`, `## Where models fail`, `## What only people can verify`.

Must-carry: production — learn a bespoke format from existing lines (keys, placeholders, markup, where text lives) before writing, and never invent a format a project already has; VO row columns (ID, speaker, addressee, clean cue text, context with the preceding line or event, verb direction, controlled emotion value, intensity, effect, notes) with no direction inside the cue; frozen IDs; the subtitle table (2 lines; 38/40/42 characters; ~1 s a line; 17–20 characters a second; speaker label at every change) and sense-based line breaks; a box budget is an input, never assumed; localization — the W3C expansion table, whole sentences with named placeholders, plural/select markup instead of `if count == 1`, speaker/addressee/gender on every line, puns annotated; other languages composed natively and always flagged for a native check; minimal valid Ink and Yarn Spinner 3 examples (from the report, with the `#id:` tag in Ink marked as a convention); review — how to run the checker (drafts file format, `--rules`, reading the report, notes vs findings, that a clean run proves nothing about quality); the reading tests (hide the names; Mamet's three questions; what did the player just do; frequency; cut the first and last sentence; label beside line; register against setting; the joke test; state preconditions); the anti-pattern table (each: documented case, check); the model failure modes → countermeasures (homogenised voice → profile and samples in context + names test; named feelings → subtext toolkit + checker; therapeutic softness and quick resolution → status and tactic, no apology without cost; soft villains → specify the method of harm — the lie, the leverage, the false concession; default names and settings → the project's naming rules + checker; generic self-editing → concrete tests and selection between takes, never polish one draft); what only people can verify (table reads, playtests at volume, native speakers, cultural consultants, AI disclosure under Steam's 2026 rules for shipped AI-drafted text).

- [ ] **Step 1: Write both files.**
- [ ] **Step 2: Verify** with `grep -c '^## '` (8 and 5), the outside-link grep, and that every check name `check.mjs` emits appears in review.md: `for c in length banned stock-phrase default-name named-emotion therapy-speak gendered-address placeholders too-alike flat-rhythm; do grep -q "$c" skills/game-dialogue/references/review.md || echo "missing $c"; done` prints nothing.
- [ ] **Step 3: Commit**

```bash
git add skills/game-dialogue/references/{production,review}.md
git commit -m "feat(game-dialogue): production and review references"
```

---

### Task 8: SKILL.md

**Files:**
- Create: `skills/game-dialogue/SKILL.md`

**Interfaces:**
- Consumes: every reference's `##` headings (Tasks 5–7); `check.mjs`'s CLI (Task 1).

Contents:
- Frontmatter: `name: game-dialogue`; `description:` — write, revise or review anything a game character says or writes inside the world (conversations, NPC lines, barks, companion banter, boss speeches, quest-giver text, notes, letters, carvings, item flavour text), and build the voice profiles that keep characters consistent; use whenever a game needs lines for a character, a dialogue tree or choices, a bark pool, or a critique of existing game dialogue, in any engine or format (Ink, Yarn Spinner, a string catalog, a spreadsheet) — even when the request is just "write what the smith says" or "make this NPC sound less flat"; not for UI, menu or tutorial text. `compatibility:` Node ≥ 22 for the bundled checker.
- `# Game dialogue`, then the central claim in two short paragraphs: a line is judged in its runtime context; models fail exactly where the craft is hardest, so the skill works from the project's canon and the character's own lines, drafts varied takes and selects with concrete tests.
- `## Ground rules` — project rules beat defaults; no character without a profile; varied takes, not one polished draft; never certify output as finished, authentic or canon; delivery is drafts first, files after approval ("just write it in" skips drafts); other languages composed natively and flagged.
- `## Modes` — write, revise, review, voice, and which steps each runs.
- `## Workflow` — the seven steps exactly as the spec's "The workflow", each naming the reference sections it opens; step 1 lists what to look for (canon/lore/story docs, glossary, style guide, existing lines and their files, the string format) and to record the house rules in the voices file's `check` block and prose rules; step 2 the brief's fields and the one-batched-question rule (only who, when, what-for block); step 5 the checker command — `node scripts/check.mjs <drafts> --rules <voices file>` relative to this skill's directory, drafts written to a scratch file in the `###` format — then the reading tests; step 6 the presentation shape (takes, recommendation and why, checker results, open items: proposed canon, native checks, playtest-only questions).
- `## Which reference` — a table: line type or task → reference section.
- Length 250–300 lines; no link outside the skill.

- [ ] **Step 1: Write SKILL.md.**
- [ ] **Step 2: Verify** every `references/<file>.md` link resolves and every linked `#anchor` matches a heading: `grep -oE 'references/[a-z-]+\.md' skills/game-dialogue/SKILL.md | sort -u | while read f; do test -f "skills/game-dialogue/$f" || echo "missing $f"; done` prints nothing; `wc -l skills/game-dialogue/SKILL.md` is 250–300; the outside-link grep prints nothing.
- [ ] **Step 3: Commit**

```bash
git add skills/game-dialogue/SKILL.md
git commit -m "feat(game-dialogue): the skill's workflow"
```

---

### Task 9: With-skill runs, grading, iteration

**Files:**
- Modify (as findings require): any file under `skills/game-dialogue/`
- Modify: `.agents/evals/game-dialogue/scenarios.md` (a results section: date, per-scenario verdict)

**Interfaces:**
- Consumes: Task 4's fixtures, prompts and baselines; the finished skill.

- [ ] **Step 1: Launch the five with-skill agents in parallel**, each told to read `skills/game-dialogue/SKILL.md` (absolute path) first and follow it, with the same prompts and constraints as the baselines, writing to `<scratchpad>/evals/skill/<n>.md`.
- [ ] **Step 2: Grade blind** — one grader agent per scenario receives the rubric and the two outputs labelled X and Y in random order, runs `check.mjs` over the drafted lines, scores each rubric item pass/fail with a quoted reason, and names the better output.
- [ ] **Step 3: Fix the skill** wherever the with-skill output fails a rubric item or does not beat the baseline; re-run only those scenarios. At most two iterations, then report what still fails.
- [ ] **Step 4: Record results** in `scenarios.md` and run `node --test skills/game-dialogue/scripts/` (all pass).
- [ ] **Step 5: Owner comparison** — show the owner scenario 1's three versions (theirs from the original `PLOT.md`, skill, baseline) unlabelled, in random order.
- [ ] **Step 6: Commit**

```bash
git add skills/game-dialogue .agents/evals/game-dialogue/scenarios.md
git commit -m "fix(game-dialogue): what the eval runs found"
```

---

### Task 10: Publishing

**Files:**
- Modify: `README.md` — a `### [`game-dialogue`](skills/game-dialogue)` section after `review-requests`, in the house style: what it is for; its central claim (a line lives in its runtime context, and models fail where the craft is hardest, so it reads the canon and the character's own lines, drafts varied takes and selects with concrete tests); that it keeps a voices file in the game's repo; the checker in a one-row table; requirements (Node ≥ 22); a pointer to ADR 0003. Add `--skill game-dialogue` nowhere else.
- Modify: `.claude-plugin/plugin.json` — `version` `0.4.0`; `skills` gains `./skills/game-dialogue`; keywords gain `game-dev`, `game-writing`, `dialogue`, `narrative-design`; description: "Agent skills for real engineering and game-development work: a Next.js App Router performance audit method with dependency-free Lighthouse and Chrome DevTools Protocol tooling, a GitHub review-queue workflow built on code-review, and a game-dialogue writing method with a mechanical checker."
- Modify: `.claude-plugin/marketplace.json` — the plugin's description to the same sentence without the tooling detail ("Agent skills for real engineering and game-development work: a Next.js App Router performance audit method, a GitHub review-queue workflow, and a game-dialogue writing method."); the same four keywords.

- [ ] **Step 1: Edit the three files.**
- [ ] **Step 2: Verify** both JSON files parse: `node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'));JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json'))"` exits 0; the frontmatter is well-formed: `node -e "const s=require('fs').readFileSync('skills/game-dialogue/SKILL.md','utf8');if(!/^---\nname: game-dialogue\ndescription: .+\ncompatibility: .+\n---/s.test(s))process.exit(1)"` exits 0.
- [ ] **Step 3: Commit**

```bash
git add README.md .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "docs: publish game-dialogue"
```
