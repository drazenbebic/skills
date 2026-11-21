# game-story — design

Status: scope approved in conversation (2026-11-20); this spec records the design as built.

## Purpose

A skill an agent uses to create a game's story from an idea, to extract and audit the story of an
existing game, and to revise or rewrite it — keeping the result in the project's story bible,
`STORY.md`, which `game-dialogue` reads as canon. Together the two skills should produce a game whose
story and lines don't read as generic or AI-written.

Test beds: **Fuseborn** (`~/RustroverProjects/fuseborn`) — a monster-raising dungeon crawler whose
story lives in a design spec section and a scene generator, with a `VOICES.md` already; and **Ponor**
(`~/RustroverProjects/ponor`) — a folk-horror ARPG whose `docs/PLOT.md` is a bible in all but name.
Both calibrate the defaults; neither is hard-coded.

## What the research established (`.agents/research/game-story.md`)

- A game story stops feeling generic when its beats are joined by cause and each turns a value; its
  theme rides the player's verbs (most players never reach the ending); its particulars trace to the
  owner, an observed procedure or named research; and it lives in a status-marked canon file whose
  beats carry IDs and world state.
- Language models get exactly these wrong by default — early climaxes, tension resolved at once,
  friendly casts, festival endings, the same names and settings across vendors — and model judges miss
  it. The countermeasures with evidence change the process (turning points in the outline, a reference
  beat structure, varied inputs, post-generation scans, blind checklist audits), not the wording.
- For existing games: extract the as-built story first, diagnose unit by unit, prefer additive
  revision; the documented late tear-downs (Destiny, Anthem) shipped incoherent stories.
- Pacing numbers, cast sizes and reactivity budgets have no public standard: parameters, not rules.

Ten research notes and three fact-check passes; the report applies the corrections.

## Decisions

| Question | Decision |
|---|---|
| Name | `game-story` (0003's `game-<discipline>`). Not `game-bible` — "bible" names the output's format and collides with art, audio and monster bibles. Not `game-narrative` — narrative design is quest territory |
| Scope | Premise, cast (who characters are), antagonist, world, tone, beat map, reveals, revision. Lines → `game-dialogue`; quest mechanics → the next skill, `game-quests` (ADR 0004) |
| Output | `STORY.md` beside the project's narrative docs; an existing story doc is the bible instead |
| Canon control | Statuses settled / as-built / proposed / open / cut; the agent records, the owner decides |
| Units | Beats as world-state changes with Needs/Sets in the project's flags; IDs `B-`, `F-`, `P-`, `Q-` |
| Delivery | Options that differ in kind (premises, fixes); the owner approves the outline before STORY.md is written |
| Defaults | A dependency-free Node checker scans for AI-story defaults and structural holes after generation; prompts aim at positive targets |
| Structure | One skill: workflow `SKILL.md`, ten references loaded on demand, `scripts/check.mjs` |

## Workflow

Modes: **create** (idea → premises → canon → beat map), **extract** (as-built story → bible),
**audit** (critique only), **revise** (fix, extend or rewrite). Ten steps: read the project; extract
the as-built story; intake; premises; build canon; break the beat map; diagnose; check; present; write
it in. Each mode runs a subset (`SKILL.md` → *Modes*).

## Files

```
skills/game-story/
├── SKILL.md
├── references/
│   ├── intake.md        reading a project; the owner interview; generic answers
│   ├── premises.md      generators, the cut, tests, presenting options, breaking the story
│   ├── craft.md         cause, value turns, stakes, setups, theme, order of telling, arc shapes
│   ├── game.md          contracts, delivery modes, channels, protagonist type, choices, pacing
│   ├── genres.md        story load; roguelites; creature collectors; horror and folk horror
│   ├── cast.md          character core, arcs, ensembles, stance grid, antagonists and fronts
│   ├── world.md         rules with costs, factions, history as pressure, places
│   ├── particulars.md   tone, sources of particulars, real cultures, names, inspiration, pillars
│   ├── bible.md         STORY.md format, statuses, IDs, scale, canon control, consumers
│   ├── revision.md      extraction, diagnosis, revise vs rewrite, coverage, impact, playtests
│   └── review.md        the checker, reading tests, the default probe, model failures
└── scripts/
    ├── check.mjs
    └── check.test.mjs
```

References cite sources by short name; full sources stay in the research report (0003).

## The checker

`node scripts/check.mjs <STORY.md> [--scale S|M|L] [--ban a,b] [--allow a,b] [--scan-only]`, or
`<premises file> --premises`. House rules from a `check` block in STORY.md (`scale`, `allow`, `ban`,
`external`). Scan checks on any file (default names and settings, the model-default template, stock
plot moves, soft villains, festival resolutions, stated lessons); structure checks on the bible format
(sections per scale, statuses, IDs and references, beat fields, flags needed but never set, reveal
carriers, cast fields, promises, peak position). Exit 0 / 1 / 2. Tests with `node --test`.

## Changes to game-dialogue

- Reads `STORY.md` as canon (`settled` and `as-built` only); takes speaker and player knowledge from its
  reveals; sends story changes back to the bible.
- Voice profiles cite the bible for want, need, Lie and wound; reveal limits point to it.
- Its description routes story requests to `game-story`.

## Testing

Each scenario runs without the skill and with it, in parallel; a grader sees both blind and scores a
rubric (`.agents/evals/game-story/scenarios.md`). Scenarios: a story from a new game idea; Fuseborn
extract and audit; a deliberately generic story to audit.

## Out of scope

- Writing lines (`game-dialogue`), quest and mission design (`game-quests`, next), UI text.
- Runtime story generation in a shipped game.
- Parsing engine formats in the checker: it reads STORY.md or a drafts file only.
