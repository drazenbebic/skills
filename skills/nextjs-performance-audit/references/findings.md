# Findings catalogue

Every entry here was an actual finding on a real Next.js App Router app, with
the command that proves or disproves it. Nothing is theoretical. Work roughly
top to bottom: the earlier items are larger and make the later ones easier to
see.

Contents:
1. Content that cannot paint until JavaScript runs
2. Streaming that nobody asked for
3. Prerendering and cache headers
4. Redirects on the entry URL
5. The LCP element: what it is and what it waits for
6. Bandwidth contention (why byte-cutting can backfire)
7. Fonts
8. Client bundle leakage
9. Images
10. Prefetching
11. Layout shift
12. Cheap wins
13. Things that were *not* the problem

---

## 1. Content that cannot paint until JavaScript runs

**The highest-value single check.** Scroll-reveal animations implemented with a
JS animation library server-render their elements at `opacity: 0` and reveal
them after hydration. The HTML arrives quickly and then nobody can see it,
which throws away the entire benefit of prerendering.

```bash
node scripts/probe.mjs hidden <url>
node scripts/inspect.mjs <url>     # "opacity:0 elements" line
```

Observed: all 7 sections server-rendered at `opacity:0`; LCP image finished
downloading at 472ms but LCP fired at 5.7s; `elementRenderDelay` 1990ms; long
tasks clustered at 3856–5367ms, i.e. LCP fired *after* hydration.

**Fix:** drive the reveal from CSS so it never depends on JS.

```css
@keyframes reveal-in {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: none; }
}
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal-on-scroll {
      animation: reveal-in .6s ease-out both;
      animation-timeline: view();
      animation-range: entry 0% cover 30%;
    }
  }
}
```

The `@supports` guard matters: without it, browsers that lack scroll-driven
animations would hide the content behind an animation they cannot advance. With
it, they simply render the content. An element already in the viewport at load
resolves to fully-revealed, so above-the-fold content is never hidden.

**Expect this fix to expose CLS.** Invisible content does not contribute to
layout shift. Once it paints, shifts that were always present start counting.
That is not a regression you introduced; it is one you revealed.

## 2. Streaming that nobody asked for

A `<Suspense>` boundary around every content block, with a fixed-height
skeleton fallback, on a **statically prerendered** route. There is nothing to
wait for, but React still flushes a shell of fallbacks and streams the content
in behind it.

Observed: shell `<main>` was 5,729 bytes of a 483KB document, first paint was
12 grey skeletons, and the LCP element itself sat inside `<div hidden id="S:0">`
at the end of the document.

```bash
node scripts/inspect.mjs <url>    # "shell <main>", "streamed boundaries"
```

**Fix:** drop the blanket boundary; give individual genuinely-slow blocks their
own boundary with a correctly-sized fallback. Result: shell 5.7KB → 69KB, zero
skeletons, Speed Index −41%, filmstrip settling at 3000ms instead of 6251ms.

Trade-off: TBT rose ~25ms because React hydrates a larger shell in one pass.
Worth it — painting real content beats painting skeletons — but measure it.

## 3. Prerendering and cache headers

```bash
node -e "const m=require('./.next/prerender-manifest.json');
console.log(Object.keys(m.routes||{}).filter(x=>!x.startsWith('/api')).length)"
node scripts/inspect.mjs <url>    # cache-control, x-nextjs-prerender, set-cookie
```

Want `x-nextjs-prerender: 1` and an `age:` header. `private, no-store` means the
whole site is dynamic.

**`generateStaticParams` shape.** A catch-all segment expects a flat object
keyed by the segment name, with an **array** value. The Pages Router shape
silently matches nothing:

```ts
// wrong - Pages Router shape, produces zero static paths
return stories.map(s => ({ params: { slug: s.slug } }));
// right
return stories.map(s => ({ slug: s.full_slug.split('/') }));
```

Observed: 9 prerendered routes against 30 sitemap URLs → 124 after the fix.

**`next-intl` causes two separate dynamic-rendering problems.** `requestLocale`
resolves through `headers()`, opting the whole `[locale]` subtree into dynamic
rendering — fixed by `next/root-params` (Next 16.3+), noting that
`next/root-params` *throws* outside Server Components so it needs a try/catch,
and that Server Actions calling `getLocale()` will silently get the default
locale afterwards. Separately, its middleware sets a `NEXT_LOCALE` cookie on
every response, and no shared cache stores a response carrying `Set-Cookie`:

```ts
// i18n/routing.ts
localeCookie: false,
localeDetection: false,
```

## 4. Redirects on the entry URL

`localePrefix: 'as-needed'` plus locale detection turns `/` into a 307 for
anyone whose `Accept-Language` is not the default — including Googlebot and
PageSpeed Insights, which both send `en-US`. It is invisible if you only ever
browse in the default locale.

```bash
node scripts/inspect.mjs <url>    # runs the Accept-Language comparison
```

Measured cost: **860ms** on the single most important URL. Fix with
`localeDetection: false`; hreflang is the correct mechanism and is also Google's
recommendation for international sites.

## 5. The LCP element: what it is and what it waits for

Find it rather than assuming. The breakdown tells you which lever to pull:

- **large `elementRenderDelay`** → it is blocked from painting. Hydration-gated
  content (§1), a streamed boundary (§2), or render-blocking work.
- **large `resourceLoadDuration`** → it is downloading slowly. Either the
  resource is big (§9) or it is starved (§6).
- **large `resourceLoadDelay`** → it is discovered late. Check that the preload
  appears early in `<head>`, before any large inline `<style>`.

In Next 16 `priority` is deprecated in favour of `preload`, and the docs
suggest `loading="eager"` + `fetchPriority="high"`. Measured, that swap made no
LCP difference (2343ms vs 2347ms) **and dropped the image's `<link rel=preload>`**.
Keep `priority` unless you have measured otherwise.

## 6. Bandwidth contention — why cutting bytes can backfire

The most counter-intuitive finding. An LCP image of **46KiB took 3216ms** to
arrive — not because it was large, but because ~686KiB was in flight at once on
a 1.6Mbps link and it only ever received a share.

Two consequences:

**Fonts preloaded at `High` priority compete directly with the LCP image.** All
four font files started at the same millisecond (656ms) as the image. With
`font-display: swap` no font is needed for first paint, so none of them belong
ahead of the LCP resource.

**Adding requests can cost more than the bytes it saves.** Splitting a component
out with `next/dynamic` saved 41KiB raw but added two chunks; script requests
went 13 → 15 and the LCP image's download went 2737ms → 2871ms. Total transfer
*fell* by 20KiB and the score *fell* by 2 points. HTTP/2 shares bandwidth per
stream, so more streams means a smaller slice each.

Bisect this class of change on chunk count, which is deterministic:

```bash
node scripts/inspect.mjs <url> --chunks     # count and sizes, no Lighthouse noise
```

## 7. Fonts

**Check which subset the visible text actually needs.** Declaring
`subsets: ['latin']` on a site whose copy contains `č/ć/ž/š/đ` means the
latin-ext file — the one the text needs — is discovered late. Observed at
1596ms against 458ms for preloaded latin.

But preloading it is not automatically right either: latin-ext for a variable
font was **84KiB**, and preloading put it at `High` priority alongside the LCP
image (§6). Dropping the preload only moves it later; Chrome still fetches it at
`VeryHigh` once it finds text needing those glyphs. If a single character is
pulling in 84KiB, the real fix is a self-hosted subset.

**Variable fonts do not want a `weight` array.** Every declared weight points at
the same `.woff2`; the array only multiplies `@font-face` rules, which
`experimental.inlineCss` then inlines into each document twice (once in the
`<style>` tag, once in the flight payload).

```bash
node scripts/inspect.mjs <url>    # "@font-face rules"
```

Observed: 148 rules / 39,624 bytes → 30 rules / 7,760 bytes, with the set of
downloaded files unchanged. Confirm the file hash really is shared across
weights before deleting.

`subsets` controls which subsets are **preloaded**, not which `@font-face` rules
exist — the CSS carries the others regardless, so removing a subset does not
break those characters, it only delays them.

## 8. Client bundle leakage

A `'use client'` module that imports a **component registry** drags the entire
registry, and everything it transitively imports, into every route's client
bundle.

Seen with Storyblok, but the shape is general — any `components: { ... }` map
imported from a client component does this:

```
storyblok-provider.tsx  ('use client', calls getStoryblokApi(), returns children)
  └─ lib/storyblok.ts   (registers all 25 bloks)
       └─ blok-contact-form.tsx
            └─ contact-form.tsx ('use client')
                 └─ friendly-challenge      ← 387KB raw on a page with no form
```

The provider was a no-op: every real API call was server-side. Deleting it was
worth perf 93 → 98 and LCP −800ms locally.

```bash
node scripts/inspect.mjs <url> --chunks --probe=<DistinctiveIdentifier>
```

**Two follow-on traps:**

- Removing client-side registry initialisation breaks any *client* component
  that resolves from the registry. Symptom: `Component X doesn't exist.` in the
  console, best-practices 100 → 96, while the markup still renders because it is
  server-rendered. Check with `probe.mjs console <url>`.
- The registry is still reachable from every page through the server-side data
  layer (`src/api/*`), so its `'use client'` leaves remain in each route's
  manifest. Splitting those out with `next/dynamic` is tempting but see §6.

Also worth checking: whether a component still needs `'use client'` at all after
an animation library is removed. `useTranslations` works in Server Components,
so a component whose only remaining hook is translation can move back to the
server and leave the client bundle entirely.

## 9. Images

**AVIF was the single largest LCP win available**, and it is one line:

```js
// next.config.mjs
images: { formats: ['image/avif', 'image/webp'] }
```

Measured on the LCP resource: 47,184 bytes (WebP) → 21,111 bytes (AVIF), −55%,
with WebP preserved as the fallback. Production perf 92 → 97, LCP 3410 → 2456ms.

**`sizes` must describe the element, not the viewport.** Without it the browser
takes the 2x candidate and fetches a 3840px source into a 316px box.

```tsx
sizes="(min-width: 1440px) 656px, (min-width: 1024px) calc((100vw - 8rem) / 2), calc(100vw - 6rem)"
```

Cross-check against Lighthouse's reported displayed dimensions: 412px viewport
minus two levels of `px-6` padding is exactly 316px, which confirms the maths.

**Below-the-fold and third-party images should be lazy.** Review avatars from a
third-party origin were eager, so the page paid a DNS lookup, a TLS handshake
and ~43KiB inside the LCP window for a carousel nobody had scrolled to.

## 10. Prefetching

Fixing prerendering makes prefetching *worse*: a static route is prefetched in
full, while a dynamic one is skipped unless it has a `loading.js` boundary.

Look for one route fetched several times with different `_rsc` hashes — those
are segment-prefetch variants. A header wordmark and a footer wordmark both
pointing at `/` will prefetch the page the visitor already has open.

Add `prefetch={false}` to links nobody navigates by: header/footer wordmarks,
footer links, sitewide promo banners. Observed 4 reqs / 80KiB → 5 reqs / 34KiB,
with the remainder going to the actual conversion pages. Expect reallocation —
removing one link promotes another into the budget, so re-measure.

## 11. Layout shift

Diagnose with the browser, never the score (see `measurement.md`):

```bash
node scripts/probe.mjs cls <url>
node scripts/probe.mjs paint <url> "<lcp-selector>" "<heading-selector>"
```

**A box whose width depends on its own content collapses to zero.** A flex
parent with `items-center` does not stretch its children, so a wrapper sized to
its content; the image inside had `w-full`, which resolved against a wrapper
whose width depended on the image. Circular, so it computed to `width: 0` until
`naturalWidth` arrived, then snapped to 316×316 and shoved everything below it
down the page — the entire 0.244 CLS. Fix: give the wrapper a definite width.

The general shape: `aspect-ratio` cannot reserve space unless one axis is
definite. `w-auto h-auto` leaves both indefinite and reserves nothing.

**Font swaps reflow text.** A heading changing height after `fonts.ready` is a
wrap change between the fallback and the real font. `probe.mjs paint` shows it
as a height change at a specific timestamp.

## 12. Cheap wins

**Contrast.** Lighthouse gives you the exact colours; compute the ratio rather
than guessing a shade. `slate-500` on `slate-950` is 4.23 — still under 4.5.

```bash
node -e "
const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const lin=c=>c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);
const L=h=>{const[r,g,b]=hex(h).map(lin);return .2126*r+.7152*g+.0722*b};
console.log(((Math.max(L('#62748e'),L('#0f1224'))+.05)/(Math.min(L('#62748e'),L('#0f1224'))+.05)).toFixed(2));"
```

**`label-content-name-mismatch`** means an `aria-label` does not contain the
visible text. A wordmark link with `aria-label="To the homepage"` and visible
text "Dr. Marijeta Bebic" fails. Often the honest fix is to delete the
`aria-label` and let the visible text name the link. A hardcoded label in one
language on a localised site is both this failure and an i18n bug.

**`is-crawlable` failing** on a login/portal page is usually an intentional
`noindex`. Do not "fix" it.

**bf-cache failures** are a consequence of `Cache-Control: no-store` and
disappear when prerendering is fixed.

## 13. Things that were *not* the problem

| Suspected | Reality |
|---|---|
| `draftMode()` forcing dynamic rendering | It does not. Next prerenders and the `__prerender_bypass` cookie bypasses per request. |
| A short ISR revalidate causing slow responses | `stale-while-revalidate` serves from the edge instantly; 8/8 requests were `x-vercel-cache: HIT`, TTFB 137–181ms. |
| Large document weight from `inlineCss` | Removing it measured *slower*: the document dropped 573KB → 227KB and the score went 88–92 → 87, because first paint then waits on a stylesheet round trip. Do not disable it on a byte count alone. |
| `unused-javascript` / `legacy-javascript` | Usually react-dom and Next's own polyfill chunk. Zero score weight, nothing to act on. |
| Two font families | Normal, and not the problem. Do not lead with this. |
| A message catalogue shipped to the client | Was 3KB. Check before optimising. |
| `qs` appearing in client chunks | False positive: a two-character substring matching minified identifiers. |

Lighthouse **opportunities and insights carry no score weight.** Only the
metrics do (FCP, SI, LCP, TBT, CLS). A page can show a wall of red diagnostics
and still score 100. Fix metrics; read diagnostics for clues.
