# game-story — eval scenarios

Each scenario runs twice in parallel agents: once without the skill (baseline) and once told to read
`skills/game-story/SKILL.md` first and follow it. A separate grader sees both outputs as X and Y in
random order, runs `scripts/check.mjs` over any bible or premise drafts they produced (`--scan-only`
for other formats), scores each rubric item pass or fail with a quoted reason, and names the better
output. Where the skill does not beat the baseline, the skill is fixed and the scenario re-run.

Every prompt ends with: *You cannot ask the user questions: where you would ask, write the question
and the assumption you made, then continue. Write files only under `<out dir>`. Put your complete
answer in your final message.*

Fixtures live outside the repo, in the session's scratch space:

- **Fuseborn** — a copy of `docs/` (minus `superpowers/plans/`), `tools/content/`, `AGENTS.md` and
  `README.md` from `~/RustroverProjects/fuseborn`. The story lives in the design spec's §4 and in
  `tools/content/tables_story.py` (missions, scenes, flags); `docs/VOICES.md` holds the house rules.
- **The flawed story** — `flawed/STORY.md`: *Brinewake*, a salvage-diving game. Planted problems: an
  amnesiac chosen one named Kael; a mentor named Elara who keeps a lighthouse with a secret; an ancient
  evil awakening with world-ending stakes and no face; the biggest battle in chapter 3 of 8, then three
  chapters of shard-fetching; a storm that conveniently sinks the enemy fleet; companions who always
  agree; a smuggler choice announced as consequential and never paid off; the villain revealed as the
  hero's brother only in an optional codex entry, then treated as known; a misunderstood villain
  redeemed by forgiveness; a festival ending where the hero "learns the true power of friendship"; and
  a theme ("greed destroys") opposed by a loop that rewards hauling up and selling everything.

## 1. A story from an idea

**Prompt:** I'm making a 2D game where you run a night-shift tow truck in a sprawling, rain-soaked
port city: you hook wrecked and abandoned vehicles, haul them to your yard, strip them for parts, and
upgrade the truck (winch, crane, plough, radio scanner) to take bigger jobs further out. Each run is
one night; the yard is the hub. I want a story for it. About me: I worked nights at my uncle's
scrapyard for three summers. I love Outer Wilds, Night in the Woods and Papers, Please. I'm sick of
chosen ones and world-ending villains.

**Rubric:**
- The questions it couldn't ask are written down with the assumptions made.
- 2–3 premises that differ in engine, protagonist and player fantasy — not only in setting — each with
  what it risks and gains; a choice between them is made explicitly as an assumption.
- The owner's particulars (night shifts, an uncle's scrapyard, the port) drive the story, not just
  decorate it.
- The theme rides the verbs (hooking, hauling, stripping, upgrading); what the systems reward and what
  the story values are both stated and compatible.
- No chosen one, no world-ending stakes; the antagonist has a goal shared with the hero, a method the
  hero refuses, a tempting counter-argument and a plan that moves without the player.
- Beats are changes in world state with what they need and set; the one-night run and the yard hub
  shape the structure; a payoff early; the largest reversal late.
- Checker on the bible: no findings left unjustified.
- Nothing is certified original or finished; undecided material is marked as such.
- The owner, comparing both unlabelled, would keep this one.

## 2. Fuseborn — rewrite a generic story

**Prompt:** In the Fuseborn project at `<fixture>`, the story feels generic to me. Rewrite it so it
doesn't, keeping the game's missions, rifts and mechanics. Work only from the project copy; read
nothing outside it.

**Rubric:**
- Evidence the project was read first: the design spec's story section, `tables_story.py` (missions,
  scenes, flags), `VOICES.md`, the monster docs.
- The as-built story is extracted — beats keyed to the project's mission IDs and flags — before it is
  judged; differences between the spec and the scenes are noted.
- Findings cite mission or scene IDs and say what breaks in play, before any praise.
- Fixes come as options with trade-offs and cost; additive fixes first; missions, rifts and mechanics
  kept.
- House rules respected: original IP only (no Digimon terms), `VOICES.md` bans, the reveals it says
  must not come early.
- The revised bible marks what is extracted and what is proposed, keys beats to the project's flags,
  and has a reveal schedule; checker clean or justified.
- An impact table keyed to scene IDs and files, for the dialogue pass.
- The theme is tied to catching, bonding and fusing; the Hush has a face; the antagonist has a method
  and a counter-argument.
- The owner's protected elements are asked for, or assumed and said.
- No fixture file outside `<out dir>` is modified.

## 3. A generic story — review only

**Prompt:** Here's the story for our game, Brinewake (`<fixture>/STORY.md`). Review it — tell us
what's wrong and how to fix it. Don't rewrite it yet.

**Rubric:**
- Finds the planted problems: the amnesiac chosen one; the default names and the lighthouse-keeper
  template; the faceless world-ending evil; the climax in chapter 3 and the flat middle; the storm
  rescue; the agreeing companions; the unpaid smuggler choice; the brother reveal hidden in optional
  text; the redeemed villain; the festival ending and stated lesson; the loop that contradicts the
  theme.
- Each finding says what breaks in play and offers options, not one rewrite.
- Changes nothing; any sketch is labelled as one.
- Replacement names, if suggested, come from a naming approach, not from other defaults (Lyra,
  Thorne…).
- What works (the salvage loop, the archipelago, rig upgrades) is kept and said — after the findings.
- Nothing is certified.

## Results (2026-11-21)

Baselines and skill runs on Opus 5.5; graders blind, X/Y order varied per scenario.

| Scenario | Rubric (skill / baseline) | Holistic | What the grader said |
|---|---|---|---|
| 3. Generic story, review | 7/7 / 5/7; planted problems 11/11 / 10/11 | Skill | Found the default names and the lighthouse-keeper template the baseline missed (and partly praised); every finding had its play effect and costed options. Weaknesses fixed after: checker counts quoted that didn't match the list, a probe claimed but not shown, tooling leaking into a finding, no line references |
| 2. Fuseborn rewrite | 10/11 / 7/11 | Skill | Less generic, coherent premise tied to catching and fusing; the antagonist keeps its argument; a costed ending; as-built story keyed to IDs; spines with trade-offs. Failed only "no project file modified" (a `__pycache__` from importing the tables) — fixed in `revision.md`. Baseline more paste-ready in lines, but repeated the redemption ending it criticised |
| 1. Story from an idea, first run | 7/8 / 6/8 | Baseline, narrowly | Skill: premises, contracts, antagonist front, quest-ready state. Baseline: more alive — voices, a knowledge-solved mystery, rules that pay off. Fixed after: synopsis and key scenes, a signature per character, plausibility test, particulars used as given, no originality claims in the template |
| 1. Story from an idea, re-run | 8/8 / 7/9 | Baseline, narrowly | Skill passes every itemised criterion; holistic still to the baseline: the skill's story "reads like a schema" (no voices, promised humour not on the page) and adds systems the brief didn't ask for. Fixed after, and tested by the third run: "ride the verbs the game has", key scenes in the game's tone, a placeholder line per character, reading tests for both |
| 1. Story from an idea, third run | 9/9 / 6/9 | Skill | Every tow a verdict and a climax the player performs; an antagonist who is right, tempting and moving on her own; stock storm, reconciliation and celebration ruled out; flags and fallbacks a designer can wire. Baseline still warmer on the page. Fixed after: fallbacks set their beat's state, no load-bearing beat hangs on a skippable flag, no pointer to a VOICES.md that doesn't exist |

The skill now beats the baseline in all three scenarios. Baselines were strong throughout; the skill's
consistent edge is process (options, owner control, blind diagnosis, quest-ready state, default scans),
and the gap it closed over three runs was the liveliness of a freshly created story — synopsis and key
scenes in the game's tone, a signature per character, no invented systems.
