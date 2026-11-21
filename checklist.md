# JB Esmade Portfolio — Build Checklist (agent handoff)

Purpose: this file is the single source of truth for progress. If the daily limit is hit, the
next agent reads this + `AGENTS.md` + `layout.md` and continues where the last one stopped.

## Rules for whoever continues
- Read `AGENTS.md` (project rules) and `layout.md` (layout spec) before coding.
- Work stage by stage. Do NOT start the next stage without the user's OK.
- Do not add dependencies without asking.
- Update this checklist after every work session: mark done items, note decisions, adjust next steps.
- All content data lives in typed files under `lib/data/` — edit content there, not in components.

## Decisions locked in (do not re-ask)
- Accent color: **electric violet** (`#8b5cf6`) — Tailwind token `--color-accent`.
- Font: **Geist** via `next/font/google` (wired in `app/layout.tsx`).
- Theme is dark-only (per AGENTS.md design direction).
- Rate-limit store: in-memory (local dev only) — ask user before real deploy.
- `motion` (^14.14.0) and `embla-carousel-react` (^8.6.0) installed **with user consent** at
  the start of Stage 2 ("Proceed to Stage 2" = OK for the two deps listed at the end of Stage 1).
- Embla auto-scroll is implemented with a `scrollNext` interval hook
  (`components/useAutoAdvance.ts`) instead of the `embla-carousel-auto-scroll` plugin —
  no third dependency needed. Pauses on hover/touch/focus, hidden tab, and reduced motion.
- Orbit icons are decorative (`aria-hidden`); the skills carousel is the interactive path
  to skill details (a11y: no 8 hidden buttons in the tab order).
- Profile animation: `components/ProfileOrbit.tsx` uses `public/profile-animated.webp` with
  `public/profile-static.webp` for reduced motion; both are generated from
  `lib/data/img/profile-video.mp4` by `scripts/build-profile-animation.mjs`.
- Project images: `image: string | null` in `lib/data/projects.ts`; `null` renders a gradient
  placeholder tile. Real images go to `/public/projects/` and the path is set in the data file.
- Block 1 modals use CSS transitions (`components/SimpleModal.tsx`); refactor onto the shared
  `ToolModal` system in Stage 3.

## Content TBD (user must supply — placeholders currently in `lib/data/`)
- [x] About text + skills/projects copy now real (user-edited; summary shows in full, no Read more)
- [ ] Skills/projects text can still be refined directly in `lib/data/`
- [ ] Projects images → `/public/projects/` (placeholder tiles still render)
- [x] Profile animation → transparent 96-frame animated WebP (`public/profile-animated.webp`,
  480×270, ~1.6 MB) + reduced-motion still (`public/profile-static.webp`), generated from
  `lib/data/img/profile-video.mp4` by `scripts/build-profile-animation.mjs`
- [ ] Instagram URL (TBD — button renders disabled with TODO)

## Stage 1 — Setup, theme tokens, layout shell, About, buttons, social links
- [x] Tailwind v4 theme tokens in `app/globals.css` (base `#050505`, surfaces, accent violet)
- [x] Geist font wired, dark-only theme, metadata
- [x] Single-screen shell: `h-dvh overflow-hidden`, responsive desktop (>=1024px) + mobile
- [x] Typed data files: `lib/data/about.ts`, `lib/data/tools.ts`, `lib/data/links.ts`
- [x] About section: truncated summary + "Read more" modal
- [x] Simple reusable modal (CSS transitions, focus trap, Esc, scroll lock, focus return) — `components/SimpleModal.tsx`
- [x] Six tool buttons T1–T6 in order (rendered, inert until their agent stages) — `components/ToolButtons.tsx`
- [x] Book an appointment button (Google Calendar link, gradient/glow treatment)
- [x] Social buttons: FB, Gmail, Phone (opens phone modal), LinkedIn, Instagram (disabled + TODO)
- [x] Phone modal: +63 955 977 2486, `tel:` button, WhatsApp button
- [x] Floating chatbot button (placeholder, inert until Stage 4)
- [x] Reserved slots for: profile photo + orbit area, Projects carousel, Skills carousel (Stage 2)

## Stage 2 — Carousels, orbiting icons, bottom sheets  ← DONE (awaiting user OK for Stage 3)
- [x] Deps installed with user consent: `motion` ^14.14.0 + `embla-carousel-react` ^8.6.0
- [ ] Skills + projects content still placeholders — real copy welcome anytime (edit `lib/data/`)
- [x] Auto-scrolling Projects carousel (embla `scrollNext` interval, pause on hover/touch/focus/tab-hidden/reduced-motion) — `components/ProjectsCarousel.tsx`
- [x] Auto-scrolling Skills icon carousel (same behavior) — `components/SkillsCarousel.tsx`
- [x] Skill icons orbiting the profile photo (`motion/react` ring + counter-rotation; static under reduced motion) — `components/ProfileOrbit.tsx`
- [x] Bottom sheets at 33dvh: project image enlarged (or placeholder tile) + skill info — `components/BottomSheet.tsx`
- [x] Sheet dismiss: outside tap / Esc / swipe-down drag (drag disabled under reduced motion)
- [x] Created `lib/data/skills.ts`, `lib/data/projects.ts`; shared sheet state via `components/ShowcaseProvider.tsx`

## Stage 3 — Shared modal system, env, rate limiting, provider interfaces  ← DONE (awaiting user OK for Stage 4)
- [x] Shared `ToolModal` (motion/react: scale 0.95 + fade + upward spring, glass backdrop, reduced-motion aware, focus trap/Esc/scroll-lock/focus-return) — `components/ToolModal.tsx`
- [x] Refactored About + Phone modals onto ToolModal; `SimpleModal.tsx` deleted
- [x] `lib/env.ts` (zod-validated, runtime server-only guard — `server-only` pkg NOT installed, no new deps) + `.env.example` (OPENAI_API_KEY/BASE_URL/MODEL, IMAGE_API_KEY, VIDEO_API_KEY, JOBS_API_KEY; all optional — empty .env.local = valid all-mock setup)
- [x] Rate limiting helper `lib/rate-limit.ts` (in-memory fixed-window per IP+route, `enforceRateLimit()` returns a 429 response) — **wire into each route as it is created in Stage 4**; no `app/api/` routes exist yet
- [x] Provider adapters in `lib/providers/` (llm, products, seo, image, video, jobs + `index.ts` barrel): typed interfaces, `Mock*Provider` implementations, `getXProvider() → { mode, provider }`; mock video jobs advance queued→processing→succeeded/failed over ~8s for polling-UI testing
- [x] Modal internals pattern primitives — `components/AgentModalUI.tsx`: AgentForm, ResultsSection, SkeletonCards, ErrorState (retry), EmptyState, CopyButton, DownloadTextButton, DownloadMediaButton

## Stage 4 — Agents, one at a time, in this order (each with mock-mode fallback)  ← DONE (awaiting user OK for Stage 5)
- [x] Walmart Product Hunter — `app/api/agents/walmart/route.ts`, `components/agents/ProductHunterModal.tsx` (shared, parameterized), `lib/agents/products.ts` + `walmart.ts`, `lib/schemas/product.ts` + `walmart.ts`
- [x] Amazon Product Hunter — same structure (`lib/agents/amazon.ts`, `lib/schemas/amazon.ts`); shared `ProductRequest/Response` + optional LLM opportunity re-scoring when `OPENAI_API_KEY` is set
- [x] SEO Website Analysis — `lib/agents/seo.ts` with mandatory SSRF protection: https-only schema, hostname blocklist (localhost/.local/.internal), DNS-resolved private/loopback/link-local IPv4+IPv6 blocking, 512 KB size cap, 8s timeout; blocked URLs → 400 (never a mock report); network failures → mock report fallback; rule-based checks + optional LLM summary
- [x] Image Generator — prompt/size/style → `{url}` or `{base64, mimeType}` + preview + download (`components/agents/ImageModal.tsx`)
- [x] Video Generator — POST creates job, `GET ?id=` polls; modal polls every 2s with Cancel + 90s timeout (`components/agents/VideoModal.tsx`)
- [x] Job Hunter — role/location/remote → ranked listings + one-line pitch per listing (`components/agents/JobsModal.tsx`)
- [x] Chatbot — streaming (`streamText` → `toTextStreamResponse` on the OpenAI-compatible gateway; mock chunks without key), About text as system prompt, off-topic refusal + short answers, floating `components/agents/ChatPanel.tsx` toggled by the chat button
- [x] All 6 tool buttons wired to their modals in `components/ToolButtons.tsx`; every route rate-limited (`walmart/amazon/jobs/image 5–10/min`, `seo/video 5/min`, `video-poll 60/min`, `chat 20/min`)
- [x] All routes zod-validate input (400 on bad input), respond `{error}` JSON on failures; client modals validate response shapes too
- [x] Verified end-to-end on dev server: walmart/jobs/image mock data, video job lifecycle queued→processing→succeeded, SSRF guard rejects `https://localhost` with 400, real fetch of `https://example.com` scored 25/100 with 8 checks, chat streams mock reply, 10-then-429 rate limit confirmed

## Stage 5 — Accessibility & performance pass
- [ ] Lighthouse run
- [ ] Focus order + focus trap audit
- [ ] `prefers-reduced-motion` audit everywhere
- [ ] Verify no page scroll on mobile + desktop, safe-area padding on mobile

## Known state of repo
- Next.js 16, React 19, Tailwind v4, `ai` + `@ai-sdk/openai-compatible` + zod already installed.
- `.env.local` exists (user-managed). Never use `NEXT_PUBLIC_` for secrets.
- Run with `npm run dev`, verify with `npm run build` / `npm run lint`.

## Session log (most recent last)
- 2026-11-17: Stage 1 built. Verification: `npm run build` clean, `npm run lint` clean (0 errors,
  0 warnings), dev server smoke test `GET / -> 200` with About, Read more, and appointment link present.
  Note: lucide-react v1.x removed brand icons — Facebook/LinkedIn/Instagram/WhatsApp are inline
  SVGs (simple-icons paths) in `components/SocialLinks.tsx`. Phone/WhatsApp link lives inside the
  phone modal (client-rendered, not in SSR HTML). Next 16 agent-rules block added by `next dev`:
  read `node_modules/next/dist/docs/` guides before Stage 2+ code that touches framework APIs.
  Awaiting user OK for Stage 2.
- 2026-11-17: Stage 2 built with user consent ("Proceed to Stage 2"). Installed
  `motion` ^14.14.0 + `embla-carousel-react` ^8.6.0. New files: `lib/data/skills.ts`,
  `lib/data/projects.ts` (placeholder content), `components/BottomSheet.tsx` (33dvh,
  swipe-down/Esc/outside-tap), `components/ShowcaseProvider.tsx` (shared sheet state,
  one AnimatePresence instance), `components/SkillIcon.tsx`, `components/useAutoAdvance.ts`
  (interval auto-scroll + drag-click guard hooks), `components/ProjectsCarousel.tsx`,
  `components/SkillsCarousel.tsx`, `components/ProfileOrbit.tsx` (photo with onError initials
  fallback + decorative orbit ring). `app/page.tsx` wired to all of it. Verification:
  `npm run build` clean, `npm run lint` clean (fixed one ref-during-render error in the
  auto-advance hook), dev smoke test on the already-running server (PID 46180, port 3000 —
  not started by the agent, left running): GET / -> 200 with projects, skills, orbit, and
  appointment all in the SSR HTML. Next: Stage 3 on user OK.
- 2026-11-17: Stage 3 built with user OK ("Proceed with stage 3"). Created
  `components/ToolModal.tsx` (motion springs, reduced-motion aware) and refactored
  AboutSection + SocialLinks onto it; deleted `SimpleModal.tsx`. Created `lib/env.ts`
  (zod 4 schema, all-optional keys, runtime client-import guard), `.env.example`
  (canonical var names; `.env.local` currently defines none), `lib/rate-limit.ts`
  (in-memory fixed window; enforceRateLimit() to be wired into each Stage 4 route),
  `lib/providers/` (llm/products/seo/image/video/jobs interfaces + mocks + factory),
  `components/AgentModalUI.tsx` (form/results/skeleton/error/empty/copy/download
  primitives for the Stage 4 modals). Verification: `npm run build` clean,
  `npm run lint` clean (fixed one unused-var warning in the video mock), smoke test
  on the user's dev server (port 3000): GET / -> 200. Next: Stage 4, Walmart agent
  first, one agent at a time, each with mock-mode fallback + rate limiting.
- 2026-11-17: Stage 4 built with user OK ("Proceed to stage 4"). All 7 agents live:
  walmart/amazon (shared ProductHunterModal + lib/agents/products.ts with optional LLM
  re-scoring), seo (real fetch + SSRF guards in lib/agents/seo.ts, mock fallback, 8
  rule-based checks), image, video (POST create + GET poll + mock 8s lifecycle),
  jobs, chatbot (streamText on @ai-sdk/openai-compatible; mock chunked streaming).
  All input zod-validated, all routes rate-limited via lib/rate-limit.ts. Modals in
  components/agents/ built from AgentModalUI primitives (form top, results below,
  skeleton/error/empty, copy/download). ToolButtons wired to all 6 modals; ChatbotButton
  toggles ChatPanel. Verification: build clean, lint clean (fixed llmConfigured barrel
  import + 2 TS errors), end-to-end route tests passed including SSRF 400 on
  https://localhost, real https://example.com analysis (mode=real), video job
  lifecycle, chat streaming, and rate-limit 429s after the 10th walmart request.
  Next: Stage 5 (a11y + performance pass) on user OK. Real providers (scraping/API
  details) remain TODO — everything runs in mock mode until keys are added to
  .env.local.
- 2026-11-17: Post-stage fixes from the user: AboutSection restyled (shimmer gradient name,
  pulse-dot role label, accent-barred full-width summary, "Read more" modal removed) and
  real content landed in lib/data/about.ts. Profile animation added: user-supplied 6
  transparent PNG frames (public/profile1.png … "profile 6.png") converted with sharp
  (no ffmpeg on the machine) into a 1×6 sprite sheet public/profile-sprite.webp (55 KB) +
  public/profile-static.webp for prefers-reduced-motion; builder script kept at
  scripts/build-profile-animation.mjs. ProfileOrbit now renders a 16:9 rounded card cycling
  frames via CSS hold-keyframes (--animate-profile-cycle, 2.5s loop) with initials fallback
  on load error. Verified: build/lint clean, both webp assets served 200 on the dev server.
- 2026-11-17: Profile animation REPLACED with the user's new 17-frame set in
  `lib/data/img` (g1..g17 transparent PNGs, 0.5s/frame → 8.5s loop; the 17 JPGs in the same
  folder are the same video with background — unused). Sprite rebuilt at 480x270 cells
  (196 KB), static frame = g17 (calm smile, 9 KB). CSS keyframes now hold 17 cells at
  6.25% steps over background-size 1700%. Display enlarged for visibility: card
  w-48/w-72 (mobile/desktop), orbit container h-64/h-96, orbit radius bumped to 10.5rem
  on desktop. Builder script updated to the new frame list. NOTE: `lib/data/about.ts`
  was found deleted this session (contents restored verbatim from the agent's earlier
  read; repo has no useful git history for it).
- 2026-11-17: Profile animation reworked per user feedback ("no square at the background"):
  the rounded card/box was removed — the transparent cut-out figure now floats directly on
  the page with a violet drop-shadow glow hugging its silhouette. Display enlarged
  (w-52 mobile / w-96 desktop, 16:9), orbit container h-72 / h-[28rem], orbit radius
  7.25rem / 12rem. Asset URLs carry ?v=2 for cache-busting (bump after every sprite
  rebuild). Root cause of the "two figures" artifact in the user's screenshot: stale
  browser cache pairing old 6-frame CSS with the new 17-frame sprite. Build/lint clean.
- 2026-11-17: Orbit overlap fixed after visual verification via headless-Chrome screenshots
  (agent-side, no user video needed): orbit radius raised to 9rem (mobile) / 13rem (desktop)
  and the figure trimmed to w-52 / w-80 so every icon clears the figure + glow horizontally
  AND vertically (previous radius clipped the top icon against the header). Verified at 600px
  and 512px: no icon overlaps the figure, nothing clips. NOTE: headless Chrome clamps window
  width to ~512px, so sub-512 "mobile" screenshots are a rendering artifact — real 390px
  phones lay out like the 512px capture (all content fits, middle section scrolls by design).
  Build/lint clean.
- 2026-11-17: About summary re-clipped per user: lib/data/about.ts gained `summaryTeaser`
  (first sentence, ends at "…digital marketing and e-commerce.") shown on the page; a
  "Read More" button re-added opening a small ToolModal popup with the full summary text.
  Build/lint clean.
- 2026-11-17: Rebuilt the profile animation from `lib/data/img/profile-video.mp4` after confirming
  it matches the supplied reference video. Background removal preserves the cyan effects and
  transparent cut-out. Fixed animated WebP encoding to use the installed FFmpeg `libwebp_anim`
  encoder because Sharp does not accept an array of PNG buffers as multi-page input. Verified
  96 frames, 480×270, alpha channel, infinite loop; output is ~1.6 MB. The reduced-motion still
  was regenerated as WebP.
- 2026-11-17: Reworked the portfolio hero per user request: enlarged the profile image, placed it
  left of a vertical tool stack on desktop and mobile, compacted the About header typography, and
  tightened mobile carousel/tool sizing. Verified at 360×640, 390×568, 390×844, 768×800,
  1024×768, and 1440×900; body dimensions match each viewport with no page overflow.
- 2026-11-17: Replaced placeholder skills with the requested 10 services and their supplied
  descriptions. Optimized the provided logos to WebP in `public/skills/`, used them in the profile
  orbit, carousel, and skill sheets, and labeled each carousel chip. The Embla carousel loops,
  slows its advance interval on pointer hover, and preserves drag/click-to-open detail sheets.
  Updated `layout.md`. Verified all 10 icons load at 390×844 and 1440×900 without viewport
  overflow, confirmed the SMM skill sheet and description open by keyboard, and passed lint/build.
- 2026-11-17: Made the orbit visible on mobile, tightened its radius for narrow screens, and
  enlarged its smallest-screen icons. Both looping carousels now advance faster and slow their
  interval and Embla motion on pointer hover. Updated `layout.md`. Verified the orbit avoids the
  tools and page overflow at 320×568, 360×568, 390×568, 360×640, 390×844, and 1440×900. Confirmed
  both carousels advance at normal speed and wait longer before advancing while hovered.
- 2026-11-17: Centered the mobile and desktop tool stack beside the profile and aligned the booking
  and social buttons beneath the same image column. Mobile tools now show complete labels at a
  compact size. Increased carousel speed modestly while keeping hover slowdown and endless looping.
  Verified alignment and no page overflow at 320×568, 390×844, 640×800, and 1440×900; confirmed
  mobile carousels advance and slow under hover. Lint and production build pass; updated `layout.md`.
- 2026-11-17: Styled social buttons with brand colors (Facebook #1877F2, Gmail #EA4335,
  Phone #25D366, LinkedIn #0A66C2, Instagram #E1306C). Each button now shows its brand-color
  icon tint at rest, with matching border glow + bg tint on hover. Added small text labels
  beneath each icon (Facebook, Gmail, Phone, LinkedIn, Instagram). Switched social button
  container from `flex flex-wrap` to `grid grid-cols-5` so all 5 buttons always sit in one
  horizontal row on mobile. Added orbit icon text labels (skill.name, 8px, semi-transparent
  pill) beneath each orbiting skill chip. Constrained profile image width on desktop
  (lg:w-[60%]) so it stays behind the orbit ring on all breakpoints — matching mobile behavior.
  Build/lint clean.
- 2026-11-17: Desktop-only orbit/profile enlargement: removed lg:translate-y-6 offset (freed
  vertical space near appointment button), reduced orbit radius lg→min(9rem,13dvh) (icons closer
  to figure), enlarged orbit icons to lg:h-14 w-14 with lg:rounded-xl, enlarged label to
  lg:text-[11px] lg:max-w-[5rem], enlarged profile image to lg:w-[90%]. Mobile/tablet untouched.
- 2026-11-17: Bumped desktop orbit radius to min(11rem,16dvh) (a bit farther from figure).
  Converted orbit icon chip wrapper to motion.span with whileHover (scale 1.15) and whileTap
  (scale 1.35, spring stiffness 400/damping 17) on both mobile and desktop. Checklist updated.
- 2026-11-17: Refactored speech bubble into ToolCalloutBubble.tsx with two exports:
  MobileBubble (horizontal layout, icon-left + text-right, full-width, injected in page.tsx
  above the middle grid with lg:hidden so it doesn't consume the 8.5rem mobile tools column)
  and DesktopBubble (vertical, shadow-depth, hidden lg:block inside ToolButtons). Tool buttons
  no longer pushed down on mobile. Checklist updated.
- 2026-11-17: Positioned speech bubble tail arrow directly over Walmart Product Hunter button
  (switched MobileBubble pointer to right-16 above the 8.5rem tools column; DesktopBubble pointer
  at left-8 directly above Walmart icon/text).
- 2026-11-17: Restored ToolButtons alignment to self-center (and preserved lg:translate-y-6) so
  the vertical alignment between the profile image, orbit icons, and the Walmart Product Hunter
  button is completely preserved and untouched. Checklist updated.
- 2026-11-17: Shifted profile image and its orbital icons to the left side on desktop (web view)
  with a comfortable margin (lg:justify-start, lg:mx-0, lg:ml-8). Aligned the actions area (Book an
  Appointment button and social links row) directly under the profile on the left (lg:w-[min(30rem,42dvh)],
  lg:ml-8). Mobile and tablet remain untouched. Checklist updated.
- 2026-11-17: Fixed weather integration: moved typing animation and canvas effects completely
  into the absolute background layer (WeatherBackground.tsx) so it no longer disrupts the single-screen
  h-dvh flex layout or pushes the header/grid. Weather API optimized with tight 1500ms timeout and
  zero external navigation or page opening. Checklist updated.
- 2026-11-17: 100% static client-side weather system refactor:
  1. Removed server-side `/api/weather` route; implemented purely static client-side fetching via `https://ipapi.co/json/` and Open-Meteo with `sessionStorage` caching (30 min TTL) and silent Manila fallback (no popup, no browser permission prompt).
  2. Integrated full-viewport fixed background layer (`fixed inset-0 -z-10 pointer-events-none overflow-hidden bg-[#050505]`) behind all portfolio content with zero layout shift or opacity occlusion.
  3. Mapped all WMO weather codes: Clear (warm sun glow by day, twinkling canvas stars by night), Cloudy (translucent drifting cloud gradients), Fog (ambient mist layers), Rain (falling streaks), Snow (gentle swaying flakes), Thunderstorm (deep tint, fast rain, distant ambient lightning flash).
  4. Added minimal floating corner control pill (`WeatherControlPill.tsx`) in the lower corner with live detected weather display, quick preview mode cycling, direct preset picker, and on/off power toggle. Verified production static build passes with zero errors. Checklist updated.
- 2026-11-17: Desktop web-view margin adjustments:
  1. Increased left margin on `ProfileOrbit` and `actions` (Appointment button & Social links) to `lg:ml-10 xl:ml-14`, moving the entire left group inward from the screen border while preserving vertical alignment.
  2. Increased right margin on `ToolButtons` (`DesktopBubble` quick note + tool buttons) by adding `lg:mr-6 xl:mr-10` and setting `lg:grid-cols-[minmax(0,1fr)_auto]`, shifting the entire right column comfortably away from the right screen edge.
  3. Increased middle grid container horizontal padding to `lg:px-10 xl:px-16` on desktop. Mobile and tablet remain completely untouched. Verified production build passes cleanly. Checklist updated.
- 2026-11-17: Desktop web-view orbit, profile & actions enlargement & margin refinement:
  1. Added more margin from left on web view for `ProfileOrbit` and `actions`: bumped to `lg:ml-16 xl:ml-24 2xl:ml-28`.
  2. Enlarged `ProfileOrbit` container on web view from `min(30rem, 42dvh)` to `lg:h-[min(35rem,48dvh)] lg:w-[min(35rem,48dvh)] xl:h-[min(39rem,53dvh)] xl:w-[min(39rem,53dvh)]`.
  3. Enlarged orbit ring radius to `lg:min(13rem, 18dvh)` and `xl:min(14.5rem, 20.5dvh)`. Enlarged orbiting icon boxes to `xl:h-16 xl:w-16 xl:p-2` with labels up to `xl:text-xs xl:max-w-[5.75rem]`.
  4. Enlarged cut-out profile figure inside orbit to `lg:w-[92%] xl:w-[94%]` with enhanced violet glow.
  5. Enlarged "Book an Appointment" button on desktop (`lg:w-72 xl:w-80 lg:py-3.5 lg:text-[15px]` with `lg:h-5 lg:w-5` icon).
  6. Enlarged social link row on desktop (`lg:max-w-md xl:max-w-lg lg:gap-2.5 xl:gap-3 lg:py-2.5 xl:py-3` with `lg:h-4.5 xl:h-5` brand icons and `lg:text-[10px] xl:text-[11px]` labels).
  7. Mobile and tablet layouts untouched; zero page overflow (`h-dvh overflow-hidden`). Production build verified clean (exit code 0). Checklist updated.
- 2026-11-17: Exaggerated dynamic weather background effects (high-fidelity & atmospheric blend):
  1. Sunny (`clear-day`): Added sweeping volumetric god rays (14 radial light shafts fanning diagonally across the screen with smooth sinusoidal breathing/pulse), brilliant sun core/flare corona at the upper sky, and drifting warm golden sun motes with glinting highlights.
  2. Rain (`rain`): Multi-tier visible rain streaks (thick fast foreground drops, medium midground, soft background), dynamic expanding splash ripples on bottom impact, and realistic beaded glass water droplets with highlights and sliding trickle trails on the viewport.
  3. Thunderstorm (`thunderstorm`): Violent driving slanted rain, running glass condensation, jagged branching vector lightning strikes cracking across the canvas, and atmospheric dual-flash sky illumination.
  4. Clear Night (`clear-night`): Rich starry sky with diverse magnitudes, distinct 4-point sparkle cross stars, deep cosmic nebula glows, and periodic shooting star meteors streaking across the dark sky.
  5. Snow (`snow`): Multi-depth swaying snowfall with soft-focus foreground bokeh flakes, crisp swaying midground crystals, and fine snow dust flurries with cyan winter atmosphere.
  6. Cloudy & Fog (`cloudy`, `fog`): Volumetric translucent cloud clusters with horizontal breeze streamlines, and multi-layered undulating sinusoidal mist waves.
  7. Design harmony: All effects rendered within the `-z-10` pointer-events-none background canvas and soft ambient vignettes, maintaining sharp contrast, zero layout interference, and full readability over `#050505`. Static production build verified clean (exit code 0). Checklist updated.
- 2026-11-17: Removed exaggerated yellow sun and top-of-page amber glow effects:
  1. Removed radiant sun core and flare corona canvas gradients (`sunGlow`) from Clear Day mode.
  2. Removed top-of-page CSS amber sun blob and background gradient (`amber-400`/`amber-500` blurred circle).
  3. Softened daytime floating particles into gentle, micro-opacity atmospheric motes with zero harsh yellow glow or shadows. All other weather modes (rain, thunderstorm, clear night, snow, fog, clouds) remain active and intact. Dev server verified responding 200 OK. Checklist updated.
- 2026-11-17: Moved the mobile speech bubble out of its full-width bar above the grid and into the tools column inside ToolButtons (self-end, w-[17rem], lg:hidden), directly above Walmart Product Hunter so the right-side tail points at it like the desktop bubble. Removed the page.tsx wrapper; typecheck clean.
- 2026-11-17: Lifted the mobile speech bubble so it clears the orbiting skill icons: wrapped in a positioned, right-aligned container that goes absolute (bottom-full + mb-4) above the tool list on viewports >=720px tall, else stays in flow to avoid clipping under the header. Verified at 320/360/375/390/430/700/1280 widths; tools buttons restored to vertical centering and typecheck/lint clean.
- 2026-11-17: Moved the weather control pill out of the fixed bottom-left corner and stacked it directly above the workspace callout bubble on both mobile and desktop. WeatherControlPill now portals into slot elements rendered by ToolButtons (one slot per breakpoint), the popover opens downward with a right-aligned menu, and the desktop tools rail gained room via lg:translate-y-10. Mobile keeps the bubble lifted above the orbit at >=800px viewport height; shorter screens keep it in flow. Typecheck/lint clean.
- 2026-11-17: Added standalone client-side PageSpeed helper lib/pagespeed.ts: getPageSpeedReport(url) prepends https:// when needed, calls the free PSI v5 runPagespeed endpoint with performance/seo/accessibility/best-practices, normalizes scores to 0-100, returns FCP/LCP/CLS numeric values, and throws typed PageSpeedError codes (invalid-url, rate-limit, timeout, network, api-error, invalid-response). No UI or design changes; verified with mocked payloads and live 429 handling; typecheck/lint clean.
- 2026-11-17: Added standalone client-side Remotive helper lib/remotive.ts: searchRemoteJobs(query) defaults to developer, calls the free keyless remotive.com/api/remote-jobs endpoint, caps results at 10, maps to id/title/salary/lastEdit/category/location/url, and resolves to [] on any failure. No UI or design changes; mocked + live tests pass, typecheck/lint clean.
- 2026-11-17: Job Hunter results now use the live keyless Remotive feed through lib/remotive.ts instead of mock agent listings. Removed the mock-data notice and [mock] pitch prefix, added real Rate / salary and Last edit lines plus Apply links, and dropped the redundant Remote-only checkbox (Remotive lists remote jobs only). Tool description updated. Verified live in the browser at 1280x900 and 390x844: 10 jobs, Remotive HTTP 200, salary shown, no mock wording, tsc/eslint clean.
- 2026-11-17: Job Hunter now searches OnlineJobs.ph instead of Remotive. Added server-side lib/onlinejobs.ts (fetches the public jobsearch HTML, parses up to 10 cards, 5-minute cache) and GET /api/jobs/onlinejobs (query validation + 10/min limit) because the site blocks cross-origin browser fetches. Results show real salary, job type, category, Philippines location, last edit date, and apply links. Verified live route and browser at 1280x900 and 390x844; tsc/eslint clean.
- 2026-11-17: Replaced Job Hunter's OnlineJobs.ph scraper with a compliance-safe link-out. The modal now builds the official jobsearch URL from the keyword and opens it in a new tab; removed lib/onlinejobs.ts and the /api/jobs/onlinejobs route because Vercel's Acceptable Use Policy prohibits scraping and OnlineJobs.ph Terms 7.4 prohibits automated access without express permission. No server fetch, no new dependencies, no API calls. Verified popup URL at 1280x900 and 390x844; tsc/eslint/build clean.
- 2026-11-17: Brought back Job Hunter fetching for portfolio demo per user request. Added server-side `lib/onlinejobs.ts` parser/fetch (keyword search, 20-result cap, 5-min cache, 12s timeout), repurposed `app/api/agents/jobs` + `lib/schemas/jobs.ts` to return `title`, `author` (employer name when shown on card/logo, else null), `rate`, and `url` plus posted/type/categories metadata, and updated `components/agents/JobsModal.tsx` to display fetched results. Removed unused legacy jobs agent/provider files. `npm run lint` and `npm run build` pass. Note: many listings don't expose employer name in search cards so Author may show "Not listed"; automated fetching may conflict with OnlineJobs.ph/Vercel terms in deployed environments.
- 2026-11-22: Fixed the orbital/profile intro speech being silent on mobile. `lib/speak.ts` now splits the 458-character intro into sentence-sized chunks (<=180 chars each) because Chrome/Android drops long utterances; it warms the voice list on mount (`prewarmSpeech` called from `ProfileOrbit`), listens for `voiceschanged`, calls `resume()` to clear Chrome's stuck-paused queue, pins `lang="en-US"` so Android picks a matching voice, and re-queues once after 900 ms only when the voice list was still empty at speak time (a healthy queue is never replayed). Utterances are still created synchronously inside the tap so iOS keeps the user gesture. Typecheck/lint clean.
- 2026-11-22: Mobile intro still silent after the speech-synthesis fix, so switched to a recorded clip as the primary playback path. Generated a normalized Cloudflare Deepgram Aura-2 (orion) narration and added `public/audio/intro.m4a` (AAC/MP4) plus `public/audio/intro.mp3` fallback. `lib/speak.ts` now exposes `prewarmIntro()` (buffers the clip and warms voices) and `playProfileIntro()` (reuses one `<audio>` element, restarts from 0, ignores double-tap `AbortError`, and only falls back to the existing chunked Web Speech path when the clip is missing or truly fails). `ProfileOrbit.tsx` prewarms on mount and both profile/orbit buttons call `playProfileIntro`. Verified with `npx tsc --noEmit`, `npm run lint`, and production build; committed and pushed after verification.
- 2026-11-22: Added Google Tag Manager container `GTM-P7KFPN4J` to the portfolio. The async `gtm.js` tag and the inline `dataLayer`/`gtag` bootstrap were added exactly once in the root layout (`app/layout.tsx`) inside `<head>`, so every page inherits one tag with no duplicate and no new dependency. Verified production HTML for `/` and `/_not-found`: one external GTM `<script>` and one inline bootstrap in `<head>` (the second raw-string match is only Next's RSC payload, not another DOM tag). `npx tsc --noEmit`, `npm run lint`, and `npm run build` clean.
