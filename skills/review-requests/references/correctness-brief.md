# Correctness axis

`code-review` asks two questions — does the code follow the standards, and does it do
what the spec asked. Neither asks "does it work?", and in practice that is where the
findings that matter most come from: an inverted condition in a fix-up commit, a
uniqueness check scoped too narrowly, a prompt loop that never ends without a TTY.
This third axis exists to catch those. `scripts/brief.mjs` pastes everything below the
rule into the per-PR brief.

---

Look for defects the diff introduces — things that will behave wrongly at runtime, not
things that are merely unidiomatic. In particular:

- Logic errors: inverted or dropped conditions, off-by-one, wrong operator, wrong
  variable, early returns that skip needed work. Pay extra attention to the last
  commits ("address review", "fix: PR reviews") — fix-ups are where these slip in.
- Regressions: callers, siblings, or other consumers of a changed function, component,
  prop, route, or schema that now behave differently. Search for them at the PR head
  (`git grep <pattern> <head>`) — don't assume the diff is the whole story.
- Edge cases the change opens up: empty, null, a single item, many items, concurrent
  calls, non-interactive execution, a different tenant/locale/permission level.
- Security and data integrity: authorisation gaps, uniqueness or scoping checks that
  don't match how the data is later looked up, data loss in migrations, secrets.
- Generated or derived files edited by hand, or regenerated with unrelated churn that
  removes something still in use.
- Behaviour changes with no test where a test was clearly cheap to write.

For each finding, say how it fails: the concrete input or state, and the wrong result.
If you can't describe the failure, it isn't a finding. Verify by reading the code at
the PR head and drop anything you're unsure of. Zero findings is a good answer.
