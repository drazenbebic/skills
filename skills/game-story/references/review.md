# Review: the checker, reading tests, and what only people can judge

Model-written stories fail at the structural choices the craft protects, and model judges miss those
failures — rubric scores rank measurably less tense stories above New Yorker fiction (Spoiler Alert,
2026). So review here is a mechanical checker, structural reading tests and a probe for defaults —
never "this feels strong".

## The checker

`scripts/check.mjs` (Node ≥ 22, no dependencies) flags suspects in a bible or premise drafts. It never
edits anything.

```bash
node scripts/check.mjs <STORY.md>                    # the bible format: scan + structure
node scripts/check.mjs <story doc> --scan-only       # a project's bible in its own format
node scripts/check.mjs <premises file> --premises    # premise drafts
```

- **House rules** come from the `check` block in STORY.md (`references/bible.md` → *The template*):
  `scale`, `allow`, `ban`, `external`. Flags: `--scale S|M|L` overrides; `--ban a,b` and `--allow a,b`
  add.
- **The premises file**: one `### <id> · <generator>` block per premise, holding only the premise
  text. Text before the first heading, an empty block, or a file with no blocks is a usage error.
- Code fences and HTML comments are skipped (one left unclosed is a usage error, not a clean pass);
  the scan checks skip the Changelog, which records old names and reconciliations by design.
- Exit 0 clean (notes allowed), 1 findings, 2 usage error.

**Scan checks** — any file:

| Check | Level | Flags | What to do |
|---|---|---|---|
| `banned` | finding | A word the project bans | Rewrite; never argue with a ban |
| `default-name` | finding | Names models default to across vendors (Elias, Elara, Mara, Kael) | Use the setting's naming spec; `allow` only if canon really uses it |
| `stock-name` | note | Names on practitioners' AI-default lists (no counts) | Check it against the naming spec |
| `stock-setting` | finding | Lighthouses and their keepers, "Whispering …" names, "The Last Train" | Replace with the owner's particulars, or `allow` |
| `template` | finding | The model-default template in one entry: a quiet craft, a small place, a secret, light imagery | Rebuild from the owner's particulars |
| `stock-plot` | note | Chosen ones, prophecies, ancient evils, amnesia, last of a line | Keep only if the bible says why this game needs it and what it does differently |
| `world-stakes` | note | World-ending stakes | Give the threat a face: one met character and what they lose |
| `soft-villain` | finding | "Misunderstood", "just wanted to", redemption | The antagonist keeps a method and a counter-argument to the end |
| `soft-resolution` | finding | Festivals, heart-to-hearts, peace restored, reconciliation | The central conflict resolves through a costly action that changes world state |
| `stated-lesson` | finding | "The power of friendship", "what truly matters", "all along" | The ending enacts the controlling idea; nobody says it |
| `stock-word` | note | Tapestry, testament, the veil, the void, nexus | Say the specific thing |

**Structure checks** — the bible format only:

| Check | Level | Flags |
|---|---|---|
| `sections` | finding | A section the scale requires is missing |
| `legend` | finding | No status legend |
| `status` | finding | An entry without a known status |
| `ids` | finding | A beat or fact heading without its ID; an ID defined twice |
| `refs` | finding | An ID used but never defined |
| `beat-fields` | finding | A required beat field missing for the scale |
| `player-verb` | finding (M, L) | A beat's Player doesn't start with does, finds, chooses or watches |
| `watched-story` | note (M, L) | Most load-bearing beats are watched, not played |
| `fallback` | note (M) | A load-bearing beat with no fallback (a finding at L, under `beat-fields`) |
| `flags` | finding | A flag some beat needs that no beat sets and `external` doesn't list — a soft-lock or a missing beat |
| `flags-unread` | note | A flag set but never read |
| `reveals` | finding (M, L) | A must-know fact with fewer than two carriers; a fact that never reaches the player |
| `not-before` | finding | A fact revealed before its "not before" beat |
| `cast-fields` | finding | A required character or antagonist field missing |
| `cast-unused` | finding / note | A core (recurring) character who appears in no beat |
| `name-collision` | note | Cast names sharing an initial or nearly alike |
| `stance` | note | Two characters answering the theme question the same way |
| `promises` | finding (M, L) | A promise with no payoff, not cut or acknowledged |
| `peak` | finding | The last high peak before the final quarter — the climax is front-loaded |
| `theme-midpoint` | note (M, L) | No theme marked in the first half of the beat map |

**Premises mode** adds `too-alike` (two premises that are one idea twice) and `premise-count` (fewer
than two).

A finding is a **suspect**: fix it, or say why it stands. A clean run proves nothing about quality — it
only means none of these patterns appeared. The reading tests do the rest.

## Reading tests

Run these on every draft, and write down what each found.

1. **Delete a beat.** Does any later beat change? If not, it isn't in the chain.
2. **Name the turn.** Every beat's value, charge in and charge out.
3. **Who decides the climax?** The player character, by a choice or an act.
4. **The face.** Every large threat has one met character and one specific loss.
5. **The way out.** Every exit from a major jam uses something the player already has; no coincidence
   rescues anyone.
6. **The verbs.** Each major theme rides a verb, rule or world-state response; both contracts stated
   and compatible, or confronted.
7. **The midpoint.** The central question, the main relationship and the theme are legible by the
   middle; a payoff lands in the first session.
8. **After the peak.** Every peak but the last leaves a cost, loss, open question or changed
   relationship behind.
9. **Friction.** At least one adversarial tie survives the ending; no two core characters share a
   stance.
10. **The last encounter.** The antagonist still has a method and a counter-argument.
11. **Plausibility.** Could each plan actually work — at this scale, with these means, in this time?
    Why does the antagonist need the protagonist? Can one character, vehicle or night physically do
    what the climax asks?
12. **No new systems.** Does any beat need a mechanic the owner didn't describe? Then it is a design
    proposal with its cost, and the beat has a version without it.
13. **Tone on the page.** Do the synopsis and key scenes sound like the tone contract — the humour,
    the dread, the warmth it promises — or only describe it?
14. **Trace the particulars.** Every specific detail traces to the owner, an observed procedure or a
    named source — or is marked `proposed`.
15. **The swap.** Could the premise, a place or a character move to another game unchanged?
16. **The naming spec.** Every name obeys its culture's sounds and spelling.
17. **The promise ledger.** Every signalled choice and setup paid, cut or acknowledged.
18. **Every route holds.** No load-bearing beat needs a flag that only a skippable beat sets; every
    fallback sets what its beat would have set; every upgrade a beat claims as a story beat is read by
    one.
19. **Canon.** Every new fact is marked proposed; nothing contradicts a settled entry; every
    reconciliation tried before a retcon.

## The default probe

A model can't see its own defaults by looking at one draft, but it can see them across many. Sampling
many continuations from an outline and checking whether a planned beat is among the common ones turns
"is this the default?" into a procedure (one such score correlated with human surprise ratings at
0.55 — Echoes in AI, 2025).

1. For the premise, each load-bearing beat and the ending, list **ten ways a story like this usually
   goes** at that point, most likely first.
2. If the planned beat is among the most common, **replace it** with one that only this game's
   particulars could produce — or write down what earns the familiar beat here.
3. For tension, adapt a **named reference work's beat structure** to the new story before drafting
   beats: in one 2026 study it closed about half the gap in tension between frontier-model stories and
   New Yorker fiction (Spoiler Alert).

## Where models fail

The record is consistent across model families and generations, and the defaults come from preference
training, so newer models will not remove them, and switching models won't either.

| Failure | Evidence | Check |
|---|---|---|
| Climax and major setback front-loaded | Tian et al., EMNLP 2024 | Turning-point positions in the beat map; the largest reversal in the final stretch (`peak`) |
| Peaks resolved almost completely | Spoiler Alert: 22% of tension kept after a peak, against 54% for New Yorker fiction | Reading test 8 |
| One arc shape | Over half of GPT-4 stories were man-in-a-hole; tragedy nearly vanished | Arc chosen deliberately (`craft.md`) |
| Friendly casts | Relationship signs positive where human fiction's are slightly negative (Nonaka & Perry, preprint) | Reading test 9; `stance` |
| Festival or heart-to-heart resolution | Rettberg & Wigers; Wordcraft's writers | `soft-resolution`; a costly action that changes world state |
| The same names, settings and titles across vendors | 88% of 20,000 stories held one of 11 recurring tokens — "lighthouse" in 51% (Hamilton & Mimno, EMNLP 2026); "Elara" 85,513× its human frequency (Antislop, ICLR 2026) | `default-name`, `stock-setting`, `template`; the naming spec |
| Default beats | Echoes in AI; Spoiler Alert | The default probe |
| Accepting the first premise | Of 4,000 sampled ideas, 200 distinct (Si et al., ICLR 2025) | Generators and the cut (`premises.md`) |
| Theme stated aloud | Dramatron's professional writers | `stated-lesson`; `craft.md` → *Theme* |
| Softened antagonists | Wordcraft: reluctance to write people doing mean things | `soft-villain`; the antagonist sheet at the last encounter |
| Example leakage | Wordcraft put "Sarah", a name from its prompt examples, into every writer's story | This skill's examples use roles, not names; scan output for any name copied from an example |
| Soft audits and self-certification | Sycophancy (Sharma et al.); self-preference (Panickssery et al.); judges at 73% agreement with humans (LitBench) | Blind, checklist-first audits; no "original" or "tense" verdict from you |

**Telling the model what to avoid works poorly and can backfire** (Antislop; the "pink elephant"
effect), which is why the lists live in the checker and generation aims at positive targets.

## What only people can verify

Name the ones that apply, and never claim them yourself.

- **The owner's canon**: what is true in the world. New facts are proposals.
- **Playing it**: whether players can retell the story, whether the peak lands, where they skip —
  narrative playtests (`references/revision.md` → *Narrative playtesting*).
- **Tradition-bearers and consultants** for every borrowed culture, faith or lived experience —
  consulted early, not at the end.
- **Legal**: trademark and patent questions about names and borrowed mechanics need a qualified
  reviewer.
- **AI disclosure**: when AI-drafted story text will ship, storefronts may require disclosure (Steam's
  rules cover AI-generated content players consume). Raise it once, when content is about to ship.
