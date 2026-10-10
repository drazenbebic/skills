# skills

[![skills.sh](https://skills.sh/b/drazenbebic/skills)](https://skills.sh/drazenbebic/skills)

Agent skills I use day to day, packaged so they work in any harness that
supports the [Agent Skills standard](https://agentskills.io/specification) —
Claude Code, Codex, Cursor, opencode, pi, and others.

## Install

Two routes, with different trade-offs. The **Claude Code plugin** installs the
set as a managed bundle that updates when I ship, so you subscribe rather than
fork. **skills.sh** copies editable files into your project, so you can change
them and make them your own. Pick one — installing both leaves you with every
skill twice.

<details>
<summary><strong>Claude Code plugin</strong></summary>

```bash
claude plugin marketplace add drazenbebic/skills
claude plugin install drazenbebic-skills
```

Or from inside a session:

```
/plugin marketplace add drazenbebic/skills
/plugin install drazenbebic-skills
```

</details>

<details>
<summary><strong>Any agent, editable files</strong></summary>

```bash
# everything in this repo
npx skills add drazenbebic/skills

# or just one
npx skills add drazenbebic/skills --skill nextjs-performance-audit
```

Add `-g` to install globally rather than into the current project, and
`npx skills update` to pull later changes.

</details>

<details>
<summary><strong>Try one without installing</strong></summary>

```bash
npx skills use drazenbebic/skills@nextjs-performance-audit | claude
```

</details>

## Skills

### [`nextjs-performance-audit`](skills/nextjs-performance-audit)

Auditing and optimising Next.js App Router apps with Lighthouse — slow LCP,
layout shift, oversized client bundles, hydration-blocked rendering, font and
image cost, prerendering and caching.

Its central claim is that **most performance work fails on measurement, not on
ideas**. It came out of real audits in which several confident, plausible fixes
were aimed at numbers that turned out to be artifacts of the measuring setup.
So alongside a catalogue of findings, it carries the discipline for not being
fooled: which Lighthouse throttling mode to trust for which purpose, when
localhost will lie to you, why to change one thing per deploy — and the fixes
that were tried, measured worse, and reverted.

Four dependency-free Node scripts come with it:

| script | what it does |
|---|---|
| `measure.mjs` | Lighthouse runs, medians, spread warnings, labelled before/after comparison |
| `inspect.mjs` | the served document — headers, redirects, fonts, chunk sizes and fingerprints |
| `probe.mjs` | real-browser probes: content hidden until JS runs, layout shifts with rects, paint timeline, console errors |
| `cdp.mjs` | minimal Chrome DevTools Protocol client |

Requires Node ≥ 22 and Chrome. `lighthouse` is used from `PATH` if present,
otherwise via `npx`. See
[`.agents/adr/0001`](.agents/adr/0001-skill-scripts-are-dependency-free-node.md)
for why the tooling is Node with no dependencies.

### [`review-requests`](skills/review-requests)

Working through every GitHub pull request that is waiting for your review —
reviewing each one, posting short inline comments, and deciding approve,
comment, or request changes.

It doesn't bring its own review method. Each PR goes through the
[`code-review`](https://github.com/mattpocock/skills) skill's Standards and
Spec axes, used unmodified, plus a Correctness pass, because "does it follow
the rules" and "does it do what was asked" both miss "does it work" — and
that is where the findings that matter tend to be. What it adds is everything
around the review: the queue, one sub-agent per PR, the Jira ticket as the
spec, verifying blocking findings before they're posted, and comments short
enough to be read. Running it twice reviews nothing the second time; a PR only
comes back when someone re-requests you, and then only the new commits are
reviewed.

It posts on its own, or — in interactive mode — walks you through every
comment first: the code it points at, why it matters, and the text it would
post, which you keep, skip, or replace with your own. The verdict follows from
what you kept. See
[`.agents/adr/0002`](.agents/adr/0002-review-requests-interactive-mode.md) for
how the modes were decided.

| script | what it does |
|---|---|
| `prepare.mjs` | builds the queue: fetches PR heads read-only, picks the diff base (or the commit you last reviewed), writes each PR's spec with linked issues and Jira tickets |
| `brief.mjs` | renders one PR's sub-agent prompt: the `code-review` bindings from the manifest, the Correctness axis, the finding format, and your earlier comments on a re-review |
| `show.mjs` | renders a drafted review for the interactive walkthrough: each comment with its code from the PR head, the reasoning, and the text to post |
| `post.mjs` | posts one review, after checking every inline comment against the PR's diff |
| `cleanup.mjs` | removes the refs one run fetched |

Requires Node ≥ 22, an authenticated `gh`, and `code-review`
(`npx skills add mattpocock/skills --skill code-review`). Jira tickets are
fetched with the Atlassian CLI (`acli`) when it's installed.

## Licence

MIT
