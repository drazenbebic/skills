# The story bible: STORY.md

STORY.md is a **canon file**, not a synopsis. Every entry carries a status, every beat a stable ID and
the world state it needs and leaves, so other work can cite it: game-dialogue reads what each speaker
and the player know at each moment, quest design turns beats into missions, voice and localisation
take character facts from it, and an audit can diff it when gameplay changes. A synopsis serves none
of them.

## Where it lives

- **One file per project**, beside its narrative documents (where `VOICES.md`, lore or design docs
  live — usually `docs/`), named `STORY.md`. Look for it by name first.
- **A project that already keeps its story elsewhere** (a `PLOT.md`, a design doc's story section, a
  wiki export) has a bible already. Treat that document as the bible: follow its structure and status
  markers, add to it in its own style, and offer the STORY.md format as a migration only — never write
  a second canon file beside it.
- **Created or first written only after the owner approves** the outline shown in the reply (step 9
  of SKILL.md). Running unattended, write where you were told to.

## Canon control

Franchise canon teams separate recording from deciding (Blizzard's historians record; creative
leadership decides; Lucasfilm's Holocron tags every entry with a canon tier). In this file **the agent
is the recorder and the owner is the decider.**

**Statuses** — one per entry, at the end of its heading, from this legend:

| Status | Means | game-dialogue may rely on it |
|---|---|---|
| `settled` | The owner approved it | Yes |
| `as-built` | What the game does now, extracted, not yet reviewed by the owner | Yes, as current behaviour |
| `proposed` | Drafted, waiting for the owner | No — draft against it only when asked, and flag it |
| `open` | Undecided; options listed under Open questions | No |
| `cut` | Kept for reference, not canon | No |

- Anything you write that the owner has not explicitly approved is `proposed`. Promoting an entry to
  `settled` is the owner's call, in their words.
- **Each fact in one place.** Other sections cite it by ID instead of restating it.
- **Reconcile before you retcon.** When two sources disagree, look for an in-world explanation first
  (Lucasfilm explained differing Falcon interiors as Han's modifications). If none works, propose the
  retcon as an open question with what each answer touches.
- **Cut material is fenced, not deleted** — moved under its own `cut` heading or marked `cut`, the way
  the old Expanded Universe became *Legends* instead of vanishing.
- **Every change goes in the changelog** with the reason and the downstream files to revisit.

## IDs

| Kind | Form | Defined by |
|---|---|---|
| Beat | `B-<slug>` | a `###` heading under `## Beat map` |
| Fact (a truth the player can learn) | `F-<slug>` | a `###` heading under `## Reveals` |
| Promise (a setup or a choice the game signals as mattering) | `P-<slug>` | a `- **P-<slug>**` item under `## Promises` |
| Open question | `Q-<slug>` | a `- **Q-<slug>**` item under `## Open questions` |

Slugs are lowercase words joined by hyphens, named for what the thing is (`B-first-fusion`,
`F-quiet-mind-made-them`), never for its position — beats get reordered. Never renumber, reuse or
rename an ID once anything outside STORY.md cites it; retire it with `cut`. Flags and state in
`Needs` / `Sets` use **the project's own identifiers** (its flag names, mission IDs, trigger strings)
so a beat can be traced to the code.

## Scale

Pick the scale from the game's story load (`references/genres.md` → *Story load*), record it in the
`check` block, and leave out what the scale doesn't need. Bloat is measured by duplication, dead
entries and material nothing downstream uses — not by length.

| Scale | For | Sections required |
|---|---|---|
| `S` | Puzzle, arcade, casual, short games: premise and tone | One-sheet, Synopsis, Rules, Truth, Cast, Beat map, Open questions, Changelog |
| `M` | Most action, roguelite, platformer and indie games; creature collectors with a light plot | S + Key scenes, Reveals, Promises, Names |
| `L` | RPGs, games with factions, secrets, branching or stage-dependent NPCs | M + Places and factions, Sources |

`Tellings` is added at any scale when the story turns on a myth, a lie or a secret; `Sources` whenever
there is a named inspiration or a borrowed real culture.

## The template

Fields in `[brackets]` are required from that scale up; the rest are optional. Keep each field to a
line or two — a bible is consulted, not read.

````markdown
# Story — <game>

<!-- Maintained with the game-story skill. The owner decides canon; this file records it.
How characters sound: VOICES.md (game-dialogue) — name it here only once it exists. -->

Status legend: settled · as-built · proposed · open · cut

```check
scale: M                      # S | M | L
allow: <names or phrases the built-in lists flag but the canon really uses>
ban: <words the story never uses>
external: <flags set outside the beat map, e.g. by save migration or a tutorial>
```

## One-sheet *(settled)*

- **Logline**: <protagonist> must <goal> but <the irony or obstacle>, or <cost>.
- **Player fantasy**: what the player gets to be and do.
- **Core conflict**: who wants what against whom.
- **Protagonist**: want and need — or a flat arc, and who changes instead.
- **Antagonist**: one line; the shared goal and the opposed method.
- **World in a line**:
- **Why now**: what starts the story today rather than any other day.
- **Pillars**: 2–3 statements a scene could fail; which one the story owns.
- **Theme question**: a question with two defensible answers.
- **Controlling idea**: the answer the ending enacts, and why it wins. Nobody says it aloud.
- **Tone**: the dominant register · the loop it matches · the moments no joke may touch.
- **Contracts**: ludic — what the systems reward; narrative — what the story asks the hero to value;
  compatible, or the beat that confronts the gap.
- **Not for**: who this game is not made for.

## Synopsis *(settled)*

The story told plainly in two to four paragraphs — the version a newcomer reads first, and the one
the owner judges the story by. Concrete: names, places, what the player does, what it costs. Written
last, from the beat map, so it tells the story the beats actually hold. No theme statements.

## Rules

### World rules

- <rule> — limitation or cost: … — the decision it forces on someone: … — must the player understand
  it to solve something? yes / no *(settled)*

### Writing rules

- What the story never does; banned defaults; protected moments; reveal limits.

## Truth *(settled)*

What really happened, earliest first, including the antagonist's offscreen moves. The player may
never learn all of it; writers must know it.

## Tellings

- **<the telling>** — believed by: … — differs from the truth: … *(settled)*

## Cast

### <Name> · <role> *(settled)*

- [M] **Tier**: core | recurring | functional | ambient
- [S] **Want**: conscious goal, visible in play.
- [M] **Weakness**: psychological (hurts them) | moral (hurts others) — …
- [L] **Lie**: the false belief — or **Doubt**, for a flat arc.
- [M] **Arc**: positive | flat | disillusionment | fall | corruption — turns at B-…
- [M] **Stance**: their answer to the theme question, and their method.
- [L] **Pressure choice**: the on-screen choice that shows who they are — B-…
- [L] **Player should feel**: … → … (by chapter or stage)
- **Signature**: one concrete detail that is only theirs — a habit, an object, a rule, a job done
  their way — from the owner's material or a named source. Every core character has one.
- **Line** *(placeholder)*: one thing they might say, in the register the tone contract implies — so
  the owner can hear them. A seed for game-dialogue's voice profile, never canon; replaced by a
  pointer once VOICES.md has them.
- **Past**: optional; specific; passes the deletion test (`references/cast.md`).
- **Ties**: what they think of at least one other cast member.
- **Canon facts**: age, pronouns, background, forms of address, what they know (see Reveals).
- **Voice**: VOICES.md → <Name>

Antagonists add, from M:

- **Shared goal / method**: the goal they share with the hero; the method the hero refuses.
- **Exploits**: the hero's weakness they are best placed to attack.
- **Counter-argument**: one line a reasonable player could find tempting.
- **Front**: 3–5 portents in order, each with what happens if the player does nothing — and the beat
  that shows it (B-…).

## Places and factions

### <Name> *(settled)*

- **In the story**: which beats use it and for what.
- **Goal / contested resource / internal dissent / stance** (factions).
- **Pressure from the past**: the grudge, debt, ruin or taboo it carries into the present.
- **Hazards and who is there** (places).

## Beat map

Ordered as most players meet them. A beat is a change in world state that the player does, finds,
chooses or watches.

### B-<slug> · <title> *(settled)*

- [S] **Where**: the mission, level, rift, floor or trigger — in the project's own IDs.
- [S] **Player**: does | finds | chooses | watches — what, concretely.
- [S] **Change**: <value> from → to.
- [M] **Needs**: the flags or state required (never "after mission N"), or —
- [M] **Sets**: the flags or state written, or —
- [M] **Delivery**: scene | cutscene | environment | item text | bark | system | briefing | debrief
- [M] **Weight**: load-bearing (the ending depends on it) | modular (cuttable or reorderable)
- [L] **Gate**: the progression gate it sits on (boss, rank, badge, hub return, fixed floor) or free
- [L] **Theme**: states | echoes | counterpoints — how
- **Reveals**: F-…   **Withholds**: F-…
- **Peak**: high | low
- **Fallback**: the route if the NPC is dead, the item lost or the region skipped (load-bearing
  beats; required at L). It sets what the beat would have set.
- **Pays off**: P-… or B-…
- **Purpose**: for quest design — story beat, teaches a mechanic, introduces someone, breather.

## Key scenes *(settled)*

- **<scene>** (B-…): at least the opening, the midpoint and the climax, a short paragraph each — where
  we are, the concrete images, what the player does, what changes — written in the game's tone. A few
  lines of speech where the scene turns on them, marked as placeholders for game-dialogue.

## Reveals

### F-<slug> · <the fact, in one line> *(settled)*

- [M] **Must-know**: yes | no | hidden (true, never told directly)
- **Not before**: B-…
- **Who knows**: <Name> — from the start / learns at B-… / believes the telling / never

## Promises

- **P-<slug>** — <the setup, or the choice the game signals as consequential> — set up at B-… — paid
  off at B-… *(settled)*

## Names

- **Glossary**: term — meaning — pronunciation — why this name.
- **Naming spec** per culture: sound inventory, syllable shapes, spelling rules, three examples.

## Sources

- **Inspiration**: what is kept (a feeling, a mechanic) · what is changed · what the original never
  did that this game does · what was checked for collisions (names, creatures, characters, setting,
  against the inspiration and famous IP). The bible never claims originality; the owner and a
  reviewer confirm it.
- **Particulars**: where each comes from — the owner's own life, an observed procedure, named research
  — and, per borrowed tradition, its source and consultation level.

## Open questions

- **Q-<slug>** — the question — the options — what depends on it — who decides.

## Changelog

- <YYYY-MM-DD> — what changed — why — reconciled or retconned — revisit: VOICES.md, dialogue keys,
  missions.
````

## What each consumer reads

| Consumer | Reads | So the bible must give |
|---|---|---|
| **game-dialogue** | Cast, Key scenes, Reveals (who knows what when), Writing rules, Names | Canon facts, stances and signatures for each speaker; what each key scene must do; the earliest beat each fact may be spoken; protected moments; terms and pronunciations. How a character *sounds* stays in VOICES.md — STORY.md never restates it. |
| **Quest design** (a later `game-quests` skill, or a designer) | Beat map | Per beat: the core idea and emotional target (Change), how the player meets it, preconditions and postconditions as state, the fallback, the gate, the purpose. Verbs, solutions, assets and scripting stay with quest design. |
| **Voice and localisation** | Cast, Names, Truth | Age, gender and pronouns, background, relationships, forms of address; name rationale and pronunciation; the full truth (translators need spoilers). |
| **An audit** | Everything, by ID | Units it can diff against the build when gameplay changes. |

## Updating

- Read the whole file before changing any entry; a fact may be cited elsewhere by ID.
- Show changed entries to the owner before writing them, with their new status.
- Add a changelog line for every change, naming the downstream files to revisit — VOICES.md profiles,
  dialogue keys, missions — so game-dialogue and production can follow it.
