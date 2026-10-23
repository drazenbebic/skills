# Line types

What fires a line, and how often, decides more of its shape than what it says. Systemic lines are
chosen at runtime from game state and repeat; authored lines play once and can afford subtext and
length. Barks may state what is visible — they are feedback on a change in game state — while
cinematic dialogue should not (Hocking). Sourcing is strong for barks, hints and narrators and thin
for vendors, efforts and in-world signage; where it is thin, the rules here are reasoned from the
frequency rules, and say so.

## Before any line

Know five facts before drafting, and write them beside the line:

1. **Trigger** — the event, state or click that plays it.
2. **Frequency** — once, once per visit, per encounter, per minute.
3. **Speaker** — and listener; who else is in earshot.
4. **What the player sees** at that moment — and what they most likely just did.
5. **Interruptible?** — can combat, a menu or another line cut it off?

A line without a trigger and a frequency cannot be judged.

## Barks

Short lines an NPC speaks when an event fires: spotting the player, losing them, reloading, taking a
hit, finding a body.

- **One fact per bark** — the thing the player can act on. Each fact combined into a bark multiplies
  the variants needed (Dansky). One state change may carry an implied second layer (fear, fatigue)
  through delivery, not extra clauses.
- **Distinctiveness inverse to frequency.** The most frequent barks are heard most and must be the
  best — and the blandest. Save the quirky line for the rare trigger (Skyrim's "arrow in the knee", a
  walk-by guard line played constantly).
- **Honest to what the AI knows.** A guard who heard a noise does not say "the intruder". A bark keyed
  to a sound event plays wrongly when the guard is staring at what made it (Anderson, Mark of the
  Ninja).
- **Clarity over cleverness**: clever barks turn vague and grate on repeat.
- **Overgenerate**: write about 100 to keep 5–10 (Slabinski). No published standard says how many
  variants a trigger needs; size the pool so one line rarely recurs within a session, and mark any
  line that should play once.
- **Squad barks name names** and react to losses; it makes violence mean something (The Last of Us
  Part II).
- **Signature failure:** a memorable line on a common trigger.

## Ambient chatter

Lines NPCs say to each other or to themselves so the world feels inhabited.

- Kinds: thinking aloud; overheard banter cut from the middle of a longer conversation; everyday
  life; two people in the same job with opposite temperaments; rumours as carrots; reactions to the
  player; gameplay aids (Mikkelson).
- **Write from the verb** the NPC is performing — mending, haggling, waiting.
- **As subtle as possible** — ambient lines repeat; over-the-top quirks wear out first.
- **Rumours point at real content.** A rumour that sends the player nowhere is a bug.
- Don't give every NPC a full conversation, and don't project the writer's modern values onto an
  invented society.

## Companion banter

Companions talking among themselves or cutting into the player's conversations.

- **Opinions, on each other and on the player's choices.** Banter is how the player sees their own
  choices argued over (Gaider); companions who agree with everything are furniture (Avellone).
- **Resumable beats of 2–4 lines**, each a safe place to stop. Critical information never sits in a
  beat that can be cut off.
- **Explicit trigger conditions per line**, written so QA can test them — banter fails silently
  (Baldur's Gate 3 shipped ~1,500 lines for one companion that never fired).
- **Signature failure:** two conversations at once, or a beat lost to combat with no pickup.

## Quest-givers, objectives and journals

Three layers that do different jobs.

- **The quest-giver's line** is characterful but **states the ask once, in plain words**: want first,
  task clear, hook last. Lore comes after the ask, if at all.
- **The objective** is an imperative verb plus a target, under about eight words ("Find the
  miller's key"), updated on every state change, never drifting from what the player can observe.
- **The journal entry** recaps in a voice why the quest matters, so a returning player recovers what
  to do next.
- **Signature failure:** a lore dump before the ask; an objective the player can't map to the world.

## Hints and nags

The line type most criticised when its timing is wrong (Navi; God of War Ragnarök's companions
solving puzzles within seconds; Horizon Forbidden West patching out stash reminders).

- **A ladder**: silence and environmental cues → an observation naming the object of interest → the
  mechanic named → a near-solution.
- **Each rung gated on time and evidence of being stuck** — failed attempts, wandering, backtracking —
  never on time alone. No published timings exist; make them parameters.
- **Hard caps** on every nag line, and a frequency setting for the player.
- **Who speaks matters.** A companion's hint can read as their own curiosity; the player character
  muttering the answer reads as the game doing the player's thinking.
- **Signature failure:** the solution said aloud before the player has looked around.

## Narrators, death and retry lines

- A **reactive narrator** turns systemic events into story without interrupting play (Bastion:
  hundreds of lines cut that didn't improve play; no repeats unless the player repeats content).
- **Write to the performer's cadence** when a voice is cast.
- **Death and retry lines are the most-heard narrative lines** in roguelikes: spend the variant
  budget there, prefer unheard and state-specific lines, and limit each character to one
  conversation per visit (Hades).
- **Signature failure:** the same consolation after the fortieth death.

## Player-character self-talk

The protagonist commenting to themselves while exploring.

- **Rare observations, not solutions.** It speaks for the player, so ration it hard.
- Never comment on something the player can't yet see, and never tell them how to feel about it.
- **Signature failure:** the hero muttering the puzzle's answer, or narrating the stash again.

## Notes, letters and carvings

Found text written by a character: letters, diaries, audio logs, graffiti, messages scratched into
walls.

- **A scene, not a summary**: one writer, a specific moment, a stake (Levine calls audio logs
  confessionals).
- **Self-contained and order-independent**, unless the placement guarantees the order.
- **Written in the author's hand**: their education, their haste, their state of mind. A soldier
  scratching into rock writes short.
- **Ends cut off or on a turn**, not on a moral.
- **Core plot does not live only in optional documents.**
- **Signature failure:** a lore essay in a dying man's last note.

## Item and codex flavour

- **Function first, then one oblique fact** — what the object went through, never what comes next.
- **Scannable and skippable**, and accurate to the mechanics; keep mechanical text separate so a
  balance patch doesn't force a lore rewrite.
- Short fragments can carry a whole history across many items (the Souls games).
- **Signature failure:** lore the player is forced to read to understand the item.

## Boss and set-piece speeches

- The place for eloquence — earned by the hours before it.
- **Still a tactic**: the boss wants something from the player in this moment (to make them doubt,
  to bargain, to be understood), not to recite backstory.
- **Short enough to hold in a fight**, or staged where play stops; never crucial information mid-combat.
- A villain's menace is a **method** — the lie, the leverage, the truth used as a weapon.
- **Signature failure:** the monologue that explains the plot.

## Vendors and greetings

Pools by state — first meeting, repeat visit, can't afford, sold out, farewell, after a story beat.

- **Blandest where frequency is highest.** The greeting heard every visit must survive a hundred
  hearings; reserve character for the first meeting and for state changes.
- **Reflect state at entry and exit** — the cheapest visible reactivity.
- *Thin sourcing:* reasoned from the bark rules.
- **Signature failure:** a memorable greeting heard every hour.

## Efforts

Non-verbal vocal sounds — grunts, gasps, pain, exertion, death cries — listed in voice-over scripts.

- List them by **category and intensity** (light, medium, heavy; pain, exertion, fall, death).
- **Vocally stressful**: recorded last in a session, capped by union rules.
- *Thin sourcing:* no craft literature beyond scheduling; treat as production rows, not writing.
