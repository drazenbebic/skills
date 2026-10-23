# Interactive dialogue: structure, choices, state

Every choice that leads to unique content commits the writer to more content downstream, so a naive
tree grows exponentially. Working designs control that growth with structure and state.

## Choosing a structure

Ashwell's standard patterns (2015) are the shared vocabulary; real games mix them.

| Pattern | Shape | Buys | Costs |
|---|---|---|---|
| Gauntlet | Linear spine; side branches die or rejoin fast | Cheap; most content seen | The constraint shows |
| Branch and bottleneck | Branches rejoin at shared beats; state carries the difference | Personality with a manageable plot | Needs state; early runs feel alike |
| Time cave | Heavy branching, little rejoining | No state tracking | Most content unseen |
| Sorting hat | Early choice routes into one of several linear branches | Breadth and depth | Several games' worth of writing |
| Quest / open map | Modular clusters toward a few endings | Journeys, exploration | Fragmentary; heavy state |
| Loop and grow | The story loops to a hub; state opens options each pass | Replay with in-fiction logic | Needs a reason to repeat |
| Storylets | Content + prerequisites + effects, offered when conditions hold | Modular, multi-author, order-free | Needs volume; hard to pace |
| Salience pool | The most specific line whose conditions match plays | Thousands of contextual lines | Needs a fallback for everything |

Match the structure to the job:
- one NPC conversation that must reach a fixed beat → a hub written as branch-then-rejoin;
- personality-shaping arcs → branch and bottleneck with stats;
- exploration → quests or storylets;
- barks, chatter, roguelite reactions → salience pools.

**Every foldback must leave a flag or stat behind**, or the branch was cosmetic (Ashwell). Prefer
delayed branching; have every choice change a stat; reference specific past choices sparingly
(Choice of Games).

## Three options, three moves

At the scale of one conversation (Ingold, AdventureX 2018):

- **About three options.** Two reads as right-or-wrong; four loses focus.
- **Three different moves, not three tones**: **Accept** (cooperate with the topic), **Reject** (push
  back, attack), **Deflect** (change the subject, escape — not a joke by default). Other moves —
  ask, lie, bargain, comply, leave — work the same way; what matters is that each option *does*
  something different.
- **No filler options** that exist only to give the player something to click.
- **Loops** for conversations that circle at one intensity, with a **trapdoor** option that exits;
  a Reject may **reset** the loop to show how hard the NPC pushes back.
- **The NPC answers what the player actually chose**, and the player can always tell where they are
  in the conversation.
- **The NPC may refuse, run out of patience, or end the conversation** when their stakes are real.
- The good / neutral / evil triad trains players to pick by colour or slot, not content.

## Option text and the spoken line

When the player character speaks after a choice, the option's text and the spoken line must agree
(the Mass Effect wheel's paraphrases; Fallout 4's labels).

- **The option predicts both intent and tone** of the line. Write it as a verb plus an attitude —
  "Threaten him, quietly" — not a cryptic keyword ("Sarcastic").
- **The spoken line adds nothing the option didn't signal** — no threat, lie, commitment or reveal.
- **No two options resolve to the same line** unless the response or the state change differs.
- **Put each option beside its full line** when reviewing.
- In text-only games with a player-authored character, the option *is* the line; write it in full,
  first person.
- Ink can make the option the literal start of the spoken line: text before `[` appears in both, text
  inside only in the option, text after only in the output.
- **Silence is an option** — not answering, saying nothing, walking away — and can be the most
  expressive choice.

## Consequences

- **A promised consequence must pay off.** If the game signals that a choice is remembered, at least
  one later line reacts to it — or the signal is a lie (Telltale's "will remember this").
- **Expressive choices are legitimate** — choosing *how* to say something, with no plot change — as
  long as the game never pretends they are more.
- **A choice that matters costs something different on each route.** If every option ends in the
  same place, the choice is expressive, whatever the game claims. Name what each route gives up.
- **Failure is content.** A failed check, a refused bribe, a lost argument should yield something
  worth having: information, a complication, a better line.
- **Say up front** whether a check can be retried.

## State

What lets lines remember.

- **Flags and stats** set by choices and read later; name them for what they mean
  (`told_wren_truth`), declare them, and note where each is read. A flag set and never read is a
  dead promise; a flag read and never set is a bug.
- **Visit counts and once-only topics** hide exhausted options; a sticky "ask something else" or
  "leave" stays.
- **Relationship values** change the *cost* of persuasion rather than locking content (a trusting
  companion agrees with one line; a wary one needs a check — Baldur's Gate 3).
- **Skill checks** gate options: passive checks fire on their own and add insight; active checks
  roll. Say which, and what each result yields.
- **Cheapest visible reactivity**: vary a scene's entry (the greeting reflects what happened) and
  exit (the farewell reflects what was just said).
- **One-time scenes are guarded.** A first meeting or an ask plays once (a visit count, a once-only
  block, a flag set on entry); write the line that plays on the next visit — short, reflecting the
  choice — so the scene never replays and the character is never silent.

## Pools

For barks, chatter and any line chosen at runtime from many (Ruskin's rule-matched dialogue at Valve;
Hades' context-driven reactions):

1. **Write the generic fallback first** — the line that plays when nothing more specific matches.
2. **Add specificity in layers**: character → location → recent event → relationship → how many
   times this was heard.
3. **Each line is order-independent**, or its dependency is an explicit condition.
4. **Each line writes a memory fact** when it plays, so it doesn't repeat and running gags can
   escalate.
5. **Priorities**: story-critical lines outrank chatter; nothing critical in a line that may never
   win.
6. **Coverage**: list every trigger × condition, so a test can show which lines never fire.

## Interruption

Real-time conversations — walk-and-talk, radio, banter during play — must survive being cut off
(Oxenfree, Firewatch, God of War).

- **Beats of one or two lines**, each a safe place to stop, each with a **resume rule**: restart,
  skip, or drop.
- **Pickup lines** bridge back after an interruption ("As I was saying —").
- **Cut-off tails** end in a dash, for lines that can be interrupted mid-sentence.
- **Critical information early** in a beat, or repeated in its pickup.
- **Gate long conversations on calm states** — travel, riding, waiting — not combat.
- **Expire stale lines** rather than playing them late.
- **Tell the player** whether choosing an option interrupts the speaker or waits for a pause.

## Outlining

Map branches before polishing lines.

1. **A one-paragraph scene brief**: purpose; required beats; what the NPC wants; what the player
   might want; state read and state written.
2. **Choose the structure.**
3. **Sketch the graph or beat sheet** — nodes and choices only.
4. **Write the default path first**, then the variants.
5. **Reachability pass**: every node reachable, every flag set and read, no topic repeats, a fallback
   exists, every promised consequence pays off.
