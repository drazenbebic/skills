# game-dialogue — eval scenarios

Each scenario runs twice in parallel agents: once without the skill (baseline) and once told to read
`skills/game-dialogue/SKILL.md` first and follow it. A separate grader sees both outputs as X and Y in
random order, runs `scripts/check.mjs` over the drafted lines, scores each rubric item pass or fail
with a quoted reason, and names the better output. Where the skill does not beat the baseline, the
skill is fixed and the scenario re-run.

Every prompt ends with: *You cannot ask the user questions: where you would ask, write the question
and the assumption you made, then continue. Write files only under `<out dir>`. Put your complete
answer in your final message.*

Fixtures live outside the repo, in the session's scratch space:

- **Ponor** — a copy of `docs/`, `content/`, `AGENTS.md`, `CONTEXT.md` and `README.md` from
  `~/RustRoverProjects/ponor`, with Biljana's *After the Navje* line removed from `docs/PLOT.md`
  (the beat's heading kept) and its prose versions removed from `docs/STORY_EN.md` and
  `docs/STORY_HR.md`. Checked with `grep` on four of its phrases and the Croatian one: no hits.
- **The flawed scene** — `flawed-scene.md`: Maren, a miller's widow, meets the player-created hero.
  Planted problems: an "As you know" exposition dump; named emotions ("I'm so sad", "I feel empty",
  "I am angry"); a quip undercutting her grief ("at least the mill's quieter now"); a choice
  labelled *Comfort her* whose line mocks her husband, answered by a generic "Thank you".

## 1. Ponor — a hidden line

**Prompt:** In the Ponor project at `<fixture>`, write Biljana's village line for the stage after the
Navje. Work only from the project copy; read nothing outside it.

**Rubric:**
- No "floor", "floors" or "Borna" in the line.
- 80–120 words.
- Consistent with Biljana's canon (`PLOT.md` §5 and her other lines): the second sin opens, faceless.
- Subtext over statement: no named feelings, no confession.
- Existing lines were read before drafting (evidence in the answer).
- Matches the catalog's conventions (`*marked*` phrases, `en.ron` key shape) if it proposes files.
- The owner, comparing it unlabelled with their own line and the baseline's, would keep it.

## 2. Ponor — new content

**Prompt:** In the Ponor project at `<fixture>`, write Tvrtko's quest ask for his boy (M4.3b in
`docs/ROADMAP.md` and `docs/PLOT.md`). Work only from the project copy.

**Rubric:**
- Consistent with canon: Ognjen, Stojan, the lair on floor 10, what Tvrtko knows and does not.
- No silent new canon: new facts are listed for approval.
- Tvrtko's voice (terse, craft-proud, guilt under thrift), checked against his settled lines.
- A voice profile built or stated before drafting.
- In the project's format (keys, placeholders, markup).
- No "floor" or "Borna".

## 3. Barks for another game

**Prompt:** A stealth game: write the guard bark pool for four triggers — heard a noise, saw
something, lost the target, found a body — as a TSV with ID, trigger, line.

**Rubric:**
- One fact per bark.
- Frequent triggers (heard a noise) blander than rare ones (found a body).
- Five or more variants per trigger.
- Stable, structured IDs.
- Honest to what the guard knows (no "the intruder" from a guard who only heard a noise).
- No stock phrasing; the checker runs clean or every finding is justified.

## 4. Branching in Yarn Spinner

**Prompt:** A cozy farming game in Yarn Spinner 3. The player-created character (any name, any
gender) meets Wren, a grumpy beekeeper who lost her hives to a frost, for the first time. Write the
first conversation with one choice that matters later.

**Rubric:**
- Neutral address for the player character.
- About three options, each a different move (not three tones of one move).
- Each option's text predicts the line the player character says.
- The choice sets a named variable, declared, and says where it pays off.
- `#line:` IDs on every line.
- `[select]` markup for any gendered word; no sentences assembled from fragments.
- Valid Yarn Spinner 3 syntax.
- Wren grumpy through tactic and status, not by announcing it.

## 5. Review

**Prompt:** Review this scene: `<fixture>/flawed-scene.md`.

**Rubric:**
- The "As you know" exposition dump found.
- The named emotions found.
- The quip undercutting grief found.
- The *Comfort her* label/line mismatch found (and the generic reply).
- Each finding with a suggested rewrite.
- The file unchanged.

## Results

2026-10-23, Claude Opus 5.5 for every run and grader. Blind grading: outputs labelled X and Y in
random order, paths that named the run removed (the with-skill answers still mention the checker, so
blinding is partial).

| # | Scenario | Verdict | Skill | Baseline |
|---|---|---|---|---|
| 1 | Ponor hidden line | **Skill** | 8/8 — gives Biljana the one beat no one else owns at that stage; exact setups for her later lines | 7/8 — spends half the line on the shield and "alone", which four other villagers just said |
| 2 | Ponor quest ask | **Skill** | Only voice-profile pass; its pick is unmistakably the smith; no spoilers | No profile; outside one sentence, any grieving father |
| 3 | Barks | **Skill** | 6/7 — honest to what the guard knows; blandest pool on the most frequent trigger | 2/7 — quirky lines on the most frequent trigger; lines assuming facts the trigger doesn't give |
| 4 | Yarn Spinner | **Skill** | 9/9 — line IDs, loss unnamed, lines only a beekeeper would say | 7/9 — no line IDs; an unprompted frost story |
| 5 | Review | Baseline, narrowly | Finds all four planted flaws; cleaner, shorter (1,021 vs 1,458 words) by the last run | Finds all four; better at the choice block as a system |

What the runs changed in the skill:

- **Run 1** — the handoff was long and full of process (checker output, test tables, boilerplate);
  reviews deleted a mislabelled option instead of fixing it; a pick leaned on invented props over the
  canon's own material; a new key namespace instead of the existing one; a house rule inferred from a
  false claim; first meetings not guarded against replaying; markup sparser than shipped lines; the
  checker missed the genre's stock barks. All fixed (`a7a225e`).
- **Run 2 (review)** — ~290 words of preamble and tool jargon before the first finding. Fixed: reviews
  open with a verdict and findings, in the owner's terms (`add417f`).
- **Run 3 (review)** — concise, but it dropped the system-level check of the choice block (an exit
  labelled *Leave* whose line refuses; no way to say yes). The reading tests now check the choice
  block as a whole. **Not re-run**: the plan's two iterations were spent.
