# Production: formats, voice-over, screens, languages

What turns a good line into one that ships: the project's format, the recording booth, the screen,
and every language it will be read in.

## Learn the project's format first

Most games have a format already — a string catalog, a scripting language, a spreadsheet, a
dialogue database. Learn it from the existing lines before writing a word, and never invent a format a
project already has.

- **Where text lives**: a catalog of keys and strings, script files, a spreadsheet, a database export.
  Is display text in content files, or only keys pointing at a catalog?
- **Keys or IDs**: their shape (`npc.role.stage`, `m01-a02-lan01`, `#line:gate001`) and who makes
  them. A new key extends the nearest existing namespace (another line for the same character goes
  beside theirs), never a new one. Never renumber or reuse an ID once it exists.
- **Placeholders**: `{name}`, `{$var}`, `%s` — which are allowed, and what fills them.
- **Markup**: emphasis, colour, pauses, portraits, speaker tags — copy what existing lines do,
  including how much of it they use (if shipped lines mark three to six phrases, one is too few).
- **Variants**: how the project branches by class, gender, state or choice (whole-line variants,
  select markup, separate keys).
- **Length rules** the UI or a design decision sets.

Write drafts in that format, so the owner sees exactly what will land.

## Voice-over scripts

Game VO is recorded out of order, fast, from rows in a spreadsheet; every row must stand on its own
(Chandler).

| Column | Holds |
|---|---|
| ID | Stable, frozen before recording; never a row number |
| Speaker | Spelled the same everywhere, so filters work |
| Addressee | Who they're speaking to (and genders, for translators) |
| Line | Spoken text only — no directions, no parentheticals |
| Context | The situation and the preceding line or event |
| Direction | A playable verb — intimidate, comfort, tease — not "sound funny" |
| Emotion | A controlled value from a short list (calm, angry, afraid…) for batching |
| Intensity | Whisper, normal, shout — sessions group by volume |
| Effect | Radio, echo, muffled |
| Notes | Pronunciations, alternates, what's interruptible |

- Actors often arrive knowing little about the game: context is the performance.
- Write **alternates** for systemic lines; the same line may need separate exertion and calm reads.
- **Efforts** (grunts, pain, deaths) are listed by type and intensity and recorded last.
- Export as **TSV**, not CSV — dialogue contains commas.
- Session length ≈ total words × takes ÷ words per minute (Crawford); 2–3 takes a line is typical.
- Temporary text-to-speech VO is worth having to test timing and triggers before recording.

## On-screen text and subtitles

| Rule | Value | Source |
|---|---|---|
| Lines per subtitle | 2 (3 only exceptionally) | GAG; Xbox XAG 104 |
| Characters per line | 38 (Hamilton); ≤ 40 (GAG, XAG); 42 (Netflix) | |
| On screen | ≥ ~1 s per line, ~2.5 s per full subtitle | Hamilton |
| Reading speed | 160–180 words a minute; ≤ 17–20 characters a second | BBC; Netflix |
| Speaker label | At every change of speaker; colour never the only cue | XAG 104 |
| Text blocks | ≤ 80 characters a line (≤ 40 CJK) | XAG 101 |

- **Break lines by sense**: after punctuation, before conjunctions or prepositions; never split an
  article from its noun or a name from a surname; prefer a bottom-heavy pair (Netflix).
- **A box's budget is an input**, never assumed: it depends on the font, the box and the language.
  Ask or measure. Hand-break lines where the engine does not.
- **A box is one thought** ending at a natural pause, so the player's advance press falls on a beat.
- **Typed-out text** (letters appearing one by one) pauses on commas and full stops; punctuation is
  pacing.
- **Plain language** is an accessibility rule: 14% of US and UK adults read below age eleven (GAG).
- An over-long subtitle is the writer's problem — tighten the line until it splits cleanly at a
  clause.

## Localization

- **Text grows** in translation, short strings most (IBM via W3C):

  | English length (characters) | Translated length |
  |---|---|
  | ≤ 10 | 200–300% |
  | 11–20 | 180–200% |
  | 21–30 | 160–180% |
  | 31–50 | 140–160% |
  | 51–70 | 151–170% |
  | > 70 | ~130% |

- **Whole sentences only.** Never build a sentence from fragments in code ("You found " + item +
  "!"): word order, case and agreement change across languages. Use named placeholders the
  translator can move.
- **Plurals and gender through markup** (`[plural]`, `[select]`, ICU MessageFormat), never
  `if count == 1`. English has two plural forms; Russian and Polish four; Arabic six; Japanese one.
- **One English word, several roles, several IDs**: "Attack" as a button, a stat and a shout are three
  strings.
- **Context on every line** for translators: speaker, addressee, both genders, the situation. A
  missing addressee gender is how a female character ends up speaking of herself in the masculine.
- **Annotate puns, wordplay and references** with their function, so a translator can replace rather
  than translate them.
- **Don't abbreviate to fit a box**; other languages may have no abbreviation.
- Lean English: lines no denser than they need to be make dubbing's timing limits (±10% of the
  source length, or exact) reachable.

## Writing other languages

When a project writes text in another language (inscriptions in a local language, a bilingual
script, a second launch language):

- **Compose it natively** in that language, in the character's voice and register — never a
  word-for-word translation of an English draft.
- **Keep to the project's conventions** for that language (script, spelling standard, dialect).
- **Flag every non-English line for a native speaker's check**, every time — the skill never presents
  it as final.
- When English sits beside it (a translation under an inscription), write the English to match the
  original's brevity and register, not to explain it.

## Ink

inkle's plain-text scripting language. Knots (`=== name ===`) and stitches (`= name`) hold content;
`->` diverts; `*` choices disappear once used, `+` choices stay; `-` gathers rejoin branches; `~` runs
logic; `{a|b}`-style alternatives make sequences, cycles (`{&a|b}`) and shuffles (`{~a|b}`); `#` tags
carry metadata the game reads. Text before `[` in a choice appears in both option and output, text
inside only in the option, text after only in the output. Speaker names are a convention the game
parses (`Name: line`). Ink has no built-in line IDs; an `#id:` tag is a common convention.

```ink
VAR met_guard = false
-> gate

=== gate ===
Guard: {met_guard: Back again.|Halt. State your business.} #id:gate_001
~ met_guard = true
* [Ask about the curfew.] Player: When does the curfew lift? #id:gate_002
    Guard: When the Guild says it lifts. #id:gate_003
* [Offer coin.] -> bribe
+ [Leave.] -> END
- Guard: Move along. #id:gate_004
-> END

=== bribe ===
Guard: Put that away before someone sees. #id:gate_005
-> END
```

## Yarn Spinner

Yarn Spinner 3: nodes with a `title:` header between `---` and `===`; `Name: line` speaker lines;
`->` options with indented bodies, optionally `<<if …>>`-gated; `<<declare>>`, `<<set>>`,
`<<if>>/<<elseif>>/<<else>>/<<endif>>`, `<<jump>>`, `<<detour>>`; `<<once>>` blocks; `=>` line groups
(the engine picks one — for barks); `{$var}` inline. **Every line gets a `#line:` ID** — the tools need
them to build a strings file for translation. Use `[select]` and `[plural]` markup for gender and
number: `<<if>>` logic is not localised, only line text is.

```yarn
title: Gate
---
<<declare $pc_pronoun = "nb">>
<<once>>
    Guard: Halt. State your business. #line:gate001
<<else>>
    Guard: Back again. #line:gate002
<<endonce>>
-> Player: When does the curfew lift? #line:gate003
    Guard: When the Guild says it lifts. #line:gate004
-> Player: (Offer coin.) #line:gate005
    <<jump Bribe>>
-> Player: Never mind. #line:gate006
Guard: [select value={$pc_pronoun} m="He's" f="She's" nb="They're" /] trouble, that one. #line:gate007
===
title: GuardIdle
---
=> Guard: Cold night for it. #line:idle001
=> Guard: Keep your hands where I can see them. #line:idle002
=> Guard: Heard the Guild raised the toll again. <<if visited("Gate")>> #line:idle003
===
```

Neither example has been compiled; check against the project's version of the tool.

## Fountain and spreadsheets

- **Fountain** — plain-text screenplay format — suits linear cinematics: a character name in capitals
  on its own line, dialogue beneath, parentheticals in brackets.
- **Spreadsheets** suit everything systemic: one row per line, the VO columns above, plus trigger and
  conditions for barks and pools.
- **articy:draft, Chat Mapper** and similar are graph databases that export to engines and to
  spreadsheets for VO and localization; write to their export shape when a project uses one.
- **Godot's Dialogue Manager** uses a line's own text as its translation key unless the line carries
  an explicit `[ID:…]`: editing an un-IDed line orphans its translations.
- The lowest common denominator across tools: `Speaker: text #tags`, with every piece of metadata in
  tags and none inside the spoken text.
