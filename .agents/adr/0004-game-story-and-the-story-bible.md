# 0004 — game-story and the story bible

Status: accepted

## Context

`game-dialogue` reads a project's canon before writing a line, but nothing in this repo writes that
canon. The two test-bed games show the gap from both sides. Ponor keeps a 1,200-line `docs/PLOT.md`
with settled markers, an open section and the myth set apart from the truth — a story bible in all but
name. Fuseborn's story is spread over one section of its design spec and some 95 scenes in a content
generator, and story facts ("never revealed early: …") had drifted into its `VOICES.md`, the file
meant for how characters sound.

0003 anticipated a `game-narrative-design` skill. In games, "narrative design" usually means wiring
story into play — missions, consequences, reactivity — which is a different job from deciding what the
story is.

## Decision

- **`game-story` owns what is true and when the player learns it**: premise, cast (who each character
  is), antagonist, world, tone, the beat map, the reveal schedule. **`game-dialogue` owns what is said
  and how it sounds**: lines, and voice profiles in `VOICES.md`. Neither restates the other's facts;
  each cites the other's file.
- **The story bible is `STORY.md`**: one canon file per project, beside its narrative docs, with a
  status on every entry (`settled`, `as-built`, `proposed`, `open`, `cut`) and stable IDs (`B-` beats,
  `F-` facts, `P-` promises, `Q-` open questions). A project that already keeps its story in another
  document has a bible: the skill works in that document and offers STORY.md only as a migration.
- **The agent records; the owner decides.** Anything the owner hasn't approved is `proposed`;
  `game-dialogue` treats only `settled` and `as-built` entries as canon.
- **A beat is a change in world state**, with the flags or state it needs and leaves, written in the
  project's own identifiers — so it can be checked for order, leaks and soft-locks, and handed to quest
  design.
- **Quest design is the next skill, `game-quests`**, picking up from the beat map. `game-story` stops at
  what each beat must achieve, how the player meets it, its state and its fallback; verbs, solutions,
  assets and scripting are quest design's. After that: `game-ui-text` and `game-localization`, as 0003
  lists. `game-narrative-design` is retired as a name.
- **Lists of AI-story defaults live in the checker**, which scans after generation; the skill's prompts
  aim at positive targets.

## Why

- **One fact, one place.** A fact stated in both the bible and the voices file drifts; a voice profile
  that cites the bible can't contradict it.
- **Statuses make drafts safe to keep in the repo.** The owner sees at a glance what is canon, and the
  dialogue skill knows what it may rely on — the recorder/decider split franchise canon teams use.
- **IDs and state make a story auditable.** Dialogue needs to know what a speaker knows at a beat;
  quest design needs beats it can reorder without breaking cause; an audit needs units it can diff when
  gameplay changes. A synopsis serves none of them.
- **Naming defaults in a prompt makes them more likely** (the research's "pink elephant" finding); a
  post-generation scan has no such cost.

## Consequences

- `game-dialogue` reads `STORY.md` as canon, takes the speaker's and player's knowledge from its
  reveals, and sends story changes back to the bible as proposals.
- Voice profiles cite `STORY.md` for want, need, Lie and wound where it holds them; reveal limits in a
  voices file point to the bible instead of copying it.
- An existing game gets an extract pass — its as-built story recorded as `as-built` — before any
  judgement or rewrite.
- `game-quests` inherits the beat map's fields as its input; changing them is a change to both skills.
