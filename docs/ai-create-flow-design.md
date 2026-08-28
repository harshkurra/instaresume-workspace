# "Create with AI" Flow — Design Spec

New dialog for zero state — replaces the existing "Tailor resume as per job
description" dialog when triggered from the zero state hero card.

The existing tailor dialog stays unchanged for its current use case (tailoring an
existing resume to a JD). This is a separate, new entry point.

---

## Problem with the current dialog for zero state

The "Tailor your resume as per job description" dialog has these issues when used
as a first-resume creation flow:

1. **Wrong framing** — "Tailor" implies the user already has a resume to tailor.
2. **JD required** — a zero state user doesn't have a job they're targeting yet.
3. **Long scrollable form** — YOUR DETAILS → JOB INFORMATION → YOUR RESUME →
   Experience → Education is overwhelming for a cold start.
4. **Cluttered inputs** — phone, writing style, email distract from the core ask.

---

## Competitive Reference — resume.io

resume.io's AI flow (studied 2026-08-28):

| Screen | Content | Skip? |
|---|---|---|
| 1 | LinkedIn profile URL | Yes |
| 2 | Work experience (title + company + dates, up to 3) | No |
| 3 | Desired job title | No |
| 4 | Education (institution + degree + dates) | Yes |
| 5 | Skills (tag input with suggestions) | Yes |
| 6 | Professional highlights (voice or text) | Yes |
| 7 | Career goals (voice or text) | Yes |
| 8 | "AI Assistant at work" loading screen | — |

**What they got right:**
- One focused question per screen — zero cognitive load per step
- Progress bar with `% Completed` — builds commitment momentum
- Skip on every optional step — removes anxiety
- Voice input on open-ended steps — talking is faster than typing

**What's too much for our context:**
- 7 data-collection screens before generating — too long for a zero state user
  who hasn't committed yet
- LinkedIn scraping — technically complex (third-party service), skip for now
- Voice input — interesting future roadmap item but not MVP

---

## Our Approach — 3-Step Flow

**Design principles borrowed from resume.io:**
- `✦ AI-powered Resume` badge at top of every screen (trust signal)
- One focused heading per screen, large and centred
- Progress bar with `% Completed` at the bottom
- Back / Skip / Continue button pattern
- Skip available on steps 2 and 3

**What we keep lean:**
- 3 screens max (vs. resume.io's 7+)
- Upload path on step 2 skips step 3 entirely → generate immediately
- No voice input in MVP

---

### Step 1 — Who You Are
*Required. ~10 seconds.*

```
┌──────────────────────────────────────────────┐
│  ✕                                           │
│                                              │
│         ✦ AI-powered Resume                  │
│                                              │
│    Let's build your resume                   │
│    Tell us your role — we'll write           │
│    the rest.                                 │
│                                              │
│  First name (optional)                       │
│  ┌────────────────────────────────────┐     │
│  │  e.g. Brian                        │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Job title *                                 │
│  ┌────────────────────────────────────┐     │
│  │  e.g. Software Engineer            │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Experience level                            │
│  [Fresher] [0–2 yrs] [2–5 yrs]             │
│  [5–10 yrs] [10+ yrs]                       │
│                                              │
│                         [Continue →]         │
│                                              │
│  ○ 0% Completed  ▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱       │
└──────────────────────────────────────────────┘
```

**Fields:**
- First name — optional, personalises the resume header
- Job title — required, "Continue" disabled until non-empty
- Experience level — single-select chip group, defaults to nothing selected
  (AI infers from context if skipped)

**UX notes:**
- No email, phone, last name — fill in the builder later
- Chips are mutually exclusive, teal fill on selection
- Progress: 0%

---

### Step 2 — Your Background
*Optional. Two mutually exclusive paths.*

```
┌──────────────────────────────────────────────┐
│  ← Back                                   ✕  │
│                                              │
│         ✦ AI-powered Resume                  │
│                                              │
│    Add your background                       │
│    More context = better resume.             │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  📄  Drop your resume here           │   │
│  │      PDF · DOCX · TXT               │   │
│  │      [Browse files]                  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ────────────────── or ───────────────────   │
│                                              │
│  Add your top jobs (up to 3)                 │
│                                              │
│  Job title        Company        From   To   │
│  ┌──────────┐  ┌──────────┐  ┌──┐  ┌──┐   │
│  │          │  │          │  │  │  │  │   │
│  └──────────┘  └──────────┘  └──┘  └──┘   │
│  + Add another job                          │
│                                              │
│  [Back]          [Skip]      [Continue →]    │
│                                              │
│  ● 33% Completed  ▓▓▓▓▓▱▱▱▱▱▱▱▱▱▱▱▱▱       │
└──────────────────────────────────────────────┘
```

**Two paths (mutually exclusive):**

**Path A — Upload:**
- Drop zone accepting PDF / DOCX / TXT
- On upload → file name shown, manual job entry section hides
- "Continue" goes straight to generate (skips step 3), because the file
  already contains education and skills

**Path B — Manual jobs:**
- Inline compact row: Job title | Company | From MM/YYYY | To MM/YYYY (or "Present")
- "+ Add another job" adds a second row, max 3
- At least one job title must be non-empty to enable "Continue" on this path
- No descriptions — AI writes those

**UX notes:**
- Upload and manual are mutually exclusive — selecting one clears the other
- "Skip" is valid — generates a role-appropriate resume with just step 1 data
- Progress: 33%

---

### Step 3 — Quick Extras
*Optional. Skip available on each sub-section.*

```
┌──────────────────────────────────────────────┐
│  ← Back                                   ✕  │
│                                              │
│         ✦ AI-powered Resume                  │
│                                              │
│    Almost there                              │
│    Optional extras that improve the draft.   │
│                                              │
│  Education (optional)                        │
│  ┌────────────────────────────────────┐     │
│  │  Institution name                  │     │
│  └────────────────────────────────────┘     │
│  ┌────────────────────────────────────┐     │
│  │  Degree / field of study           │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Top skills (optional)                       │
│  [React ×] [Node.js ×] [Python ×]  [+ Add] │
│  Suggestions: TypeScript · AWS · Docker      │
│                                              │
│  Anything else? (optional)                   │
│  ┌────────────────────────────────────┐     │
│  │  Achievements, certs, career       │     │
│  │  goals, anything relevant…         │     │
│  └────────────────────────────────────┘     │
│                                              │
│  [Back]               [Generate Resume ✦]   │
│  Credits: 1                                  │
│                                              │
│  ● 66% Completed  ▓▓▓▓▓▓▓▓▓▱▱▱▱▱▱▱▱▱       │
└──────────────────────────────────────────────┘
```

**Fields:**
- Education — institution name + degree (one entry, no dates needed)
- Skills — tag chip input; suggestions generated from job title on the frontend
  (static map: `{ "Software Engineer": ["React", "Node.js", "Python", …] }` to
  start; can later be AI-generated)
- Free-text — achievements, certifications, career goals, anything they want
  the AI to know

**UX notes:**
- All three sub-sections are individually optional — "Generate" always enabled
- Skills suggestions based on job title from step 1 (hardcoded map for MVP)
- Progress: 66%

---

### Loading Screen
*After Generate is clicked.*

```
┌──────────────────────────────────────────────┐
│                                              │
│              ✦                              │
│           ═══════                            │
│              +                               │
│                                              │
│      Building your resume…                   │
│   You can still edit everything after.       │
│                                              │
│  ● 100% Completed  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │
└──────────────────────────────────────────────┘
```

Reuse the existing `tailorResumeLoaderDialog` — just update the heading copy.

---

## Backend Changes

### New endpoint

```
POST /secure/generative-ai/resume/create
```

**Request body:**
```json
{
  "firstName": "Brian",
  "jobTitle": "Software Engineer",
  "experienceLevel": "2-5 years",
  "workExperiences": [
    { "title": "Frontend Developer", "company": "Acme Inc", "from": "Jan 2022", "to": "Present" }
  ],
  "resumeText": "...",         // if file uploaded — extracted text (replaces workExperiences)
  "education": { "institution": "MIT", "degree": "B.Sc Computer Science" },
  "skills": ["React", "Node.js", "Python"],
  "additionalContext": "..."   // free-text from the "anything else" field
}
```

**AI prompt framing** (different from the tailor prompt):
> "Generate a complete, ATS-friendly resume in JSON format for a [experienceLevel]
> [jobTitle] named [firstName]. Use the background information provided to write
> specific, achievement-focused bullet points. Where background is missing,
> write strong, realistic placeholder content appropriate for the experience level
> and role. Do not mention that content is placeholder."

**Response:** same resume JSON format as the existing tailor endpoint
```json
{
  "text": { ...resumeJSON },
  "credits": 0,
  "resumeId": "abc123"
}
```

**Credit cost:** 1 (same as tailor)

### Reuse what you can

| Existing piece | Reused how |
|---|---|
| `extractTextFromPdf` | PDF/DOCX/TXT → resumeText on upload |
| Resume JSON save + navigate to builder | Identical post-success flow |
| Credit deduction middleware | No changes |
| `tailorResumeLoaderDialog` | Loading screen, updated copy only |

---

## Frontend File Plan

| File | Action |
|---|---|
| `src/pages/Resumes/createResumeDialog/index.js` | Create — orchestrates 3 steps + state |
| `src/pages/Resumes/createResumeDialog/StepRole.js` | Create — step 1 |
| `src/pages/Resumes/createResumeDialog/StepBackground.js` | Create — step 2 (upload or manual jobs) |
| `src/pages/Resumes/createResumeDialog/StepExtras.js` | Create — step 3 (education, skills, free-text) |
| `src/pages/Resumes/createResumeDialog/ProgressBar.js` | Create — shared % progress footer |
| `src/utils/service.js` | Edit — add `createResumeWithAI()` |
| `src/utils/index.js` | Edit — add `dialogKeys.createResumeDialog` |
| `src/pages/Resumes/ResumeDialogs.js` | Edit — mount new dialog |
| `src/pages/Resumes/resumes.js` | Edit — zero state hero onClick → new key |
| `src/pages/Resumes/MobileCreateSheet.js` | Edit — "Tailor" stays; new key for zero state |

---

## Comparison

| | Existing "Tailor" dialog | resume.io | New "Create" dialog |
|---|---|---|---|
| Screens | 1 long scroll | 7+ | 3 focused |
| JD field | Required | None | None |
| Experience level | Not asked | Via work history | Chip selector |
| Work history | Optional accordion | Required (1+) | Optional (up to 3 rows) |
| Education | Optional accordion | Optional | Optional (1 entry) |
| Skills | Not asked | Tag input | Tag input + suggestions |
| Voice input | No | Yes | No (future item) |
| LinkedIn | No | Yes (step 1) | No (future item) |
| Upload path | Yes (PDF only) | No | Yes (PDF/DOCX/TXT), skips step 3 |
| Progress indicator | No | Yes (%) | Yes (%) |
| Skip available | No | Most steps | Steps 2 and 3 |

---

## Future Items (not MVP)

- **Voice input** — Web Speech API or OpenAI Whisper for the free-text field
- **LinkedIn URL** — third-party parsing service; surface as optional step 0
- **AI-generated skill suggestions** — call backend with job title, get ranked
  skills list instead of a static map

---

## Open Questions

1. Should "Create with AI" from the **create menu** (when user already has resumes)
   go to this new dialog or the existing tailor dialog?
   *Recommendation: existing tailor dialog — different intent.*

2. Skill suggestions for MVP — static job→skills map in the frontend, or a
   lightweight backend call?

3. Should the upload path on step 2 skip step 3, or always show step 3?
   *Recommendation: skip step 3 — the file already has the education/skills data.*
