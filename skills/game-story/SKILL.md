---
name: game-story
description: Create, extract, audit or rewrite a game's story — premise, cast, antagonist, world, tone, the beat map tied to missions and progression, and what the player learns when — and keep it in the project's story bible, STORY.md, the canon game-dialogue writes lines from. Use this whenever a game idea needs a story, an existing game's story needs reviewing, fixing or rewriting, someone wants a story bible, plot outline or lore document, or a story feels generic, flat or AI-written — even when the request is just "what's my game's story", "give my monster game a plot" or "the villain is boring". Not for writing lines (game-dialogue) or designing quest mechanics.
compatibility: The bundled checker needs Node ≥ 22 (no dependencies).
---

# Game story

A game story is not a synopsis. Its unit is the **beat**: a change in world state that the player
does, finds, chooses or watches, with the state it needs and the state it leaves. Its theme rides on
the player's verbs, because most players never reach the ending — even well-loved long games are
finished by a minority. Its **particulars** — places, customs, jobs, creatures, losses — come from the
owner's life, an observed procedure or named research, never from genre defaults. And it lives in a
canon file with statuses and stable IDs, so dialogue, quest design, voice and localisation can cite
it.

Language models get exactly these choices wrong by default. Their stories put the climax early,
resolve tension almost completely, write friendly casts and community-festival endings, and reach for
the same names and settings across vendors (Elias, Elara, the lighthouse keeper) — and model judges
rate those stories highly. So this skill **interrogates, structures and checks** rather than invents:
it draws particulars out of the owner, offers premises that differ in kind, builds the chosen one
into STORY.md, and tests it with a mechanical checker and structural reading tests. It never
certifies its own story.

## Ground rules

- **The project's rules beat this skill's defaults.** Its existing story documents, design pillars,
  house rules and settled decisions are the authority; a default here applies only where the project
  is silent. If a project rule looks like a mistake, say so — and still follow it.
- **The owner decides; you record.** Anything you write that the owner hasn't approved is `proposed`
  (`references/bible.md` → *Canon control*). Promoting it to `settled` is the owner's call, in their
  words.
- **Particulars come from the owner.** Ask for them, and use them exactly as given — they are facts
  about the owner's life, never adjusted to fit the plot. A specific detail you invent is a
  placeholder, marked `proposed`, until the owner or a named source confirms it.
- **Ride the verbs the game has.** The story works with the mechanics the owner described or built. A
  beat that needs a new system is a design proposal: list it under open questions with what it costs,
  and keep a version of the beat that works without it.
- **Options that differ in kind.** Premises, fixes and major turns come as 2–3 options that differ in
  engine, protagonist or player fantasy — rewordings are not options — each labelled with what it
  risks and what it gains. Rank none of your own options as the answer; name originality as a
  criterion and keep the boldest option in play.
- **Outline first, file after.** The owner approves the outline in your reply before STORY.md is
  written or rewritten. "Just write it" skips the wait, not the outline: entries land as `proposed`.
- **Aim at the target; let the checker catch the defaults.** While generating, write toward the
  owner's particulars, the setting's naming spec and costly resolutions. The lists of defaults live in
  the checker, which scans afterwards — naming defaults while generating makes them more likely.
- **Audit as a stranger's work.** Whoever wrote the story — the owner, a past session, you — judge it
  against the checklist, and count findings before anything is praised.
- **Never certify.** Don't call a story original, tense, authentic or finished. Deliver drafts, and
  name what only the owner, a playtest or a consultant can settle.
- **If you can't ask** (running unattended, or the owner said not to), write each question with the
  assumption you made, and continue.

## Modes

Pick from the request:

| Mode | When | Steps |
|---|---|---|
| **create** | A game idea with no story yet — or a new chapter, region or character for an existing bible | 1, 3, 4, 5, 6, 8, 9, 10 |
| **extract** | An existing game whose story lives in docs, scripts and data but not in a bible | 1, 2, 8, 9, 10 |
| **audit** | Critique only | 1, 2, 7, 8, 9 — change nothing |
| **revise** | Fix, extend or rewrite an existing story | 1, 2, 3, 7, then 4–6 as far as the chosen fixes reach, 8, 9, 10 |

An existing game with no bible is extracted before it is judged: the as-built story first, the
diagnosis after. A create inside an existing bible runs step 1 against that bible and keeps every
settled entry.

Scale to the game and the request (`references/bible.md` → *Scale*): a puzzle game's story is a
page, an RPG's is a full bible, and one new side character needs no premise round. Every mode reads
the project first and runs the checks.

## Workflow

### 1. Read the project

Before anything else, find:

- **What the player does**: the core loop and its verbs, the progression structure (regions, ranks,
  floors, unlocks, hub returns), the genre and length, and how story is shown (cutscenes, portraits
  and text, environment, item text). The story rides on these.
- **The story as written**: a story bible, plot, lore or design document — STORY.md under any name
  (`references/bible.md` → *Where it lives*). If one exists, it is the bible.
- **The story as built**: scene scripts, mission and quest tables, flags and triggers, dialogue
  catalogs, item and codex text.
- **House rules**: `VOICES.md` (game-dialogue's file), banned words, naming, tone, reveal limits,
  rating, rules about original IP.
- **Constraints**: what is voiced, recorded or locked; localisation; platform; team size.

Say in a line or two what you read, the scale you'll work at, and which rules bind this request.
Done when you can name the loop, the progression structure, and every file that holds story.

### 2. Extract the as-built story

`references/revision.md` → *Extract the as-built story*.

- Inventory every story-bearing source, and normalise each unit to a row: its ID and source, trigger
  and preconditions, effects, characters, facts asserted, the change it makes, and its change cost
  (voiced, cinematic, scripted).
- Treat the units as a graph and check it: unreachable units, flags read but never set or set and
  never read, reveals that can fire before their setup, contradictions between units.
- Separate built from intended: design-doc beats with no implementing unit, and implemented units the
  docs never mention.
- Draft it in the bible format (`references/bible.md`), every entry `as-built`, keyed to the
  project's own IDs and flags.

Done when every story-bearing unit is accounted for: mapped to a beat, listed as colour, or flagged
as unreachable, contradictory or unimplemented.

### 3. Intake

`references/intake.md`. Ask what the project and the request don't already answer, in **one batched
question**, and wait — the owner's taste is the material, and it can't be assumed. The three things
most worth asking:

- **Feel**: two or three works they love, one specific scene from each, and what they *don't* want
  from each.
- **Particulars**: the place, job, period, tradition or experience they know unusually well.
- **What must not be lost**: protected moments, characters or ideas — in a revise, what they love in
  the current story and what bothers them.

Also ask for one or two rough story directions of their own, before you show yours. A generic answer
("epic", "emotional", "like Ghibli") gets one follow-up: the last time they felt it, and in which
scene. Done when you can fill the one-sheet's tone, pillars and particulars from the owner's answers
rather than from genre.

### 4. Premises

`references/premises.md`.

- **Diverge**: generate a wide pool of one-line premises from different generators — two unrelated
  frames collided, a constraint from outside the idea, the antagonist's viewpoint, the owner's
  particular, the inspiration's unkept promise. Cut every one that resembles the genre default or a
  famous work; merge near-duplicates.
- **Develop 2–3 survivors** that differ in engine, protagonist and player fantasy: a logline, what
  the player does that moves the story, protagonist and antagonist in a line each, the theme question,
  a Story Spine, and what the premise risks and gains.
- **Test** each: the logline tests, "what does the player do that moves this story?", and the
  default probe (`references/review.md`).
- Write them to a scratch drafts file and run the checker with `--premises` (step 8).

**Stop and present** (step 9). Done when the owner has chosen, mixed or redirected, and the chosen
premise's pillars are locked.

### 5. Build canon

`references/craft.md`, `cast.md`, `world.md`, `particulars.md`, `game.md`.

- **Truth first**: what really happened, earliest first, including the antagonist's offscreen moves;
  then the tellings, if the story turns on a myth, lie or secret.
- **The cast as a web**: each core character's want, weakness, arc and stance — a different answer
  to the theme question, by a different method. Decide the protagonist type (silent, defined,
  player-made); for a flat arc, name who changes instead.
- **The antagonist sheet**: the goal they share with the hero, the method the hero refuses, the
  weakness they exploit, a counter-argument a player could find tempting, and a front of 3–5 portents.
- **The world**: rules that cost someone something, factions with incompatible goals and internal
  dissent, history only where it presses on the present.
- **The contracts**: tone (register, the loop it matches, protected moments); ludic and narrative,
  stated in a sentence each; the naming spec per culture; the inspiration ledger; sources and
  consultation levels for borrowed traditions.
- **Particulars everywhere**: every core character, place and faction carries a concrete detail that
  is only theirs — a habit, an object, a rule, a job done their way — from the owner's material or a
  named source. This is what makes the bible read as a world rather than a schema.

Done when every one-sheet field is filled, no two core characters share a stance, and every core
character has a signature.

### 6. Break the beat map

`references/game.md`, `craft.md`, `bible.md`.

- **Fix the load-bearing turns first** — the gates between chapters, regions or run tiers, the
  midpoint, the climax — then fill each stretch between with its own question, escalation and payoff.
- **Blend strands**: A the main path, B a relationship or companion arc, C a world or lore runner,
  placed into the game's spaces.
- **Write each beat** as what the player does, finds, chooses or watches, plus the value it turns;
  with Needs and Sets in the project's own flags, delivery, weight, gate, and a fallback for
  load-bearing beats.
- **Chain by cause**: "but" or "therefore" between beats, never "and then"; every way out of a major
  jam uses something the player already has.
- **Place for the players who stop early**: the central question, the main relationship and the theme
  legible by the midpoint; a payoff in the first session; the largest reversal in the final stretch;
  after every peak, a cost carried forward.
- **Ledgers**: every must-know fact with at least two carriers; every signalled choice and setup in
  Promises, with its payoff.
- **Sketch the key scenes** — at least the opening, the midpoint and the climax — as short paragraphs
  of what the player sees and does, written in the game's tone: if the tone contract promises dry
  humour, the sketch is dry and funny. Then write the **synopsis**, last, so it tells the story the
  beats actually hold. The owner judges the story by these two; the fields are for the work after.

Done when every beat has the fields its scale requires, every must-know fact has two carriers, and
the synopsis reads as a story someone would want to play.

### 7. Diagnose

`references/revision.md`, `references/review.md`.

- Compress each unit to its story event — the action, the tactic, the value that changes — and test
  it for a turn, a crisis and a decision.
- Run the global questions, then the checks in `craft.md`, `game.md`, `cast.md`, `world.md`,
  `particulars.md` and `review.md` → *Where models fail*.
- Grade it as coverage: premise, protagonist, antagonist, cast, causality, structure and pacing,
  theme, game integration, tone, particulars.
- For each problem worth fixing, 2–3 options with their trade-offs and what each touches (beats,
  scenes, lines, voice, cinematics). Additive fixes first. Replacing the spine only when the want, the
  controlling idea or the ending can't be made coherent with existing content — and then priced.

Done when every finding cites its units — IDs, or chapter and line where the document has none — and
says what breaks in play.

### 8. Check

1. **Run the checker** from this skill's directory:

   ```bash
   node scripts/check.mjs <path to STORY.md>
   ```

   For a project's bible in its own format add `--scan-only`; for premise drafts, `--premises`. Fix
   each finding or say why it stands; re-run until only justified findings remain
   (`references/review.md` → *The checker*).
2. **Run the reading tests** (`references/review.md` → *Reading tests*) and write down what each
   found.
3. **Run the default probe** on the premise, the load-bearing beats and the ending: list ten ways a
   story like this usually goes at that point; if the planned beat is among the most common, replace
   it or say what earns it.

### 9. Present

The owner reads story, not process. Give them, in this order:

1. **What you read** and the scale — one or two lines.
2. **The thing to decide**:
   - *create, premises*: 2–3 premises, each with its logline, what the player does that moves it,
     protagonist and antagonist, theme question, risk and gain; originality named as a criterion.
   - *create, bible*: the synopsis first, then the one-sheet, a cast table (name, role, want, stance,
     signature), the antagonist's front, the beat list (ID, where, change), the key scenes, open
     questions.
   - *extract*: the as-built logline and beat list, the gaps and contradictions found, and where built
     and intended differ.
   - *audit*: a one-line verdict (revise or rewrite), the as-built logline, the coverage grid, findings
     by severity — each with its unit IDs, what breaks in play, and the options — the protected
     elements, and a playtest plan.
   - *revise*: what each chosen option changes, and the impact table (keep, re-motivate, rewrite,
     re-voice, cut) keyed to IDs and files, for game-dialogue and production.
3. **What the checks changed** — only findings that changed something or still stand, one line each,
   in story terms. A clean run is one line. Report a probe's result by showing it (the common versions
   of that beat), not by claiming it ran.
4. **Open items**, only those that apply: proposed canon awaiting approval; consultation flags; what
   only a playtest can judge; questions you couldn't ask, with the assumption you made.

Everything the owner needs to judge is in the reply — not only in a file you mention — and the reply
stays shorter than the bible. Speak in the owner's terms: say what a test found ("the villain stops
wanting anything after chapter 2"), not the test's name, and don't name this skill's tools or files
unless asked. Findings are about the story; moving the owner's document into the bible format is an
offer in the open items, never a finding. State expectations as expectations ("most players will
likely miss it"), and leave measuring them to the playtest plan.

### 10. Write it in

After the owner approves:

- Write STORY.md — or the project's existing bible, in its own style — with approved entries
  `settled` in the owner's words, the rest `proposed`, extracted ones `as-built`.
- Add a changelog line for every change, naming the downstream files to revisit.
- Hand off what changed downstream: lines to rewrite go to game-dialogue as the impact table — in the
  reply and under the revision's changelog entry, so it outlives the session; new or moved beats are
  the input for quest design.
- Run the project's own checks if it has any (content validation, story soft-lock tests).
- Say what changed, file by file.

## Which reference

| Task | Open |
|---|---|
| The owner interview, reading a project, generic answers | `references/intake.md` |
| Generating, testing and presenting premises; breaking a story into beats | `references/premises.md` |
| Causality, value turns, stakes, setups and payoffs, theme, reveal order, arc shapes | `references/craft.md` |
| Story in play: verbs and contracts, delivery channels, protagonist type, choices, pacing, completion | `references/game.md` |
| How much story a genre needs; roguelites, creature collectors, horror and folk horror | `references/genres.md` |
| Characters, arcs, ensembles, companions, antagonists and fronts, rivals | `references/cast.md` |
| World rules, factions, history, places | `references/world.md` |
| Tone, where particulars come from, real cultures, naming, building on an inspiration | `references/particulars.md` |
| STORY.md: format, statuses, IDs, scale, canon control, handoff to dialogue and quests | `references/bible.md` |
| Extracting, diagnosing, revising and rewriting an existing story; impact tables | `references/revision.md` |
| The checker, reading tests, the default probe, model failure modes, what only people can verify | `references/review.md` |
