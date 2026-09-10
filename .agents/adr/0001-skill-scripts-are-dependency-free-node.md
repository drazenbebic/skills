# 0001 — Skill scripts are dependency-free Node

Status: accepted

## Context

Skills in this repo bundle helper scripts. A script that a user cannot run is
worse than no script, so the constraint is: **runs on a stock developer machine
with nothing installed**.

Python was the first instinct — it feels like the natural choice for a small
analysis script, and macOS ships a `python3`.

## Decision

Bundle helper scripts as Node ESM (`.mjs`), with no `package.json` and no
dependencies.

## Why not Python

The no-dependencies constraint argues *against* Python here, which is the
opposite of the intuition:

- **Node is already a hard prerequisite of the domain.** The first skill audits
  Next.js, which declares `engines: { "node": ">=20.9.0" }`, and drives
  Lighthouse, which is itself a Node CLI. Any repo these skills apply to has
  Node. Python is incidental to such a repo; Node is intrinsic.
- **The work needs a WebSocket client.** The probes drive Chrome over the
  DevTools Protocol, which is WebSocket-based. Node has exposed a global
  `WebSocket` (and `fetch`) since v22, so this costs nothing. Python's standard
  library has no WebSocket client at all, so "no dependencies" in Python means
  hand-writing RFC 6455 masking and frame reassembly — more code, and more
  fragile, with silent corruption of large CDP payloads as a failure mode.
- **The reference implementations were already Node** and had been validated
  against live sites. Porting would have meant re-testing hand-written protocol
  code to arrive at the same place.

## Consequences

- Scripts need **Node ≥ 22** for the global `WebSocket`. Next allows 20.9, so
  this is stricter than the framework. `cdp.mjs` checks for it and exits with an
  explanation rather than a confusing protocol error.
- No `package.json` anywhere in a skill directory. If a script ever genuinely
  needs a dependency, prefer shelling out to a tool the user already has (as the
  Lighthouse runner does, falling back to `npx`) over introducing an install
  step.
- Chrome is assumed at the standard macOS path, overridable with `CHROME_PATH`.
