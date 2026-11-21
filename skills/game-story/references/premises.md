# Premises: generating, testing, choosing, breaking

Good premises come from separating generation from judgement. The first idea is usually borrowed,
unnoticed, from what the writer has already seen — and for a model, "what it has already seen" is the
modal story its training rewarded. Generating more of the same doesn't help: of 4,000 model-generated
seed ideas, 200 were distinct (Si et al., ICLR 2025). Variety has to come from varied inputs.

## Idea, premise, story

- An **idea** is a setting, mechanic or image: "monsters you can fuse", "a village above a pit".
- A **premise** is an idea that implies a person who wants something and an obstacle: who wants what,
  what stands in the way, what it costs. Kowal's filter for choosing among ideas is whether one will
  make a *story*, not how exciting it is (Writing Excuses).
- A **story** is a premise broken into beats (the end of this file).

"The first idea is everyone's idea" has no traceable author; Kevin Kelly's version is that the best
idea is usually about the fifth. Treat it as a working habit, not a law.

## Generators

Give each candidate a **different generator**, so the options differ in engine, protagonist and player
fantasy rather than in setting:

- **Collision** — two self-consistent frames that don't normally meet (Koestler's bisociation; a
  description of the creative act, not a tested mechanism): a guild ledger and a funeral rite; a
  repair shop and a ghost story.
- **A constraint from outside the idea** — one location; the protagonist cannot speak; the antagonist
  is right; the hub burns down at the midpoint. Game-jam themes are participants' most common source
  of inspiration (Global Game Jam survey). Draw the constraint from outside so it can't flatter the
  idea.
- **The other side** — the story the antagonist, a rival faction or a monster would tell.
- **The owner's particular** — the place, job or tradition from the intake, made into the engine of
  the plot rather than its backdrop.
- **The verb's meaning** — what does the core mechanic *mean* if taken seriously? Papers, Please gave
  every inspection rule a story reason; Undertale asked why fighting is the default; Outer Wilds made
  knowledge the only progression; Hades made dying the story's engine.
- **The inspiration's unkept promise** — what the predecessor set up and never delivered.

## The pool and the cut

1. Write 10 or more one-line premises, at least one per generator.
2. **Cut** every one that resembles the genre's default plot or a famous work — say which it
   resembles. Park the near-misses; they may come back.
3. **Merge** candidates that are the same idea in different clothes.
4. Develop 2–3 survivors that differ in kind.

## Developing a survivor

For each, in a few lines:

- **Logline** — protagonist, goal, the irony or obstacle, the cost.
- **What the player does** that moves this story — the verbs, in play, not in cutscenes.
- **Protagonist** and **antagonist**, a line each; the antagonist's goal shared with the hero's, and
  the method that differs (`references/cast.md` → *Antagonists*).
- **Theme question** — two defensible answers.
- **Story Spine** — Kenn Adams's improv skeleton from the late 1980s, which reached Pixar through
  Rebecca Stockley: *Once upon a time… Every day… But one day… Because of that… Because of that…
  Until finally… And ever since then…*
- **Risks and gains** — what it bets on, what it could lose, what only it can do.
- **Generator** — where it came from.

## Tests

Premise tests detect failure; none predicts a good story.

- **Logline** (Snyder): irony, a compelling mental picture, an audience and a cost, a title — irony
  matters most. A logline with no built-in contradiction ("a hero must stop a dark lord") is a warning.
- **One sentence** (Ingermanson): about 15 words naming protagonist, goal, conflict and stakes. If it
  can't be done, the premise isn't one yet.
- **The play test**: what does the player *do* that moves this story? If the answer is "watch
  cutscenes between levels", the story sits beside the game. Kasavin: designing on paper "can barely
  mean anything" until it's played.
- **The swap test**: could this premise run, unchanged, in another game or another setting? If yes,
  it has no particulars yet.
- **The default probe** (`references/review.md` → *The default probe*).

Write the developed premises to a scratch drafts file — one `### <id> · <generator>` block each,
holding only the premise text — and run the checker with `--premises`.

## Presenting and choosing

- **2–3 options that differ in kind**, each with its risks and gains. A meta-analysis of 50
  choice-overload experiments found a mean effect of about zero (Scheibehenne et al.), so the number
  matters less than how different the options are and which criteria are named.
- **Name originality as a criterion.** People choose feasible, safe ideas over original ones, and an
  explicit instruction to value originality reduces that (Rietzschel, Nijstad & Stroebe). Keep the
  boldest option in play.
- **No authoritative ranking of your own.** Creators predicted the success of others' novel ideas
  better than managers did, but not of their own (Berg, 2016). Describe what each option is best for;
  let the owner choose, mix or redirect.
- **Show the owner's own direction** beside yours, developed to the same depth.
- Lock the chosen premise's **pillars** before building canon.

## Breaking the story

In television, "breaking" a story means working out every scene of each storyline, as a group: the
showrunner approves the starting pitch, then hears the broken story pitched back beat by beat until it
is approved (Haywood). Here **the owner is the showrunner and you are the room.**

- **Strands**: A is the main path; B a relationship or companion arc; C a world or lore runner. Each
  has its own beats; *blending* decides which strand's beat sits in which part of the game.
- **Gates first**: place the hooks at chapter, region or run-tier gates first — the TV act break —
  then work backwards to fill each stretch.
- **Grain**: Story Spine (eight lines) → Snowflake (Ingermanson: the one sentence grows into a
  paragraph of setup, three disasters and an ending; the disasters become the major gates) → the beat
  map (`references/bible.md`).
- **Every beat** is what the player does, finds, chooses or watches, plus the change it carries.
- **Fixed or flexible**: mark each beat load-bearing or modular. The outline is a prototype to play,
  not a contract (Supergiant outlined most of Hades, then iterated for two years in early access).
- **Many voices, one vision.** Deck Nine's writers' room traded more perspectives and faster
  iteration against the risk to the story's voice. Generate widely; let the owner's pillars decide.
