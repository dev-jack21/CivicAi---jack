# CivicAI — Agent Task Prompts

How to use this: work through the tasks in order. Each one is written to be pasted directly into Cursor or Claude Code, inside a repo that already contains `/docs/01_PRD.md`, `/docs/02_TECH_SPEC.md`, `/docs/03_ARCHITECTURE.md`, `/docs/04_DATABASE.md`, `/docs/05_SECURITY.md`, and `/docs/06_UI_UX_SPEC.md` at the root (or in a `/docs` folder — adjust the paths in the prompts if you place them elsewhere). Each prompt tells the agent which docs to read first, so don't skip that step even when it feels redundant.

Three corrections from the original docs are baked into the relevant prompts below rather than left for you to patch separately: the conflicting auth approach (the tech spec's file tree includes a NextAuth route, but the architecture and security docs both commit to Supabase Auth — Task 1.1 removes the ambiguity), a missing RLS policy that would silently break the public feedback list (Task 5.1), and the AI pipeline's serverless timeout exposure (Task 3.4 — see note below).

One correction to my earlier note on Vercel limits: I'd flagged a 10-second function timeout as a hard blocker. I checked current Vercel docs — Hobby plan functions can be configured up to 60 seconds via `maxDuration` (not the old 10s default), as long as you set it explicitly per route. Since `/api/process/summarize` and `/api/process/tts` are already two separate endpoints in your tech spec rather than one chained call, each one individually fits under that 60s ceiling for documents of reasonable length. You don't need a third-party queue for MVP — just explicit `maxDuration` config and a soft cap on document length. Task 3.4 below handles this.

---

## Phase 0 — Foundation

### Task 0.1 — Project scaffold

```
Read /docs/02_TECH_SPEC.md, specifically section 2 (Project Structure) and section 1 (Technology Stack).

Initialize a Next.js 15 project using the App Router with TypeScript and Tailwind CSS.
Recreate the exact folder structure from section 2 of /docs/02_TECH_SPEC.md, including the
route groups (auth), (public), (admin), and the api/ subfolders — but do NOT create the
app/api/auth/[...nextauth]/route.ts file or install next-auth. Authentication will be
handled entirely through Supabase Auth (see Task 1.1) — leave that route out of the
structure entirely.

Install: @supabase/supabase-js, @supabase/auth-helpers-nextjs, zod, react-hook-form,
@hookform/resolvers, lucide-react, pdf-parse, mammoth, @google/generative-ai, edge-tts, gtts.

Create an empty .env.local.example listing every variable from section 5 of
/docs/02_TECH_SPEC.md (Supabase, Gemini, TTS config, app URL — omit the NEXTAUTH_* variables
since we are not using NextAuth).

Set up ESLint + Prettier per section 1.4 of the tech spec. Do not write any business
logic yet — this task is scaffolding only. Confirm the project builds and runs locally
with `npm run dev` before finishing.
```

Done when: `npm run dev` serves an empty shell with the correct route groups, no NextAuth artifacts exist anywhere in the repo, and `.env.local.example` is complete.

---

### Task 0.2 — Database migrations (with the feedback RLS fix)

```
Read /docs/04_DATABASE.md in full.

Create the migration files exactly as listed in section 6 (Database Migrations
Strategy), using the SQL from sections 2, 3, and 4 of /docs/04_DATABASE.md for each
corresponding file. Use today's date as the migration date prefix.

In the file for RLS policies (20260620_006_rls_policies.sql), include all policies
exactly as written in section 3 of /docs/04_DATABASE.md, AND ALSO add this additional policy
that is missing from the source document — without it, the public feedback list
described in /docs/06_UI_UX_SPEC.md section 4.3 will return zero rows for any visitor who
isn't the comment's author or an admin:

CREATE POLICY "feedback: public read on published policies"
  ON public.feedback FOR SELECT
  USING (
    status != 'flagged'
    AND EXISTS (
      SELECT 1 FROM public.policies
      WHERE id = feedback.policy_id
      AND published_at IS NOT NULL
      AND status = 'ready'
    )
  );

Write a short comment above this policy explaining why it was added (the existing
"own read" and "admin read all" policies don't cover the public-facing feedback list).

Do not run these migrations yet — just create the files. Confirm each file is valid
SQL by reading it back and checking syntax.
```

Done when: all seven migration files exist under `supabase/migrations/`, syntactically valid, with the additional feedback policy included and commented.

---

### Task 0.3 — Supabase project + apply migrations

```
I have a Supabase project created with credentials in .env.local. Read /docs/04_DATABASE.md
and /docs/02_TECH_SPEC.md section 5 for the expected environment variables.

Using the Supabase CLI, link this local repo to the Supabase project and run
`supabase db push` to apply all migrations from Task 0.2 in order. After applying,
connect and verify:
- All five tables exist (profiles, categories, policies, feedback, processing_jobs)
- The categories table has the nine seed rows from /docs/04_DATABASE.md section 2.2
- RLS is enabled on all four user-facing tables
- The two storage buckets (policy-documents, policy-audio) exist with correct
  public/private settings

Report any migration errors and fix them before continuing. Do not proceed to other
tasks until this is confirmed working.
```

Done when: the agent reports a clean `supabase db push` and confirms all five checks above pass.

---

### Task 0.4 — Deploy empty shell

```
Connect this repo to a new Vercel project. Set up the three environments described in
/docs/03_ARCHITECTURE.md section 4 (Environment Strategy) — dev, staging, production —
matching branches dev, staging, and main.

Add all environment variables from .env.local.example as Vercel project environment
variables (use a placeholder value for the Gemini key for now since that
aren't being used yet).

Push to main and confirm the empty shell deploys successfully and is reachable at the
production URL. This is just to prove the deployment pipeline works before any real
features are built on top of it — don't add functionality here.
```

Done when: the empty app shell is live on Vercel and the three-branch environment strategy is configured.

---

## Phase 1 — Auth & Admin Shell

### Task 1.1 — Supabase Auth integration

```
Read /docs/05_SECURITY.md sections 2.1 and 2.2 in full, and /docs/04_DATABASE.md section 2.1
(the profiles table and auto-create trigger).

Implement authentication using Supabase Auth directly — no NextAuth. Build:
1. lib/supabase/client.ts and lib/supabase/server.ts per /docs/02_TECH_SPEC.md section 2
2. /login and /register pages under app/(auth)/, using react-hook-form + zod for
   validation
3. Email/password signup and login using supabase.auth.signUp() and
   supabase.auth.signInWithPassword()
4. Google OAuth login using supabase.auth.signInWithOAuth({ provider: 'google' })
5. A logout action that calls supabase.auth.signOut()

Sessions must be stored in httpOnly cookies via the auth-helpers package, not
localStorage — this is a hard requirement from /docs/05_SECURITY.md section 2.1.

After signup, confirm a row is automatically created in public.profiles via the
trigger from /docs/04_DATABASE.md — do not manually insert profile rows from the client.
```

Done when: a user can register, confirm a profiles row was created automatically, log in with email/password, log in with Google, and log out — with no client-side token storage.

---

### Task 1.2 — Route protection middleware

```
Read /docs/05_SECURITY.md section 2.2 (the middleware.ts example) and section 2.3 (the RBAC
table).

Implement middleware.ts exactly per the pattern in /docs/05_SECURITY.md section 2.2: protect
all routes under /admin by checking for a valid session and an admin role on the
profiles table, redirecting to /login or /unauthorized as appropriate. Leave public
routes (/, /policies, /policies/[id]) and authenticated-but-non-admin routes (/profile,
feedback submission) open to any logged-in user per the RBAC table.

Write a basic test plan (can be manual, listed in a comment or README) covering all
six rows of the RBAC table in /docs/05_SECURITY.md section 2.3, and confirm each one
behaves as specified by testing manually with one admin and one citizen account.
```

Done when: the six RBAC scenarios from the security doc all behave correctly when tested manually.

---

### Task 1.3 — Admin shell layout

```
Read /docs/06_UI_UX_SPEC.md sections 2 and 3.2 for the page map and navigation structure.

Build the admin layout shell under app/(admin)/: a persistent sidebar or top nav
listing Dashboard, Upload, Policies, Feedback, matching the /admin, /admin/upload,
/admin/policies, /admin/feedback routes from /docs/06_UI_UX_SPEC.md section 3.2. Use the
color palette and typography from /docs/06_UI_UX_SPEC.md section 2.1 and 2.2.

Each page can be a placeholder for now (just a heading and "coming soon") except the
layout chrome itself, which should be fully built and should only render for users
who pass the admin check from Task 1.2.
```

Done when: an admin user sees the full admin shell with working navigation between four placeholder pages; a non-admin user is redirected away.

---

## Phase 2 — Document Upload (AI stubbed)

### Task 2.1 — File upload + validation

```
Read /docs/05_SECURITY.md section 3 (Input Validation, including the validateUpload
function) and /docs/04_DATABASE.md section 4 (storage buckets and RLS).

Build POST /api/upload exactly per /docs/02_TECH_SPEC.md section 3.1: accepts a file,
validates it against the ALLOWED_TYPES and MAX_FILE_SIZE constants from
/docs/05_SECURITY.md section 3 (PDF/DOCX only, 20MB max), sanitizes the filename using the
regex from /docs/05_SECURITY.md section 6, and uploads it to the policy-documents bucket in
Supabase Storage. Return the storage URL.

Reject any request from a non-admin session (use the same role check pattern from
Task 1.2). Return the structured error format from /docs/02_TECH_SPEC.md section 6 for
every failure case (FILE_TOO_LARGE, UNSUPPORTED_FORMAT, UNAUTHORIZED).
```

Done when: an admin can upload a valid PDF/DOCX and receive a storage URL; oversized files, wrong file types, and non-admin requests are all rejected with the correct error codes.

---

### Task 2.2 — Policy CRUD API

```
Read /docs/02_TECH_SPEC.md section 3 (full API design) and /docs/04_DATABASE.md section 2.3 (the
policies table schema).

Build the policies API routes: GET /api/policies (paginated list, public), POST
/api/policies (admin only, creates a row with status 'pending' referencing the
document_url from Task 2.1), GET /api/policies/:id, and DELETE /api/policies/:id
(admin only). Validate the POST body against the policyUploadSchema from
/docs/05_SECURITY.md section 3.

Match the request/response shapes exactly as shown in /docs/02_TECH_SPEC.md section 3.2.
Do not trigger any AI processing yet — POST should just create the row and return it
with status 'pending'.
```

Done when: an admin can create, fetch, list, and delete policy rows via the API, with response shapes matching the tech spec examples.

---

### Task 2.3 — Admin upload form UI

```
Read /docs/06_UI_UX_SPEC.md section 4.4 (the upload page wireframe) and section 2.4
(button and form input component styles).

Build the /admin/upload page matching the wireframe in /docs/06_UI_UX_SPEC.md section 4.4:
title, ministry dropdown (populate from the categories table — note ministry is
free-text in the schema while category is a dropdown referencing categories.id, don't
conflate the two), description, effective date, and a drag-and-drop file zone. Wire
it to the upload (Task 2.1) and policy creation (Task 2.2) endpoints in sequence:
upload the file first, then create the policy row with the returned document_url.

Show the file size/type constraints in the UI text exactly as in the wireframe ("Max
20MB | PDF and DOCX only"). Use react-hook-form + zod, matching the validation
schemas from /docs/05_SECURITY.md section 3 on the client side too, not just server side.
```

Done when: an admin can fill out the form, upload a file, and see the new policy appear with status "pending" — with client-side validation matching the server-side rules.

---

### Task 2.4 — Stub AI processing + status display

```
Read /docs/02_TECH_SPEC.md section 4 (the AI pipeline) and /docs/04_DATABASE.md section 2.5
(processing_jobs table) — we are NOT calling Gemini or TTS yet in this task,
just building the scaffolding around it.

After a policy is created (Task 2.2/2.3), insert two rows into processing_jobs
(job_type 'summarize' and 'tts', both status 'pending'). Build a stub version of
POST /api/process/summarize that, instead of calling Gemini, waits 2 seconds and
writes a hardcoded placeholder summary to the policy row, updates the summarize job
to 'done', and updates policy status to 'processing' → triggers the stub
/api/process/tts the same way, which writes a hardcoded placeholder audio_url and
flips policy status to 'ready'.

On /admin/policies, show each policy's status (pending/processing/ready/failed)
matching FR-16 from /docs/01_PRD.md, polling the API every few seconds until status is
'ready' or 'failed'.
```

Done when: uploading a policy through the full stub pipeline results in status moving from pending → processing → ready, with a placeholder summary visible, entirely without any real API calls — this proves the status-tracking UX before real AI cost is introduced.

---

## Phase 3 — Real AI Pipeline

### Task 3.1 — Text extraction

```
Read /docs/02_TECH_SPEC.md section 1.2 (pdf-parse, mammoth) and section 4 (pipeline
overview, step 2).

Build lib/parsers/pdf.ts and lib/parsers/docx.ts as described in
/docs/02_TECH_SPEC.md section 2 (project structure). Each should accept a file buffer (or
storage URL — fetch it server-side) and return extracted plain text. Handle the case
where pdf-parse returns very little or no text (common with scanned/image-based PDFs)
by returning a clear error rather than silently passing an empty string forward —
this is a realistic risk for Kenyan ministry PDFs and should fail loudly, not
silently produce a garbage summary.

Write a quick manual test using a real multi-page PDF and a real DOCX file (not the
hardcoded stub from Task 2.4) and confirm extracted text length and a text sample
both look correct before moving on.
```

Done when: both parsers return real extracted text from real files, and a near-empty extraction result triggers a clear error rather than continuing silently.

---

### Task 3.2 — Gemini summarization (already implemented)

```
Already done. Uses Gemini 2.0 Flash via @google/generative-ai.
See /src/lib/ai/summarize.ts — chunks at 4000 tokens, merges multi-chunk summaries,
throws on empty input. API key: GEMINI_API_KEY in .env.local.

If re-running: verify GEMINI_API_KEY is set in .env.local first.
```

---

### Task 3.3 — Text-to-speech (already implemented)

```
Already done. See /src/lib/ai/tts.ts — primary engine is edge-tts (Kenyan English voice
en-KE-AsiliaNeural), fallback is gTTS (no API key). Falls through both engines before
throwing. Configurable via TTS_PRIMARY_ENGINE env var.

The API route integration (POST /api/process/tts calling this, uploading to Supabase,
updating processing_jobs) still needs to be wired up — this task built the library layer only.
```

---

### Task 3.4 — Pipeline orchestration check

```
This is a verification task, not a build task — read /docs/03_ARCHITECTURE.md section 3.1
(upload flow) and confirm the current implementation matches it.

Trace through the full chain: admin uploads → policy created (pending) →
/api/process/summarize runs (maxDuration 60, real Gemini call) → on success, server-side
triggers /api/process/tts (maxDuration 60, real edge-tts/gTTS call) → policy status
becomes 'ready'. Confirm these are two genuinely separate function invocations, not
one function that calls both inline — if they're combined into a single route
handler, split them, because a combined call risks exceeding even the 60s Hobby
ceiling on longer documents.

Time a real run end-to-end with a multi-page real-world policy PDF and report actual
summarize and TTS durations. If either step is regularly running past ~40 seconds,
flag it now — that's the threshold where you should consider trimming the chunk size
or word limit further rather than waiting until it intermittently times out in
production.
```

Done when: the two steps are confirmed as separate function calls, both under maxDuration, and you have real timing numbers from an actual document.

---

## Phase 4 — Public-Facing UI & Accessibility

### Task 4.1 — Public policy listing

```
Read /docs/06_UI_UX_SPEC.md section 4.2 (listing page wireframe) and /docs/02_TECH_SPEC.md
section 3.1 (GET /api/policies).

Build /policies matching the wireframe: search bar, category and ministry filter
dropdowns, paginated grid of policy cards (badge, ministry, title, upload date,
summary excerpt, audio-available indicator, feedback count, Read Summary / Listen
links). Use the GET /api/policies endpoint with query params for search/filter/page.
Only show policies where published_at is set and status is 'ready' — this should
already be enforced by RLS but verify it server-side too as defense in depth.

Use ISR (Incremental Static Regeneration) per the performance notes in
/docs/02_TECH_SPEC.md section 7.
```

Done when: the public listing page matches the wireframe, search and filters work, and unpublished/non-ready policies never appear regardless of how the page is queried.

---

### Task 4.2 — Policy detail + audio player

```
Read /docs/06_UI_UX_SPEC.md section 4.3 (detail page wireframe), section 5.2 (audio
keyboard controls table), and section 5.3 (screen reader markup examples).

Build /policies/[id]: header with category/ministry/effective date, download
original button, the three-section AI summary, and a custom audio player component
(components/policy/AudioPlayer.tsx per /docs/02_TECH_SPEC.md section 2) implementing every
keyboard control from /docs/06_UI_UX_SPEC.md section 5.2 (Space, arrow keys, M, Home, End)
and using the exact aria-label pattern from section 5.3. Do not use a generic
third-party audio embed that doesn't support custom keyboard handling — the
accessibility requirements are specific enough that you need control over the
markup.
```

Done when: the detail page matches the wireframe and every keyboard shortcut in the spec table works as described, verified manually with keyboard-only navigation (no mouse).

---

### Task 4.3 — Accessibility pass

```
Read /docs/06_UI_UX_SPEC.md section 5.1 (the full WCAG 2.1 AA checklist) in full.

Go through every page built so far (home, policies listing, policy detail, login,
register) against each of the ten criteria in that checklist one by one — not as a
general impression, but checking each specific criterion (alt text, semantic
landmarks, 4.5:1 contrast, full keyboard operability, skip nav, focus order, visible
focus rings, lang attribute, form error roles, ARIA on custom components). Fix
anything that fails. Add the skip navigation link from section 5.3 to the root
layout if it isn't already there.

Report which criteria required fixes and what was changed.
```

Done when: all ten WCAG criteria from the checklist pass on every page built so far, with a written list of what was fixed.

---

### Task 4.4 — Mobile responsiveness

```
Read /docs/06_UI_UX_SPEC.md section 6 (breakpoints and touch target requirements).

Test and fix every page built so far at the three breakpoints in section 6 (under
640px, 640–1024px, over 1024px). Confirm: no horizontal scroll at any breakpoint,
single-column layout on mobile, the policy grid adapts from 1 to 2 to 3 columns
across breakpoints, all touch targets are at least 44×44px, the audio player is
full-width with large controls on mobile, and the nav collapses to a keyboard-
accessible hamburger menu below 640px.
```

Done when: all five checks above pass at all three breakpoints.

---

## Phase 5 — Feedback System

### Task 5.1 — Verify feedback RLS

```
This is a verification task. Read /docs/04_DATABASE.md section 3 (feedback RLS policies)
together with the additional policy added in Task 0.2.

Using two test accounts (a regular citizen and an admin) plus an unauthenticated
session, confirm: an unauthenticated visitor can read feedback on a published policy
but cannot insert any; a logged-in citizen can read their own feedback plus all
public feedback on published policies, but cannot read other users' feedback on
unpublished/draft policies; an admin can read everything including flagged feedback.
If any of these fail, the RLS policies need fixing before continuing — do not patch
this with application-layer filtering instead, the whole point of RLS is that it
holds even if the API has a bug.
```

Done when: all three access scenarios above are confirmed working at the database level, not just in the UI.

---

### Task 5.2 — Feedback submission

```
Read /docs/01_PRD.md FR-22 through FR-25, and /docs/05_SECURITY.md section 3 (the feedbackSchema
validator).

Build POST /api/policies/:id/feedback per /docs/02_TECH_SPEC.md section 3.1: requires auth,
validates content length (10–2000 chars) against feedbackSchema, enforces one
feedback per user per policy (the unique index from /docs/04_DATABASE.md already enforces
this at the DB level — surface that constraint violation as a friendly error rather
than a raw DB error). Build the FeedbackForm component
(components/feedback/FeedbackForm.tsx) on the policy detail page, showing "Login to
submit your feedback" for unauthenticated users per the wireframe in
/docs/06_UI_UX_SPEC.md section 4.3.
```

Done when: a logged-in citizen can submit one feedback per policy, a second attempt on the same policy is rejected with a clear message, and logged-out users see the login prompt instead of the form.

---

### Task 5.3 — Public feedback display

```
Read /docs/06_UI_UX_SPEC.md section 4.3 (the feedback list portion of the wireframe).

Add the public feedback list to the policy detail page, showing author name (or a
privacy-conscious display name if you'd rather not show full names — note /docs/05_SECURITY.md
section 7 commits to data minimization, so check whether full_name should be shown
publicly versus a first-name-only or initials display) and submission date for each
non-flagged comment on published policies, relying on the RLS policy from Task 0.2/5.1
rather than an application-layer filter.
```

Done when: the public feedback list renders correctly relying solely on RLS, and a deliberate decision has been made (and noted in a comment) about how much of the author's identity is displayed publicly.

---

### Task 5.4 — Admin feedback dashboard

```
Read /docs/01_PRD.md FR-24 and FR-25, and /docs/06_UI_UX_SPEC.md section 3.2 (/admin/feedback).

Build /admin/feedback: a table of all feedback across all policies (components/admin/
FeedbackTable.tsx), filterable by status (unreviewed/reviewed/flagged) and by policy,
with an action to mark feedback as reviewed (PATCH /api/feedback/:id, admin only,
matching /docs/02_TECH_SPEC.md section 3.1).
```

Done when: an admin can view, filter, and mark feedback as reviewed from a single dashboard page.

---

## Phase 6 — Security Hardening & Deployment

### Task 6.1 — Security headers fix

```
Read /docs/05_SECURITY.md section 5.2 and 5.3 (CORS and security headers).

Implement the headers from section 5.3 in next.config.ts, with one change from the
source doc: do not include 'unsafe-eval' in the script-src directive of the
Content-Security-Policy — Next.js 15 production builds don't require it. If you hit
a genuine CSP violation in dev mode because of this, scope 'unsafe-eval' to
development only (e.g. via an environment check), never to the production CSP.
Implement the CORS config from section 5.2 as well, using NEXT_PUBLIC_APP_URL.
```

Done when: security headers are live in production, CSP does not include `unsafe-eval` in the production build, and the app still functions correctly under the tightened policy.

---

### Task 6.2 — Rate limiting

```
Read /docs/05_SECURITY.md section 5.1 (rate limiting). Note the in-memory Map approach
shown there won't survive across serverless function instances on Vercel — each
invocation may get a fresh instance, so the naive implementation is mostly
decorative in production.

Implement rate limiting using Vercel's Edge Config or a lightweight external store
(Upstash Redis has a free tier and is the common pairing with Vercel) so the 100
req/min per IP limit from the doc actually holds across function instances, not just
within a single warm instance. Apply it in middleware.ts to API routes.
```

Done when: rate limiting demonstrably persists across multiple separate requests/instances, not just within one warm function.

---

### Task 6.3 — Dependency audit

```
Run npm audit per /docs/05_SECURITY.md section 8. Fix any high or critical vulnerabilities
with npm audit fix, manually reviewing any fix that involves a major version bump
before accepting it (major bumps can break things silently). Enable GitHub Dependabot
on the repo per the same section. Report any vulnerabilities that couldn't be
auto-fixed and why.
```

Done when: no high/critical vulnerabilities remain unaddressed, and Dependabot is active on the repo.

---

### Task 6.4 — Staging deploy + full regression pass

```
Deploy the current state of main to the staging environment configured in Task 0.4.
Using /docs/01_PRD.md section 8 (User Stories US-01 through US-07), manually walk through
every single user story end-to-end on staging — not localhost — and confirm each one
works exactly as described, including a real document upload through the real AI
pipeline. Report any story that fails on staging but worked locally, since that gap
usually points to an environment variable or timeout issue specific to production.
```

Done when: all seven user stories from the PRD pass on the staging deployment.

---

### Task 6.5 — Production cutover

```
Read /docs/03_ARCHITECTURE.md section 4 (deployment architecture and environment
strategy) once more.

Merge staging to main, confirm the production deployment at the live URL, and do a
final pass through the KPI targets in /docs/01_PRD.md section 3.2 that are testable
pre-launch: page load time under 4 seconds on a throttled 3G connection (use Chrome
DevTools network throttling) and confirm NFR-01 through NFR-08 from section 7 of
/docs/01_PRD.md are each either met or explicitly logged as a known gap for post-launch.
```

Done when: production is live and every NFR from the PRD has either been verified or explicitly documented as an open item.

---

## Quick reference — task order and rough effort

Phase 0 (foundation) and Phase 1 (auth) are sequential and should be done by one person before the team splits up, since everything else depends on them. From Phase 2 onward, the document-upload track (2.x → 3.x) and the public-UI track (4.x) can run in parallel once Task 2.4's stub pipeline is in place — that stub is what lets the public-UI person build against realistic-looking data without waiting on real Gemini/TTS integration. Phase 5 (feedback) only needs Phase 1 (auth) and the policy detail page from 4.2, so it can also start early if someone's free. Phase 6 should be a final pass done by the whole team together rather than delegated to one person, since it touches every part of the app.
