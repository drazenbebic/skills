# agent-skills

Agent skills I use day to day, packaged so they work in any harness that
supports the [Agent Skills standard](https://agentskills.io/specification) —
Claude Code, Codex, Cursor, opencode, pi, and others.

## Install

```bash
# everything in this repo
npx skills add drazenbebic/agent-skills

# or just one
npx skills add drazenbebic/agent-skills --skill nextjs-performance-audit

# try it without installing
npx skills use drazenbebic/agent-skills@nextjs-performance-audit | claude
```

Add `-g` to install globally rather than into the current project.

## Skills

### [`nextjs-performance-audit`](skills/nextjs-performance-audit)

Auditing and optimising Next.js App Router apps with Lighthouse — slow LCP,
layout shift, oversized client bundles, hydration-blocked rendering, font and
image cost, prerendering and caching.

Its central claim is that **most performance work fails on measurement, not on
ideas**. It was written after real audits in which several confident, plausible
fixes were aimed at numbers that turned out to be artifacts of the measuring
setup. So alongside a catalogue of findings, it carries the discipline for not
being fooled: which Lighthouse throttling mode to trust for which purpose, when
localhost will lie to you, and why to change one thing per deploy.

Includes four dependency-free Node scripts:

| script | what it does |
|---|---|
| `measure.mjs` | Lighthouse runs, medians, spread warnings, labelled before/after comparison |
| `inspect.mjs` | the served document — headers, redirects, fonts, chunk sizes and fingerprints |
| `probe.mjs` | real-browser probes: content hidden until JS runs, layout shifts with rects, paint timeline, console errors |
| `cdp.mjs` | minimal Chrome DevTools Protocol client |

Requires Node ≥ 22 and Chrome. `lighthouse` is used from `PATH` if present,
otherwise via `npx`.

## Licence

MIT
