# game-dialogue — design

Status: approved in conversation, awaiting review of this written spec.

## Purpose

A skill an agent uses whenever a game needs words that a character says or writes inside the world:
conversations, boss speeches, barks, quest asks, notes, letters, carvings, and flavour text written in
an in-world voice. UI and system text (tooltips, menus, tutorials not in a voice) is out of scope and
belongs to a later sibling skill.

Its first real project is **Ponor** (`~/RustRoverProjects/ponor`): a dark Balkan folk-horror ARPG in
Unity, text-only, a settled canon in `docs/PLOT.md`, 80–120-word village lines read in a typed box,
lines keyed in `content/dialogue.ron` with the words in `content/strings/en.ron`, `{class}`
placeholders and `*marked*` phrases, Croatian carvings in Glagolitic. The skill stays general: Ponor
is the test bed and calibrates defaults, never a hard-coded assumption.

It is published from this repo to skills.sh and installed from there, so everything it needs lives in
`skills/game-dialogue/`.

### What the research established (`.agents/research/game-dialogue.md`)

- The unit of game dialogue is the line **in its runtime context** — trigger, frequency, speaker,
  addressee, state, medium, language. The best-documented failures (Skyrim's arrow in the knee,
  Ragnarök's hint nagging, Fallout 4's paraphrase mismatch, Forspoken's register) were invisible on
  the page.
- Line craft is dialogue as action: a want, a tactic, a status move; subtext is the gap between what
  a character wants and what they say; exposition arrives as ammunition.
- Language models fail precisely there (expert-judged studies: no subtext, named emotions,
  homogenised voices and names, softened villains) and cannot judge their own writing reliably.
  What works is generating varied candidates and selecting against concrete, checkable tests, with
  the character's own material in context.
- Many popular numbers (variants per bark, words per node, hint timing) have no published standard;
  they are parameters, and a project's own decisions override them (Ponor's 80–120 words against the
  general 15–30).

## Decisions

| Question | Decision |
|---|---|
| Scope | Anything with an in-world voice; UI/system text excluded |
| Name | `game-dialogue`. Game skills are `game-<discipline>`; "dialogue", not "dialog" (a UI dialog box) |
| Voice profiles | Kept in the game's repo, in their own file beside its narrative docs (Ponor: `docs/VOICES.md`); canon stays the truth of the world, the profile is the writer's tool; shown to the owner before it is written |
| Delivery | Drafts first — 2–3 takes that differ in approach, a recommendation, what was checked, open items — then written into the project's own files after approval; "just write it in" skips the drafts |
| Checker | A dependency-free Node script (ADR 0001) the skill runs on every draft |
| Languages | Writes in whatever language the project writes that text in, composed natively, always flagged for a native speaker's check |
| Structure | One skill: a workflow `SKILL.md`, references loaded on demand, `scripts/check.mjs` |

## The workflow (`SKILL.md`)

Four modes, chosen from the request: **write** (new lines), **revise** (rework existing lines),
**review** (critique only), **voice** (build or update profiles).

1. **Read the project first.** Find the canon, glossary, style rules, existing lines and the text
   format; distil the project's **house rules** — binding constraints such as bans, lengths, address,
   markup and placeholders. House rules beat the skill's defaults.
2. **Brief each line**: speaker → listener; when it fires and how often; what the speaker wants; what
   the player knows at that moment; line type; medium and budget; state read and written. Ask only
   what cannot be found, in one batched question. Only who, when and what for block; the rest is
   assumed and stated.
3. **Load or build the voice.** Read the profile from the voices file; if missing, derive it from
   canon and the character's existing lines, show it, write it on approval. Never write a character
   without a profile.
4. **Draft 2–3 takes** that differ in tactic or approach, not wording, from want → tactic → status;
   exposition as ammunition; the line type's rules applied.
5. **Check.** Run `check.mjs`, then the reading tests: hide the names, what did the player just do,
   how often is this heard, cut the first and last sentence, a choice's text beside its spoken line.
   Fix and re-run.
6. **Present** the takes, the recommendation and why, what the checks found, and open items: new
   facts proposed as canon, text needing a native check, what only a playtest or table read can
   judge.
7. **Write in** after approval, in the project's files, keys, placeholders and markup; update the
   voices file if a voice moved.

**Review** runs steps 1, 3 and 5 on existing lines and returns findings with suggested rewrites,
changing nothing without approval. **Voice** runs steps 1 and 3.

Standing rules: the project's rules win; never write a character without a profile; never call its
own output finished, authentic or canon — it delivers drafts and names what a human must verify.

## Files

```
skills/game-dialogue/
├── SKILL.md
├── references/
│   ├── craft.md
│   ├── voices.md
│   ├── line-types.md
│   ├── interactive.md
│   ├── player-character.md
│   ├── production.md
│   └── review.md
└── scripts/
    ├── check.mjs
    └── check.test.mjs
```

- **`SKILL.md`** (~250–300 lines): the workflow and modes; how to find a project's canon and house
  rules; a router from line type to reference section; the voices file's location rule (beside the
  narrative docs, found by name, `VOICES.md`); the standing rules.
- **`references/craft.md`**: dialogue as action (want, tactic, status — McKee, Mamet, Johnstone);
  the subtext toolkit; exposition as ammunition; emotion unsaid; humour as a tactic, not a quip;
  brevity numbers; the scene template (enter on the want, leave on an open question); dialect and
  period speech carried by syntax and diction; before/after calibration examples.
- **`references/voices.md`**: a character intake list; the profile template (core, want/need/lie/
  wound, intended player feeling, register, attitude, topics sought and avoided, quirks and diction,
  never-says, under stress, roster contrast, sample lines, core vs. arc-variable fields);
  relationships as ordered pairs; deriving a profile from existing lines; the voices file's format,
  including its `check` block.
- **`references/line-types.md`**: barks, ambient chatter, companion banter, quest-giver and
  objective/journal text, hints and nags, narrator and death lines, PC self-talk, notes, letters and
  carvings, item flavour, boss speeches, vendor and greeting pools, efforts — each with trigger,
  frequency, form, governing rule and signature failure.
- **`references/interactive.md`**: branching patterns (Ashwell, storylets, salience pools); three
  options as three moves (Accept / Reject / Deflect); option text against its spoken line;
  consequences that pay off; state and reactivity; systemic pools (fallback first, specificity in
  layers); walk-and-talk and interruption; outlining before drafting.
- **`references/player-character.md`**: defined, semi-defined, player-authored, internal-chorus and
  silent protagonists; addressing a customisable PC; gender variants as whole lines; per-class or
  per-origin sentences.
- **`references/production.md`**: the VO script and direction; subtitle and box numbers; typed
  boxes; localization (expansion, no concatenation, plural/select markup, translator context, puns);
  writing other languages natively; format sketches for Ink, Yarn Spinner 3 and Fountain, and how
  to learn a bespoke format.
- **`references/review.md`**: the anti-pattern table with a check for each; LLM failure modes →
  countermeasures; the self-review checklist; what only humans can verify.

References cite their sources briefly so a rule can be traced, and link nothing outside the skill's
folder.

## The checker (`scripts/check.mjs`)

`node scripts/check.mjs <drafts> [--rules <voices file>] [--words min-max] [--max-chars n]
[--ban a,b] [--address any|neutral]`

**Input**: a plain-text drafts file, one block per take:

```
### A · Radomir → player, after the Navje
That's his shield. I'd know it anywhere…

### B · Radomir → player, after the Navje
…
```

The block's id is the first token after `###`; the rest of the heading is free text; the body runs to
the next heading.

**House rules** come from a fenced `check` block in the voices file, read with `--rules`; flags
override it:

````
```check
ban: floor, floors, Borna
words: 80-120
address: any
```
````

An optional `allow:` line lists names or phrases the built-in lists would flag but the canon uses (a
project whose hero really is called Mara).

**Checks** (each a suspect, quoted with its passage):

| Check | Flags |
|---|---|
| `length` | words outside `words`; characters over `max-chars` |
| `banned` | the project's `ban` list, whole words, case-insensitive |
| `stock-phrase` | a built-in list of LLM stock phrasing ("a testament to", "tapestry", "barely above a whisper", "the weight of", "can't help but", …) and the "it's not X, it's Y" construction |
| `default-name` | Elara, Elias, Mara, Lyra, Kael, Thorne and similar, unless `allow` lists them |
| `named-emotion` | "I feel…", "I'm so angry/afraid/ashamed…", "makes me feel" |
| `therapy-speak` | "I hear you", "it's okay to…", "closure", "I'm here for you" |
| `gendered-address` | sir, madam, lad, lass, my lord/lady — only with `address: neutral` |
| `placeholders` | takes in one file using different `{placeholder}` sets |
| `too-alike` | two takes opening with the same three words, or sharing more than 60% of their distinct words |
| `flat-rhythm` | four or more sentences of near-equal length (a note) |

Em dashes are not checked: Ponor uses them deliberately.

**Output**: a readable report grouped by take; exit 0 clean, 1 findings, 2 usage error. It never edits
the drafts. Node ≥ 22, no dependencies, no `package.json`; tests with `node --test`.

## Repo integration

- `README.md`: a `game-dialogue` section in the house style — purpose, central claim, the checker,
  and that it reads a project's canon before writing.
- `.claude-plugin/plugin.json`: `./skills/game-dialogue` in `skills`; game-writing keywords; a
  description that no longer says only "engineering"; version `0.4.0`.
- `.claude-plugin/marketplace.json`: the same description and keywords.
- `.agents/adr/0003-game-skills.md`: the `game-<discipline>` naming; "dialogue"; game skills read
  the project's canon first and its rules win; their working files (the voices file) live in the
  game's repo.
- `.agents/research/game-dialogue.md`: the full research report with sources — the evidence behind
  the references, not shipped with the skill.

## Testing

Each scenario runs without the skill (baseline) and with it, in parallel agents; a separate grader
scores both against a rubric and the checker's output. Where the skill does not beat the baseline,
the skill is fixed and the scenario re-run.

1. **Ponor, a hidden line** — in a copy of Ponor (never the original), remove a settled line (e.g.
   Biljana after the Navje) from `PLOT.md` and `en.ron`, and ask for it. Graded on canon (no
   "floor", no Borna), voice, length, subtext, and whether existing lines were read first. The owner
   then compares three unlabelled versions: theirs, the skill's, the baseline's.
2. **Ponor, new content** — Tvrtko's quest ask (M4.3b): a voice profile first, no silent new canon,
   takes in the catalog's format.
3. **Barks, another game** — a stealth game's guard pool as a spreadsheet: one fact per bark,
   blander lines on frequent triggers, enough variants, stable IDs.
4. **Branching in Yarn Spinner** — a cozy game with a player-created character: neutral address,
   three options as three moves, option text matching its line, line IDs and select markup, no
   concatenation.
5. **Review mode** — a deliberately flawed scene (exposition dump, named emotions, quips undercutting
   grief, a paraphrase mismatch): the problems found, nothing changed.

`check.mjs` has unit tests for every check, the rules block, the flags and the exit codes.

## Out of scope

- UI and system text, tutorials not in a voice, and naming systems (item, elite, place names).
- Story structure, quest design and lore authoring beyond what a line needs — a later
  `game-narrative-design`.
- Runtime generation of dialogue by an LLM in a shipped game.
- Parsing engine formats in the checker: it reads the drafts file only.
