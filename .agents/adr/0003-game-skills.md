# 0003 — Game skills

Status: accepted

## Context

`game-dialogue` is the first skill here about making games rather than running software, and more are
likely: narrative design, interface text, localization, design itself. They need a naming pattern
that groups them, and a shared answer to a question the engineering skills never faced — a game's
words are bound by its own canon and house rules, which differ from game to game and often contradict
general craft advice. Ponor, the first game it runs on, writes village lines of 80–120 words; the
general guidance is 15–30.

## Decision

- **Names are `game-<discipline>`**: `game-dialogue` first; later, for example,
  `game-narrative-design`, `game-ui-text`, `game-localization`.
- **"Dialogue", not "dialog."** It is the industry's spelling, and "dialog" usually means a UI dialog
  box — the territory of a future `game-ui-text`.
- **A game skill reads the project first, and the project's rules win.** Its canon, glossary, style
  rules and existing text come before the skill's defaults; a default is what applies when the
  project is silent.
- **Working files live in the game's repo.** What a skill builds up about a project — `game-dialogue`'s
  voices file — sits beside the project's own docs, shown to the owner before it is written, never
  inside the skill.
- **The evidence lives in `.agents/research/`**, unlinked from the shipped skill. A skill's references
  are condensed rules with short source names; the research report holds the full sources.

## Why

- **One prefix sorts the family** in a listing and tells a reader what the skill is for before they
  open it, the way `nextjs-` does for the audit.
- **A game's canon is the authority.** A skill that applied its own defaults over a project's settled
  decisions would be wrong exactly where the project has thought hardest.
- **Per-project knowledge must survive sessions.** A voice re-derived from scratch each time drifts; a
  file in the project is what keeps the next session, or the next writer, on the same voice.
- **Skills are installed from skills.sh, which copies only the skill's folder.** Anything the skill
  links outside that folder is a dead link once installed, so the evidence stays out.

## Consequences

- A game skill's first step is always discovery in the project: where the canon is, what the house
  rules are, what format the text lives in.
- A game skill writes into the user's game repository (with approval), which the engineering skills
  never do.
- Updating a skill's rules means checking them against `.agents/research/`, and adding to it when a
  rule has no source.
