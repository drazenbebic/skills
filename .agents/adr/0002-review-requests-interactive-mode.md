# 0002 — review-requests has an interactive mode

Status: accepted

## Context

`review-requests` ends with an approval or a change request posted on GitHub in
the user's name. It started with one rule: asking for the skill is permission to
post, and a dry run is the only way out. That makes an unattended run over a
whole queue possible, but it leaves two bad choices. Either the user trusts every
comment the agent drafted, or they get a dry run and have to post by hand.

What was missing was a middle option: see each comment before it goes out, and
keep it, drop it, or write a different one.

## Decision

The skill has three modes: **non-interactive** (post directly), **interactive**,
and **dry run**. If the request already says which, the skill uses that.
Otherwise it asks once, before it builds the queue.

In interactive mode:

- **Reviewing doesn't change.** The sub-agents still run unattended and in
  parallel. The walkthrough starts only when every PR has been reviewed,
  verified, and drafted.
- **One question per comment.** The user sees the code from the PR head, the
  reasoning (`why`, a new field on every finding), and the drafted text, and
  picks post, skip, post the rest of this PR, or write their own. PRs with
  nothing to comment on are settled in one batched question.
- **The user's own text is posted exactly as written.** The agent doesn't
  reword, translate, or prefix it.
- **The verdict is worked out again** from the comments that are left, and the
  user can change it or decide not to post the review.
- **Each PR is posted once its verdict is settled**, not all at the end.

## Why

- **Ask before the run, not after it.** If the question came once the reviews
  were ready, nobody could leave a non-interactive run alone. Asking first costs
  one question, and none when the request already says which mode.
- **Review first, then walk through.** Asking questions while the sub-agents are
  still working would make the user wait between questions, and the whole run
  would take as long as the sum of all PRs. Sub-agents can't talk to the user
  anyway.
- **One comment at a time.** A batch view per PR would mean fewer questions, but
  the user would have to judge several findings without the code beside each
  one. "Post the rest of this PR" and the batched question for PRs without
  comments keep the number of questions down where it is safe to.
- **A separate `why`.** "Less is more" applies to what the PR's author reads.
  The person deciding whether to post needs the reasoning the short comment
  leaves out.
- **Post as soon as each PR is decided.** A walkthrough takes minutes per PR, so
  heads move more often than in an unattended run. Posting right away narrows
  that window. It also means a run stopped halfway keeps what was decided.

## Not now: learning from interactive edits

Rewrites and skips from interactive runs could be turned into a profile of how
the user writes and what they care about, and passed to later runs through
`brief.mjs --preferences`. That was considered and put aside. Without it, the
interactive mode stays one bounded change.

The design questions it raises:

- **Persistent prompt injection.** Anything derived from PR content that ends up
  in the profile would steer every later review. The profile would have to be
  built only from the user's own text, and they would have to approve each
  change to it.
- **Over-fitting.** One skip doesn't mean "never flag this". The profile would
  need repeated or explicit signals, and it must never hide grave findings.

## Consequences

- Most runs now start with one question, unless the request already says
  which mode.
- Comments in the review JSON carry `severity`, `axis`, and `why`. `show.mjs`
  reads them and `post.mjs` doesn't post them. If the finding format changes,
  `show.mjs` and step 5 of `SKILL.md` have to change with it.
- `post.mjs` exiting with code 3 (the PR moved) is more likely in interactive
  mode. The skill offers to review the new head instead of failing the run.
