---
name: game-dialogue
description: Write, revise or review anything a game character says or writes inside the world — conversations, NPC lines, barks, companion banter, boss speeches, quest-giver text, notes, letters, carvings, item flavour text — and build the voice profiles that keep each character consistent. Use this whenever a game needs lines for a character, a dialogue tree or choices, a bark or chatter pool, a character's voice pinned down, or a critique of existing game dialogue, in any engine or format (Ink, Yarn Spinner, a string catalog, a spreadsheet) — even when the request is just "write what the smith says", "give the guards something to say" or "make this NPC sound less flat". Not for UI, menu or tutorial text.
compatibility: The bundled checker needs Node ≥ 22 (no dependencies).
---

# Game dialogue

A game line is not a sentence on a page. It is a line **in its runtime context**: what triggers it,
how often the player hears it, who says it to whom, what the player just did, whether it is voiced,
subtitled, translated, or cut off mid-sentence. The best-documented dialogue failures in shipped games
were invisible in the script — a guard line heard a thousand times, a companion solving the puzzle
in seconds, an option that didn't match what the hero said, modern snark in a fantasy world.

Language models fail exactly where the craft is hardest: they drop subtext, name feelings, flatten
every character into one voice, soften villains, reach for the same few names, and are poor judges
of their own drafts. So this skill works from the **project's canon and the character's own lines**,
drafts **takes that differ in approach**, and selects between them with **concrete, checkable tests**
— a mechanical checker plus reading tests — instead of polishing one draft until it feels right.

## Ground rules

- **The project's rules beat this skill's defaults.** Its canon, style decisions and existing lines
  are the authority. A default here (line length, address, options per choice) applies only where the
  project is silent. If a project rule looks like a mistake, say so — and still follow it.
- **No character without a profile.** Load their voice from the voices file, or build one from canon
  and their existing lines before drafting.
- **Takes, not one draft.** For an authored line, 2–3 takes that try different approaches — a
  different tactic, a different move, a different thing withheld. Rewordings are not takes.
- **Drafts first, files after.** Show takes to the owner; write into the project's files only after
  they choose. "Just write it in" skips the drafts.
- **Never certify.** Don't call a line finished, authentic or canon. Deliver drafts, and name what only
  people can verify: playtest, table read, native speakers, consultants, the owner's canon.
- **Other languages are composed natively** and always flagged for a native speaker's check.
- **If you can't ask** (running unattended, or the owner said not to), write each question with the
  assumption you made, and continue.

## Modes

Pick from the request:

| Mode | When | Steps |
|---|---|---|
| **write** | New lines | 1–7 |
| **revise** | Rework existing lines | 1–7, with the current line as the baseline every take must beat |
| **review** | Critique only | 1, 3, 5, 6 — findings with suggested rewrites; change nothing without approval |
| **voice** | Build or update profiles | 1, 3 |

In **revise** and **review**, fix what is broken and keep what the scene was for. A mislabelled
option gets an honest label or a line that matches it — it isn't deleted; the player keeps every way
of responding the scene offered, unless removing one is the point of the finding.

Scale to the request. One shopkeeper greeting doesn't need a 20-question intake; a companion's
introduction does. But every mode reads the project first and runs the checks.

## Workflow

### 1. Read the project

Before anything else, find:

- **Canon**: story, lore, plot or character docs (`docs/`, a wiki export, a GDD's narrative
  section); a glossary; settled design decisions about text.
- **The voices file**: `VOICES.md`, usually beside the narrative docs. If it exists, its house rules
  and profiles are binding.
- **Existing lines**: every file text lives in — catalogs, scripts, spreadsheets, content data —
  and the lines of every character you'll write for.
- **The format**: keys, placeholders, markup, variants, how speakers are tagged (`references/production.md`
  → *Learn the project's format first*).
- **House rules**: banned words, names never spoken, length rules, address rules, where text may and
  may not come from, rating limits, tone.

Record the house rules in the voices file's `check` block (what the checker can test) and its prose
rules (what it can't) — see `references/voices.md` → *The voices file*. If the project has no voices
file yet, propose one with what you found.

Say in a line or two what you read and which rules bind this request.

### 2. Brief each line

For every line or pool, settle:

- **Speaker → listener** (and who else is in earshot).
- **Trigger and frequency**: once, per visit, per encounter, per minute.
- **What the speaker wants** from the listener, now.
- **What the player knows** at this moment, and what they most likely just did.
- **Line type** — then open its section in `references/line-types.md`.
- **Medium and budget**: voiced or text; box, subtitle or word budget; interruptible or not.
- **State**: what the line reads (class, choices, flags) and what it writes.

Find what you can in the project. Ask the owner only what you can't find, in **one batched
question**. Only three things are worth stopping for: **who** speaks, **when**, and **what the line is
for**. Assume the rest and say what you assumed.

### 3. Load or build the voice

- **Profile exists** → read it, and the samples. Keep them in front of you while drafting.
- **No profile** → build one (`references/voices.md`): from the character's existing lines first,
  then canon, then the intake list. Quote 5–10 of their lines as samples.
- **Show a new or changed profile to the owner.** It goes into the voices file only after they
  approve; you may draft from it as proposed in the same reply.
- For several speakers, check the roster: who could each be mistaken for?

### 4. Draft takes

- **Start from the want**: who wants what, what they'll do to get it, who has the upper hand, what
  they won't say (`references/craft.md`).
- **Mine the canon before inventing.** The strongest line usually turns a fact the canon already
  holds into the character's tactic — the thing they built that failed, the thing they won't name.
  Invent a specific detail only where the canon has none; every invented detail is proposed canon.
- **Exposition is ammunition**; feelings are shown, not named; humour is a tactic.
- **Apply the line type's rules**: one fact per bark, blandest where most frequent, escalating hints,
  resumable banter beats, a plain ask from a quest-giver (`references/line-types.md`).
- **Interactive scenes**: choose a structure, outline, write the default path first, then variants;
  three options as three different moves; option text that predicts its line
  (`references/interactive.md`). Player-character lines and address follow
  `references/player-character.md`.
- **Authored lines**: 2–3 takes, each a **different approach** — name the approach in the take's
  heading ("deflecting", "goes on the attack", "says too much").
- **Pools** (barks, chatter, greetings): the variants are the takes. Write the generic fallback first,
  then specific ones; overgenerate and keep the best.
- **Write in the project's format** — its keys, placeholders and markup — so the owner sees what
  would land.

### 5. Check

1. **Write the takes to a scratch drafts file** — one `### <id> · <heading>` block per take. Takes of
   one line share the id before its last dot (`miller-ask.A`, `miller-ask.B`); pool variants share
   the trigger (`noise.1`, `noise.2` …). Put only the words the player reads in each block — no keys,
   no tags, no stage directions.
2. **Run the checker** from this skill's directory:

   ```bash
   node scripts/check.mjs <drafts file> --rules <path to the project's VOICES.md>
   ```

   Without a voices file, pass the rules as flags (`--words`, `--ban`, `--address`, `--max-chars`).
   Fix each finding or say why it stands; re-run until only justified findings remain. What the
   checks mean: `references/review.md` → *The checker*.
3. **Run the reading tests** (`references/review.md` → *Reading tests*): hide the names; Mamet's three
   questions; what did the player just do; how often is this heard; cut the first and last sentence;
   the choice block as a whole (every label against its line, every question answerable, every
   branch leading somewhere); register against setting; the joke test; state preconditions; canon;
   read it aloud.
4. **Choose.** Rank the takes against the brief and the tests. Don't merge the best bits of three
   takes into a fourth smoother one — that's how voices flatten.

### 6. Present

The owner reads lines, not process. Give them, in this order:

1. **What you read** and the house rules that applied — one or two lines.
2. **The profile**, if new or changed — compact.
3. **The takes**, each with its approach named, in the project's format.
4. **Your pick and why** — which test it wins on, in a few sentences.
5. **What the checks changed** — only findings that changed a line or still stand, one line each. A
   clean run is one line ("checker: clean"), not a table; never list tests that found nothing.
6. **Open items**, only those that apply:
   - new facts the lines introduce, as **proposed canon** for approval;
   - lines in other languages, **for a native speaker's check**;
   - what only a **playtest or table read** can judge (frequency, timing, overlap);
   - **consultation flags** for cultural or identity content;
   - questions you couldn't ask, with the assumption you made.

Everything the owner needs to judge is **in the reply** — a payoff sketch, a table, a proposed voices
file's rules — not only in a file you mention. Keep the reply shorter than the lines it presents.
Speak in the owner's terms: say what a test found ("anyone in the cast could say this"), not the
test's name, and don't name this skill's tools or files unless the owner asked about them. Raise AI
disclosure once, when lines are about to ship (step 7), not in every reply.

A **review** opens with a one-line verdict, then the findings ordered by severity — each quoting the
line, saying what breaks in play, and giving the replacement line — then the revised scene, then open
items. What you read goes in one line at most; a voice profile appears only if the owner asked for
one (offer it in one line); the checker's output and the tests you ran stay out.

### 7. Write it in

After the owner picks or edits:

- Write the chosen text into the project's own files, keys and placeholders, matching the
  surrounding entries exactly — the owner's edits verbatim.
- New IDs and keys extend the nearest existing pattern (a new line for the smith goes under the
  smith's keys); never renumber or reuse old ones.
- If the lines are AI-drafted and will ship, mention once that storefronts may require disclosure
  (`references/review.md` → *What only people can verify*).
- Update the voices file if a voice moved or a rule was settled (shown first, as in step 3).
- Run the project's own checks if it has any (content validation, tests that load strings).
- Say what changed, file by file.

## Which reference

| Task | Open |
|---|---|
| Any line: want, subtext, exposition, emotion, humour, length, scene shape | `references/craft.md` |
| Dialect, period speech, invented swearing | `references/craft.md` → *Dialect and period speech* |
| A character's voice, the intake questions, the voices file | `references/voices.md` |
| Barks, ambient chatter, companion banter | `references/line-types.md` |
| Quest-givers, objectives, journals, hints | `references/line-types.md` |
| Narrators, death lines, self-talk, notes, carvings, item flavour, boss speeches, vendors, efforts | `references/line-types.md` |
| Choices, branching, state, consequences | `references/interactive.md` |
| Bark and chatter pools, rule-matched lines | `references/interactive.md` → *Pools* |
| Walk-and-talk, interruptions | `references/interactive.md` → *Interruption* |
| What the player character says; addressing a player-made character; gender, class or origin variants | `references/player-character.md` |
| The project's format, voice-over scripts, subtitles, text boxes | `references/production.md` |
| Localization, other languages | `references/production.md` |
| Ink, Yarn Spinner, Fountain, spreadsheets | `references/production.md` |
| The checker, reading tests, anti-patterns, AI failure modes | `references/review.md` |
| What to hand back as unverified | `references/review.md` → *What only people can verify* |
