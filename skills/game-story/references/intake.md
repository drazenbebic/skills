# Intake: reading the project and interviewing the owner

A model left alone writes the modal story of its genre. What displaces the defaults is specific
material — the game's own verbs, the owner's taste, places and procedures someone actually knows — so
the intake is where the story's raw material comes from, not a formality before the writing. Sources
are named briefly so a rule can be traced.

## Reading the project

Narrative that joins late inherits a fixed story space (Pratchett's "narrative paramedics"); even
where story leads, built things come first (Half-Life 2's train ride came from a programmer's train
tool). So inventory what exists before proposing anything.

- **The loop and its verbs**: what the player does minute to minute, what they collect, build,
  befriend, kill or fix, and what the game rewards. These are where the theme will have to live
  (`references/game.md` → *The two contracts*).
- **Progression**: regions, chapters, ranks, floors, unlocks, hub returns, bosses. Story beats sit on
  these gates.
- **Story space**: how scenes are shown (cutscene, in-engine, portraits and text, environment, item
  text, barks, briefings), what is voiced or recorded, what is locked, the content budget.
- **Story documents**: a bible, plot, lore, GDD story section, design spec, wiki export — any name
  (`STORY.md`, `PLOT.md`, `LORE.md`, `docs/`, `design/`). If one exists, it is the bible.
- **Story data**: scene scripts and their triggers, mission and quest tables, flag lists, dialogue
  catalogs, item, codex and monster text, content generators. Note the IDs and flag names; the bible
  will use them.
- **House rules**: `VOICES.md`, style guides, banned words, original-IP rules, rating, tone notes in
  docstrings and AGENTS files.

Record what you found in a line or two for the owner: what you read, the scale, the binding rules.

## The owner interview

Ask what the project and the request don't already answer, in **one batched question**. The **(!)**
items are worth waiting for in a create; ask the rest when they matter to this request, and assume
and say so otherwise. In a revise, ask the revise items first.

1. **(!) Feel.** Two or three works (games, films, books) you want this to feel like — and for each,
   one specific scene, and what you *don't* want from it. *(The TV tone meeting walks scene by scene
   through tonal moments; a reference without a scene is a genre label.)*
2. **Session words.** Many words for how a session should feel; then pick three. *(Unpacking's team
   narrowed a long adjective list to three pillars.)*
3. **Pillars.** The game's pillars, if it has them, and which one the story owns. A pillar must be
   able to fail a scene: "father and son" can reject a quest, "fun" cannot. *(God of War, 2018.)*
4. **The loop's feel.** What the player does minute to minute, and how it should feel. *(Kasavin
   matched Hades' slapstick humour to the die-and-retry loop.)*
5. **Runs**, if the game has them: what persists between runs, and what resets? *(A roguelite's
   story rides on what survives a death — Hades; a "run" can also mean one day of a continuous
   season.)*
6. **(!) Protected moments.** Moments, characters or ideas that must never be undercut or cut.
   *(Toby Fox checks that no joke ruins a serious scene.)*
7. **(!) Particulars.** What real place, job, period, tradition or experience does it feel like? What
   do you know unusually well? *(Celeste came from its creator's own anxiety; Firewatch from a
   childhood in Wyoming; Papers, Please from watching immigration inspectors work.)*
8. **The inspiration.** If the game builds on another, what bothered you about that one, what did it
   never deliver, and what are you keeping? *(Stardew Valley set out to recapture Harvest Moon's
   feeling and fix what had worn thin.)*
9. **Borrowed traditions.** Whose folklore, history or culture does it draw on, and who could review
   it? (`references/particulars.md` → *Real cultures*.)
10. **Not for.** Who is this game not for? *(Darkest Dungeon's team accepted it was "not a game for
   everyone" — and committing to the tone widened its appeal.)*
11. **The cut.** If a third of the story had to go, what goes first? *(Load-bearing and modular beats;
    a story that pays off only in its last act is the most exposed to cuts.)*
12. **(!) Your own direction.** One or two rough story ideas of your own, however vague — before you
    see mine. *(Berg: judges pick novel ideas better after doing some divergent thinking themselves;
    applying it here is an inference.)*
13. **The protagonist.** Silent, defined, or made by the player? (`references/game.md` → *The
    protagonist type*.)
14. **Limits.** Rating, content the game won't show, and how much the player reads per sitting.

**Revise only:**

- **(!) What do you love** in the current story? It becomes the protected list before any fix is
  proposed. *(Portal 2's playtesters made the team restore portals, Chell and GLaDOS.)*
- **(!) What bothers you**, in your words — a scene, a character, a feeling.
- **What is locked**: recorded voice, shipped content, built levels, art already made.

## Generic answers

"Epic", "emotional", "dark but fun", "like Ghibli" carry no particulars. Customer-interview practice
treats "I usually", "I would" and "I might" as noise and redirects to a specific past instance (*The
Mom Test*); applying it to creative taste is an inference, but a cheap one. Ask once:

- "When did a game last feel epic to you? Which moment?"
- "Which Ghibli film, and which scene in it?"
- "What did you see or do there that you can't get from other games?"

Then use the scene, not the adjective. If the answer is still general, record it as given and work
from the game's own verbs and the owner's particulars instead.

## Running unattended

Draw the answers from the project — its docs, art direction, mechanics, existing lines, commit
messages — and from the request. Write each question with the assumption you made, and mark every
particular you supplied yourself as `proposed`, so the owner sees which details are theirs and which
are placeholders.

## Where the answers go

| Answer | STORY.md |
|---|---|
| Feel, session words, the loop's feel | One-sheet → Tone |
| Pillars | One-sheet → Pillars |
| Protected moments | Rules → Writing rules; the revise's protected list |
| Particulars | Sources → Particulars, and into cast, places and beats |
| The inspiration | Sources → Inspiration |
| Borrowed traditions | Sources, with a consultation level |
| Not for | One-sheet → Not for |
| The cut | Beat map → Weight |
| The protagonist | One-sheet → Protagonist; Cast |
