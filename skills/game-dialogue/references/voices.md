# Voices: profiles and the voices file

A character's voice is decided on paper before their first line is drafted (Riot's champion
process: backstory, personality and goals settled first, then a personality deck, a roster
comparison, sample lines and a casting sheet). The profile is that paper. It is the handoff that keeps
a voice stable across writers and sessions — a voice handed over without one drifts (Gaider passing
a companion to another writer, who struggled to find it).

## Before writing a character

Find the answers in the project first — canon docs, the character's existing lines, the glossary —
and ask the owner only what is missing, in one batch. Where the project keeps a story bible
(`STORY.md`), its cast entry holds who the character *is* — want, weakness, Lie, arc, stance, their
signature detail, what they know and when — so take those from it rather than restating them, and use
this list for what the bible leaves to you: how they speak. The signature is often where a voice
starts. The must-knows are marked **(!)**; for the rest,
assume and say so.

1. **(!)** Who are they, in one line, and what is their role in the game (vendor, companion, villain,
   quest-giver, narrator)?
2. **(!)** What do they want — consciously, right now and over the game?
3. What do they need (the truth that would disprove their lie), and what wound made the lie
   (Weiland's Wound → Lie → Want → Need)?
4. What do they hide, and from whom?
5. What should the player feel about them, and how does that change over the game (Gaider wrote a
   companion players could not fully trust, and did not require her to be likeable)?
6. Where do they stand socially — class, trade, education, region, age — and how does that show in
   their speech (Egri's physiology, sociology, psychology: know it all, state none of it)?
7. How formal are they by default, and what raises or lowers that?
8. What is their outlook, in a sentence or two?
9. What topics do they keep coming back to? What do they avoid?
10. What habits mark their speech — sentence length, vocabulary field, tics, forms of address?
11. What would they never say?
12. How do they talk under stress — what breaks first?
13. Who in the cast might they sound like, and how do they differ?
14. How do they speak to each important person — up, down, intimate, wary?
15. What changes in them over the game, and what never does?
16. Do they lie? About what, and how well?
17. Is the game voiced? Who is cast, or what voice type is wanted?
18. **(!)** Which existing lines are theirs? (They outrank everything above.)
19. Are there culture, identity or period questions a consultant should see?
20. What may the writer invent about them, and what must come to the owner as proposed canon?

## The profile

One block per character. Fields marked *core* never change; *arc* fields may change with the story,
and each change needs a cause the player sees.

```markdown
## <Name>

- **Core** *(core)*: one line — "<adjective> <role> who <want>, <the complication>".
- **Want / need / lie / wound** *(arc: want, need; core: wound)*: one line each — or
  `STORY.md → <Name>` where the story bible holds them.
- **The player should feel** *(arc)*: e.g. trust → unease → pity, by act or stage.
- **Register** *(core baseline, arc shifts)*: where on formal ↔ colloquial; up with whom, down with whom.
- **Attitude** *(core)*: outlook in a sentence or two.
- **Topics** *(core)*: sought — 3–6; avoided — 3–6.
- **Quirks and diction** *(core)*: sentence length; vocabulary field (a trade, a faith, a region);
  rationed tics; forms of address; profanity level.
- **Never says** *(core)*: words, phrases or moves outside this voice.
- **Under stress** *(core)*: what breaks — length, register, composure, honesty.
- **Lies** *(arc)*: what they lie about and their tell.
- **Sounds like / differs from** *(core)*: the cast member at risk of overlap, and the difference.
- **To whom** *(arc)*: see "Who they are talking to".
- **Casting** *(core)*: age, voice type, accent (performed, never spelled), pronunciations. Voiced games only.
- **Samples**: 5–10 lines across neutral, angry, afraid, lying, tender, and a bark — quoted from the
  game where they exist.
```

Hedlund's four independent axes — **register, attitude, topics, quirks** — are the fields that make
voices distinct. Two characters may share a register and still sound different if the other three
differ. Try to satisfy as many axes as possible in each line, and keep lines short.

## Who they are talking to

Speech changes with the listener, and forms of address are rarely symmetric, so map relationships as
**ordered pairs** — A speaking to B — not as a grid of mutual feelings.

| Speaker → listener | Register | Address | What they want from them | What they won't say to them |
|---|---|---|---|---|
| … | … | … | … | … |

- Note the pairs that get special lines (one character's lines change when another is present).
- Banter between companions is where the player sees their own choices argued over (Gaider);
  give each pair a disagreement.

## Building a profile from existing lines

Where a character already has lines, those lines are the voice. Derive the profile from them; never
contradict them. A story bible's placeholder line for a character is a seed for the voice, not a
sample: replace it once the profile exists.

1. **Collect every line** the character has — script files, string catalogs, story docs, the novel
   if there is one — and note where each sits in the story.
2. **Mark what recurs**: sentence length and rhythm, favourite words and images, how they address
   people, how they open and close, what they joke about, what they never mention.
3. **Name their tactics**: does this character deflect, attack, over-explain, bargain, go quiet?
   Under what pressure does that change?
4. **Find the movement**: how the lines change from first to last, and what in the story causes it.
5. **Quote 5–10 lines as samples**, verbatim, chosen across moods.
6. **Run the cover-the-names test** on the samples against two other characters: if a sample could
   belong to someone else, it is not a good sample.
7. **Show the profile to the owner** before writing it to the voices file.

## The voices file

One file per project, beside its narrative documents (where the canon, lore or story docs live),
named `VOICES.md`. Look for it by name before writing any character. If none exists, propose the
location and create it only after the owner approves its contents.

````markdown
# Voices

<!-- Maintained with the game-dialogue skill. Canon: <path to the canon doc>. This file is the
writer's tool; where it disagrees with canon, canon wins and this file is fixed. -->

## House rules

```check
ban: <words no in-world text may use, comma-separated>
allow: <names or phrases the checker's built-in lists would flag but the canon uses>
words: <min-max words per line, if the project sets a length>
max-chars: <characters per line or box, if the UI sets one>
address: <any | neutral>   # neutral when the player character is player-created
```

- <Prose rules the checker cannot check: tone, what may never be revealed (or a pointer to the story
  bible's reveal schedule, STORY.md → Reveals, instead of a copy), who may never be named,
  where text may come from, markup and placeholder conventions.>

## <Name>
<profile>
````

- **`check` keys** are exactly `ban`, `allow`, `words`, `max-chars`, `address`; `#` starts a comment.
  Lists are comma-separated, and `ban` and `allow` may repeat — one line per source, each adding to
  the list; `words` is `min-max`; the other keys appear once. Anything else is a usage error. Leave out
  a key the project has no rule for.
- **House rules come from the project**: its canon, style guide and settled decisions. Give each
  rule its source in a comment (`# story bible, §4`). A rule you inferred rather than read is marked as
  an inference and checked against the lines it claims to describe — or left out.
- **`address: neutral` is for a player-created protagonist** (chosen name, gender or pronouns). A
  defined protagonist, or one defined by class, gets `any`.
- **Update the file** when a new line shifts a voice (an arc moving on) or a new rule is settled —
  shown to the owner, like the first version.
