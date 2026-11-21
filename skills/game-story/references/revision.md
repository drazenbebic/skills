# Revision: extracting, diagnosing and rewriting an existing story

For an existing game, the professional sequence is: inventory the story space, extract the story the
build actually tells, separate it from the story the documents describe, diagnose it unit by unit,
and only then propose fixes — additive ones first, because the documented late tear-downs shipped
incoherent stories. Sources are named briefly so a rule can be traced.

## Extract the as-built story

No public write-up describes reconstructing a large commercial game's story from its data; this
procedure is a synthesis. The cautionary case for doing it at all: a Diablo historian reportedly had
to hand-transcribe every spoken line of the first two games because nobody had kept track.

1. **Inventory every story-bearing source**: design documents, scene scripts and their triggers,
   cutscene lists, mission and quest tables, dialogue catalogs, item, codex and creature text, flag
   definitions, content generators, tests that load story (soft-lock checks). If you script the
   extraction, keep the project untouched: your script and its output live in your scratch space,
   and nothing it runs may leave files in the project (for Python, `python3 -B`, so no `__pycache__`).
2. **Normalise each unit to a row**:

   | Field | Holds |
   |---|---|
   | ID and source | The project's own ID and the file it lives in |
   | Type | Scene, mission, briefing, debrief, bark pool, item text, environment |
   | Trigger and preconditions | What fires it; the flags or state it requires |
   | Effects | Flags or state it sets; unlocks; who joins, leaves or dies |
   | Characters | Present, and mentioned |
   | Facts asserted | What it claims is true about the world or the past |
   | Story event | One line: the action, the tactic, the value that changes |
   | Change cost | Voiced, cinematic, scripted, localised — what a change would cost |

3. **Treat it as a graph** and check: unreachable units; flags read but never set, or set and never
   read; reveals that can fire before their setup on some path; dead-end states; contradictory facts.
   Tools exist for the mechanical part — symbolic execution and control-flow analysis to prove a branch
   unreachable (Manning, GDC 2019, Yarn Spinner); random playthroughs and graph traversal (ChoiceScript)
   — but none judges tone or pacing.
4. **Separate built from intended**: design-doc beats with no implementing unit (cut or unimplemented),
   and implemented units the docs never mention.
5. **Reconstruct the canonical path** and the main variants as a beat map, in the bible format, every
   entry `as-built`, keyed to the project's IDs and flags.
6. **Keep a fact table per voiced or locked unit.** Anthem's scenes were often captured once; when
   gameplay changed, lines stopped fitting — characters mention a destroyed javelin in a mission where
   it never is. A fact table diffed against the new behaviour catches it.

## Inventory the story space

Before any fix, list what the story can move in: cutscene slots, voice budget, what is recorded or
locked, environments, channels, art already made, how scenes are shown. A fix that needs a channel
the game doesn't have, or re-records half the cast, is priced as such.

## Diagnose

The methods share one move: compress each unit to a line saying what it does and what changes, then
test those lines against a few global questions. No study shows any of them improves revisions; they
are craft tradition, and the checks are what make them concrete.

- **Per unit** (Story Grid's Five Commandments): an inciting incident; a turning-point complication
  (an unexpected event that turns the value); a **crisis** posed as an either/or dilemma; a **climax**
  where a character decides and acts; a resolution. A beat with no turn, no crisis or no decision is
  flagged.
- **Global** (Story Grid's Six Core Questions): the genre, its conventions and obligatory moments; the
  point of view; the objects of desire, the antagonist's included; the controlling idea; a beginning
  hook, middle build and ending payoff that each carry their own turn, crisis and decision.
- **Reverse outline before changing anything**: what each unit does, what it needs — so structure
  surfaces before line work is wasted.
- **Then the story-level checks** in `craft.md`, `game.md`, `cast.md`, `world.md`, `particulars.md`,
  and `review.md` → *Where models fail*.

### Run it blind

Assistants give warmer feedback when told "I wrote this" (Sharma et al., ICLR 2024), and models score
their own outputs higher (Panickssery et al., NeurIPS 2024). Judge the story as a stranger's — whoever
wrote it — list findings as counts against the checklist first, and praise after.

### Notes have no authority

Pixar's Braintrust "should have no authority": directors were told they need not follow anyone's
notes (Catmull). Findings name problems and offer options; the owner decides.

## Recurring problems

Most named problems reduce to the per-unit test. Each has a check:

| Problem | Check | Case |
|---|---|---|
| Passive protagonist | Who makes the deciding choice at each act climax? | Hades II's Patch 1 gave the climax back to its protagonist |
| Convenient escape | Does a coincidence get anyone *out* of trouble? | Coats's coincidence rule |
| Idiot plot | Would one obvious question or disclosure dissolve the obstacle — and does the character have a stated reason not to ask or tell? | The term per Knight, possibly from Blish; popularised by Ebert |
| Exposition dumps | Backstory revealed gradually and in context; nothing the player isn't shown expected to matter; information the player couldn't otherwise know | Bastion's narration rules (Supergiant) |
| No thread in a mechanics-first game | Does narrative arrive by the point players drift (15–30 minutes in Portal's tests)? | Portal's per-chamber announcements |
| Too many characters | Count characters per chapter; merge those with one function | Destiny's reboot merged characters |
| Lines contradict changed gameplay | Fact table diffed against current behaviour | Anthem |
| Unpaid promises | The promise ledger | Mass Effect 3 |
| Front-loaded climax; tension resolved at once; friendly cast; festival ending | `review.md` → *Where models fail* | Tian et al.; Spoiler Alert |
| Sagging middle | The middle build has its own crisis and climax (Story Grid) | "Sagging middle", "theme sermon" and "tonal whiplash" are folk labels with no agreed definition — use the checks in `craft.md` and `particulars.md` instead |

## Revise or rewrite

The documented production rewrites favour targeted revision over clean slates (reported journalism
and developer recollection, biased toward troubled projects):

- **Destiny**: in July 2013 a roughly two-hour supercut of the story was judged too campy and linear and
  scrapped; a new plot was sketched in about two weeks, existing missions were cut apart and recombined
  into what one source called a "Franken-story", and it shipped at a Metacritic of 76 against internal
  projections of about 90.
- **Anthem**: real production happened in the last 18 months, partly because of narrative reboots; the
  story, loop and missions were largely made in the final 12 to 16 months; it launched at 55 against
  mock reviews in the high 70s.
- **Portal 2**: the first concept dropped portals, Chell and GLaDOS; playtesters said it wasn't Portal
  2, and all three came back.
- **Halo 2** cut practically its entire third act and ended on a cliffhanger — the exposure of a story
  whose payoff sits in its last missions.
- **The successful post-launch fixes added and moved, keeping the spine**: Mass Effect 3's Extended Cut,
  Final Fantasy XV's patched Chapter 13, Hades II's Patch 1.

"Murder your darlings" is Arthur Quiller-Couch's 1914 lecture on ornate prose, not a licence to demolish
structure.

**Rules:**

- **Record the protected elements first** — what the owner loves — before proposing anything.
- **Additive first** for shipped or locked content: add a beat, move a choice, re-motivate a scene.
- **Replace the spine only when the spine fails**: the global want, the controlling idea or the ending
  can't be made coherent with existing content. Then price it — missions reordered, lines re-voiced,
  scenes re-shot.
- **Options, not a verdict**: two or three fixes per problem, each with its trade-off and the units it
  touches; the owner chooses.
- **Mark load-bearing and modular beats**, so every act pays something off on its own and the story
  survives a cut.

## The coverage report

Script coverage's format, adapted:

1. **Verdict** — one line: revise or rewrite, and why.
2. **Logline** of the as-built story.
3. **Synopsis** — a short paragraph.
4. **Grid** — each graded poor, fair, good or excellent with a one-line reason: premise, protagonist,
   antagonist, cast, causality, structure and pacing, theme, game integration, tone, particulars.
5. **Findings by severity** — each with its unit IDs, what breaks *in play*, and 2–3 options with
   trade-offs and cost.
6. **Protected elements.**
7. **Test plan.**

Readers weight execution over concept; so should the grid.

## The impact table

When fixes are chosen, every affected unit gets a row, so game-dialogue and production can follow:

| ID | Unit | Change | Where | Cost | Who |
|---|---|---|---|---|---|
| B-… / scene key | What it is | keep · re-motivate · rewrite · re-voice · cut | file and key | voiced? cinematic? | game-dialogue · quest design · production |

**Re-motivate** keeps the event and changes why it happens — usually the cheapest fix that changes
meaning.

## Narrative playtesting

Studios test story early, before content locks: Microsoft's "narrative usability" work looks for twists
that don't land and tracks how players' views of characters change (Hendersen); Ubisoft ran narrative
reviews early enough for writers to act (Dankoff). Their instruments aren't public. Naughty Dog's tests
of The Last of Us Part II found players disliking characters meant to be likable, and the story was
revised. A revised story ships with a test plan:

- **Retell**: players tell the story back; score it against the beat list (less leading than direct
  questions — Kreminski et al.).
- **Perception**: per named character, what players think of them, before and after their key beats.
- **Expectation**: what players expect before each reveal, and what they make of it after.
- **Skips**: per-scene skip telemetry — which scenes, and where in the scene (no published benchmarks).
