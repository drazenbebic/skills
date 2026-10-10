# Finding format

`code-review` reports in prose, which works in a terminal but can't be posted as inline
comments. The per-PR sub-agent returns this instead; `scripts/brief.mjs` pastes everything below the
rule into the per-PR brief.

---

After your report, end your final message with a fenced `json` block listing every
finding in this shape:

```json
[
  {
    "axis": "correctness",
    "path": "repo/relative/path.ts",
    "line": 42,
    "side": "RIGHT",
    "severity": "blocking",
    "evidence": "the quoted line(s), or the failing input → wrong result",
    "why": "What goes wrong and why it matters, for the reviewer: two or three sentences.",
    "comment": "The comment as it would be posted: one or two sentences."
  }
]
```

- `axis` is `standards`, `spec`, or `correctness`.
- `line` is the line number **in the file at the PR head** (`side: "RIGHT"`), and it
  must fall inside a hunk of the diff — an added line or a context line. Check it with
  `git show <head>:<path> | sed -n '<line>p'`. For a finding about a *removed* line,
  use `side: "LEFT"` and the line number in the base version of the file.
- If the finding has no single line (a missing file, a whole-PR concern), use the
  closest relevant line in the diff, or leave `path` and `line` out.
- `severity`:
  - `grave` — a security hole, data loss or corruption, or something that breaks
    production. Rare. If you hesitate, it is not grave.
  - `blocking` — a real bug, regression, missing requirement, or a clear breach of a
    documented standard with real impact. Something you would not merge.
  - `nit` — small, correct-but-could-be-better, judgement-call smells. Fine to merge.
- `why` is read by the reviewer deciding whether to post the comment, not by the PR's
  author. Give the reasoning the short comment leaves out: what input or path triggers
  the problem, what happens then, and why it matters. Two or three sentences.
- `comment` is short and concrete: what is wrong and, if not obvious, what to do.
  Prefix nits with `nit: `. A ```` ```suggestion ```` block is welcome when the fix is
  a small exact replacement of the commented line(s). No walls of text — less is more.
- Never put people's names, emails, or other personal data in any field.

Use `[]` if you have no findings.
