# Review: checks, failures, and what only people can judge

The most damaging dialogue failures in shipped games were invisible on the page — a line heard too
often, a hint too soon, an option that didn't match its line, a quip in the wrong world. Review
simulates the running game. And because models are poor judges of their own writing, review is
concrete tests and selection between takes, never "polish until it feels right".

## The checker

`scripts/check.mjs` (Node ≥ 22, no dependencies) flags suspects a model reliably misses in its own
text. It never edits anything.

**The drafts file** — plain text, one block per take:

```
### miller-ask.A · Maren → player, deflecting
<the take's text>

### miller-ask.B · Maren → player, attacking
<the take's text>
```

- The **id** is the first word after `###`; the rest of the heading is free text.
- **Takes of one line share the id before its last dot** (`smith-ask.A`, `smith-ask.B`); a different
  prefix is a different line. Ids without a dot all count as one line. The cross-take checks compare
  only takes of the same line.
- Text before the first heading, or a file with no heading, is a usage error — never a clean pass.

**Run it** from this skill's directory, with the project's voices file:

```bash
node scripts/check.mjs <drafts file> --rules <path to VOICES.md>
```

Flags override the voices file: `--words min-max`, `--max-chars n`, `--address any|neutral`;
`--ban a,b` and `--allow a,b` add to its lists. Exit 0 clean, 1 findings, 2 usage error.

| Check | Flags | What to do |
|---|---|---|
| `length` | Words outside `words`; characters over `max-chars` | Cut, or split into beats |
| `banned` | A word the project bans | Rewrite; never argue with a ban |
| `stock-phrase` | Stock model phrasing ("a testament to", "barely above a whisper", the weight of an abstraction, "it's not X, it's Y") and the genre's stock barks ("Show yourself", "You can't hide forever", "trick of the light") | Replace with something only this character would say |
| `default-name` | Names models reach for (Elara, Elias, Mara, Lyra, Kael, Thorne…) | Use the project's naming; `allow` if canon really uses it |
| `named-emotion` | "I feel…", "I'm so angry/afraid…", "makes me feel" | Carry it with the subtext toolkit (craft.md) |
| `therapy-speak` | "I hear you", "it's okay to…", "closure" | Wrong register for almost any game world |
| `gendered-address` | Someone addressed as sir, madam, lad, lass… ("Welcome, lad.") under `address: neutral` | If it's the player: neutral address or an explicit variant |
| `placeholders` | Takes of one line using different `{placeholders}` | Every take must fill the same slots |
| `too-alike` | Takes of one line opening the same way or sharing most words | They are rewordings; write a different approach |
| `flat-rhythm` | A note: four or more sentences of near-equal length | Vary sentence length |

A finding is a **suspect**: fix it or say why it stands. A clean run proves nothing about quality —
it only means none of these patterns appeared. The reading tests do the rest.

## Reading tests

Run these on every draft, and write down what each found.

1. **Hide the names.** Could this line belong to anyone else in the cast? Then it isn't in voice.
2. **Mamet's three questions**: who wants what, what happens if they don't get it, why now?
3. **What did the player just do?** Does the line still hold after the most likely action — and after
   the least likely one the game allows?
4. **How often will it be heard?** Once, per visit, per minute? Does it survive the hundredth time?
5. **Cut the first and last sentence.** Better? Keep them cut.
6. **The choice block as a whole.** Every option — exits included — beside its spoken line: does the
   label predict the line's intent and tone? Can the player answer what was just asked (accept,
   refuse, ask more)? Does every branch lead somewhere, and does a repeatable option stop repeating?
7. **Register against setting.** Does every idiom belong in this world and this mouth?
8. **The joke test.** Is each joke this character's tactic, or a wink at the player?
9. **State preconditions.** What must be true for this line to play? Can it play when that isn't true?
10. **Canon.** Does any line introduce a fact the canon doesn't have, or reveal one earlier than the
    story bible's reveal schedule allows? List new facts as proposed canon; move early reveals.
11. **Read it aloud.** Stumbles, tongue-twisters, sentences no one could say in one breath.

## Anti-patterns

| Anti-pattern | Documented case | Check |
|---|---|---|
| Ludonarrative dissonance | BioShock: empathy asked for, harvesting rewarded (Hocking, 2007) | Does the line hold after what the player most likely just did? |
| Register mismatch | Forspoken's modern snark in a fantasy world (disputed) | Justify every contemporary idiom against setting and speaker |
| Tonal whiplash | Saints Row (2022): uneven tone | Mark each scene's emotional peak; the next line must not deflate it by default |
| Joke without a target | Borderlands 3's streamer parody (disputed) | Say in one sentence what the joke is about |
| Hint nag | God of War Ragnarök; Horizon's stash lines | Gate on stuck evidence, escalate, cap, offer a setting |
| Bark wear-out | Skyrim's "arrow in the knee" | Estimate plays per hour; distinctive lines on rare triggers only |
| Paraphrase mismatch | Fallout 4's dialogue wheel | Each option beside its full line |
| Overlap | Suicide Squad: Kill the Justice League's simultaneous conversations | List lines that can fire together; set priorities |
| Silent trigger failure | Baldur's Gate 3's ~1,500 lines that never fired | Every line has a testable trigger |
| Wall of text | Planescape: Torment's own late worry | Word counts per node; split or cut |
| "As you know, Bob" | Classic exposition | Does the listener already know it? Reroute it |
| Translation-hostile strings | Female characters self-referring in the masculine | Whole sentences, markup, speaker and addressee genders |
| Undercut sincerity | Quips after grief (Saints Row, Suicide Squad reviews) | No joke within a beat of a sincere peak unless it's a character's shield |

## Where models fail

Expert-judged studies of model-written fiction (Art or Artifice?, CHI 2024; the LAMP study, CHI 2025;
Too Good to be Bad, 2026; Cornell's 2026 name study) found the same failures across model families.
Each has a countermeasure in this skill.

| Failure | Countermeasure |
|---|---|
| Every character drifts into one default voice | The voice profile and samples in context; hide-the-names test; takes judged against samples |
| Characters name their emotions; subtext revealed instead of implied | The subtext toolkit; the `named-emotion` check |
| Therapeutic softness: apology, validation, conflicts resolved too fast | Status and tactic; no apology without a cost; the scene ends unresolved |
| Villains, liars and cheats go soft — menace without method | Specify the method of harm: the lie, the leverage, the false concession |
| Default names and settings (Elara, Elias, lighthouses) | The project's naming rules; the `default-name` check |
| Stock phrasing and clichés | The `stock-phrase` check; replace, don't reword |
| Unnecessary exposition | Exposition as ammunition; cut lines that do one job |
| Moralising, tidy endings | Leave on an open question; nobody states the lesson |
| Poor self-judgement: polishing one draft makes it smoother, not better | Varied takes, selected against concrete tests; the owner chooses |
| Variants that are rewordings of one idea | Takes as different approaches; the `too-alike` check |

## What only people can verify

Name the ones that apply to this handoff, and never claim them yourself. AI disclosure is raised once,
when lines are about to ship.

- **Hearing it**: a table read with actors or the team — the script's beta test.
- **Playing it**: long sessions with real players who get stuck, bored, or rush — where hint timing,
  bark frequency and overlaps show.
- **Tracing it**: narrative QA of every branch and state combination.
- **Native speakers** for every non-English line, and the translators' own questions.
- **Cultural and identity consultants** where a character draws on a culture, faith, disability or
  identity the team doesn't share — consulted early, not at the end.
- **Canon**: the owner decides what is true in the world; new facts are proposals.
- **AI disclosure**: on Steam, AI-generated content players consume must be disclosed (rules revised
  January 2026); whether heavily rewritten AI drafts count is unsettled. Flag it; the owner decides.
