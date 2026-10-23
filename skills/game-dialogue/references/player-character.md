# Writing for the player character

How defined the protagonist is decides how their lines can be written, and how others may address
them.

## Which protagonist

| Model | Example | How their lines work | Main risk |
|---|---|---|---|
| Defined, voiced | Geralt (The Witcher 3) | A short option expands into an in-character line | Option and delivery drift apart |
| Semi-defined, voiced | Shepard (Mass Effect) | Tone-positioned paraphrase; a consistent core performance | Choosing by colour, not content |
| Player-authored text | Choice of Games, classic CRPGs | The option is the full first-person line | Gendered or assumed self-reference |
| Internal chorus | Disco Elysium's 24 skills | Inner voices comment and unlock options | Volume of text |
| Silent | Gordon Freeman | No lines; actions and choices | NPCs monologuing to fill the silence |

Find out which one the project has before writing anything the protagonist says or hears. A class or
origin system (pick a warrior, an outlaw, a scholar) sits on top of any of these.

## Option labels for a voiced protagonist

The rules in `interactive.md` → *Option text and the spoken line* apply in full. In addition:

- **Keep a core performance**: the character's range across options is one person's range — a
  restrained professional whose kind and ruthless lines both sound like them (Mass Effect's direction).
- **A defined protagonist may refuse** an option a player-authored one would take; say so in the
  option rather than surprising the player with the line.
- **A label that hides a commitment** (agreeing to a quest, a romance, a betrayal) is a broken label.

## The silent protagonist

- **NPCs react to an implied beat** instead of monologuing: "No need to look at me like that."
- **Give the personality to the supporting cast and the world**; the silent hero is the player's
  space.
- **Don't have NPCs explain the situation and the next step unprompted**, and don't force options
  that misrepresent what the player means (Matejka).
- **Embrace ambiguity**: the player fills the silence; don't fill it for them.

## Addressing a player-made character

When the player chooses name, gender, body or pronouns, NPCs need a way to address them that never
assumes.

- **Defaults**: second person; a title, role or epithet the character has earned in play; a fixed
  callsign or surname the game gives them (Shepard's surname, Cyberpunk's "V").
- **Never put a typed name in voiced lines.** Speaking typed names costs a pre-recorded name list
  (Fallout 4 recorded 1,259 names).
- **No gendered address outside an explicit variant**: sir, madam, ma'am, lad, lass, my lord, my
  lady, young man, good woman. English has no common neutral equivalent of "sir"; acknowledge rank
  or politeness another way. A "preferred form of address" chosen by the player is one solution
  (Fallen London).
- **Test the fallbacks.** A two-way switch whose default is "Sir" misgenders a non-binary character in
  every line.
- **First-person options** avoid gendered self-reference unless gated on the matching state.
- **Set `address: neutral`** in the voices file's `check` block so the checker flags gendered
  address.

## Variants by gender, class or origin

- **Whole-line variants, never word swaps.** Gendered grammar breaks when a single word is swapped
  by a variable, especially in translation — a neutral English line ("You must be exhausted") still
  needs *épuisé* or *épuisée* in French. Mark every line whose translation will depend on the
  player's or listener's gender, and give translators a full line per variant.
- **Use the engine's selection markup** where it exists (Yarn Spinner's `[select]`), not `if`
  branches around fragments: logic is not localised, line text is.
- **Pronoun choice separate from body and voice** where the game allows it (Starfield,
  Dragon Age: The Veilguard).
- **Class or origin sentences**: where a class or origin truly changes how someone sees the player,
  add **one sentence** to a shared line (a `{class}` placeholder filled per class) rather than
  writing a separate line per class. Only where the class actually changes something; everything
  else stays shared.
- **Identity reactivity sits on a shared spine**: origins change how characters treat the hero while
  the main plot stays one (Dragon Age: Origins).
- **Annotate speaker and addressee gender on every line** for translators, even when the English is
  neutral.
