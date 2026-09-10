# Measuring without fooling yourself

Everything in this file exists because a measurement lied and cost real work.
Read it before trusting any number.

## Lighthouse has two throttling modes and they disagree

| | simulated (default) | devtools (`--throttling-method=devtools`) |
|---|---|---|
| How | loads fast, then models what a slow connection *would* do | actually throttles the connection and CPU |
| Spread across 5 identical runs | 79–99 observed on one URL | 87, 87, 87, 87, 87 |
| Use it for | the headline number, because PageSpeed Insights uses it | diagnosing, and every before/after comparison |

Simulated mode does not just add noise, it can inverse a result. On one app,
removing the code that was blocking first paint measured *worse* under
simulated throttling (LCP 4392ms → 5119ms) and flat-to-better under devtools,
with Speed Index down 40%. The reason: the simulator builds a dependency graph
from an unthrottled load. On a fast origin the observed trace finishes in ~80ms,
so a dependency like "this element cannot paint until React hydrates" never
appears in the graph at all, and the model extrapolates from the wrong critical
path. Bimodal scores usually mean the simulation is landing on different
critical paths between runs, not that anything changed.

**So: diagnose and compare with devtools throttling. Quote the simulated median
as the PSI-equivalent headline, with its range.**

## localhost is not production, in specific ways

Local measurement is fine for structural facts (chunk counts, bytes, what is in
the HTML) and misleading for anything latency- or contention-bound:

- No real RTT, so `resourceLoadDelay` and connection setup vanish.
- `next start` optimises images on demand; Vercel serves them from cache. Image
  timing is not comparable.
- A fast origin hides bandwidth contention, which on production was the single
  largest LCP term.
- Local scores saturate. Once localhost reads 98–99, it can no longer
  discriminate between changes that differ by 300ms on production.

Structural checks are deterministic and *should* be done locally, because they
have no variance at all: chunk count, transferred bytes, `@font-face` rule
count, whether a string appears in a bundle. Bisect on those, not on scores.

## An audit value can be an artifact of your harness

A CLS of 0.229 was reported consistently by Lighthouse under devtools
throttling on localhost. It was not real:

| where | CLS |
|---|---|
| production | 0, 0, 0 |
| localhost, simulated | 0.227, 0, 0 |
| localhost, devtools | 0.229 every run |
| real Chrome, 4× CPU + slow 3G + cache disabled | **0.001** |

Two fixes were designed and shipped against that number before anyone checked
it against a real browser. `probe.mjs cls` exists to make that check cheap: it
reports the actual `layout-shift` entries with the node that moved and its
before/after rects. A shift with rects is a fact. A score is an inference.

## Always warm the CDN before comparing

A fresh deploy has cold, freshly-hashed assets and (with AVIF) uncomputed image
variants. Measuring immediately reads as a regression. Fetch every static asset
and image variant a few times first, confirm `x-vercel-cache: HIT`, then
measure. One "regression" evaporated entirely on re-measurement after warming;
another survived it and was real. You cannot tell which you have without doing
this.

## Change one thing per deploy

Three changes shipped together produced a 92 → 90 regression and had to be
bisected after the fact. Bisecting on production costs a deploy cycle each time;
bisecting on a deterministic local signal (chunk count) took two builds and no
guessing. Prefer changes that can be attributed by a structural measurement,
and if you must batch, make sure each change has a distinct structural
fingerprint you can check independently.

## Sample sizes

The guidance "3 runs, take the median" is a floor, not a rule. With simulated
throttling and an observed range of 79–99, three runs is weak evidence for a
difference of a few points. Either move to devtools throttling, where 5 runs is
usually plenty, or raise the run count until the spread is smaller than the
effect you are claiming. `measure.mjs` prints the spread and warns when it is
wide enough to undermine the median.
