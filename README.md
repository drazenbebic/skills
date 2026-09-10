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

## Licence

MIT
