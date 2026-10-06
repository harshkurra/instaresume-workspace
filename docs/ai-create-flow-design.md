# AI Resume Dialog — Design Spec

One unified dialog, two modes:
- **`create` mode** — zero state hero card; JD optional and collapsed by default
- **`tailor` mode** — "Tailor an existing resume" in the create menu; JD required
  and prominent; background steps skipped since the user already has a resume

The existing old tailor dialog (`buildResumeFromJobDescription.js`) gets retired
once this is shipped.

---

## Problem with the current dialog

1. **Wrong framing for zero state** — "Tailor your resume as per job description"
   implies the user already has a resume.
2. **JD always required** — a zero state user doesn't have a target job yet.
3. **Long scrollable form** — all sections stacked in one scroll; overwhelming.
4. **Can't be reused** — create and tailor are different components with duplicated
   logic.

---

## Competitive Reference — resume.io

| Screen | Content | Skip? |
|---|---|---|
| 1 | LinkedIn profile URL | Yes |
| 2 | Work experience (title + company + dates, up to 3) | No |
| 3 | Desired job title | No |
| 4 | Education | Yes |
| 5 | Skills (tag input with suggestions) | Yes |
| 6 | Professional highlights (voice or text) | Yes |
| 7 | Career goals (voice or text) | Yes |
| 8 | "AI at work" loading screen | — |

**Borrowed:** one question per screen, `% Completed` progress bar, Skip on optional
steps, `✦ AI-powered Resume` badge.

**Not borrowed (MVP):** LinkedIn, voice input, 7+ screens.

---

## Unified Dialog — Mode Behaviour

| | `create` mode | `tailor` mode |
|---|---|---|
| Trigger | Zero state hero card | "Tailor an existing resume" in create menu |
| Steps | 3 | 3 |
| Step 1 | Who you are (name, email, job title, experience chips) | Who you are (name, email, job title) — same screen, pre-filled from profile |
| Step 2 | Background (upload OR manual job rows) | Job description (required) + highlight hint |
| Step 3 | Extras (education, skills, free-text) + optional JD (collapsed) | Resume source (pick existing / upload / manual) |
| JD field | Optional, collapsed in Step 3 | Required, Step 2 hero |
| Resume source | Upload or manual rows | Pick from InstaResume OR upload OR manual |
| Personal details | Step 1 | Step 1 (pre-filled from Firebase profile if available) |
| CTA label | `Generate Resume ✦` | `Tailor Resume ✦` |
| Backend endpoint | `POST /secure/generative-ai/resume/create` (new) | `POST /secure/generative-ai/resume/tailor/jd` (existing) |
| Credits | 1 | 1 |

---

## Create Mode — 3 Steps

### Step 1 — Who You Are
*Required. ~10 seconds.*

```
┌──────────────────────────────────────────────┐
│  ✕                                           │
│         ✦  AI-powered Resume                 │
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
│  ○ 0% Completed  ░░░░░░░░░░░░░░░░░░         │
└──────────────────────────────────────────────┘
```

- First name optional, job title required
- Experience chips: single select, none required (AI infers if blank)
- Progress: 0%

---

### Step 2 — Your Background
*Optional. Two mutually exclusive paths.*

```
┌──────────────────────────────────────────────┐
│  ← Back                                   ✕  │
│         ✦  AI-powered Resume                 │
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
│  ─────────────────── or ──────────────────   │
│                                              │
│  Add your top jobs (up to 3)                 │
│  Job title    Company     From      To        │
│  ┌────────┐ ┌────────┐ ┌──────┐ ┌──────┐   │
│  └────────┘ └────────┘ └──────┘ └──────┘   │
│  + Add another job                           │
│                                              │
│  [Back]         [Skip]       [Continue →]    │
│  ● 33% Completed  ████░░░░░░░░░░░░░░░       │
└──────────────────────────────────────────────┘
```

- **Upload path**: file parsed → extracted text sent to API; skips Step 3 and goes
  straight to generate (file already has education + skills)
- **Manual path**: inline rows — job title + company + from/to, up to 3 entries;
  no bullet points (AI writes those)
- Upload and manual are mutually exclusive
- "Skip" generates from Step 1 data only
- Progress: 33%

---

### Step 3 — Quick Extras + Optional JD
*Optional throughout.*

```
┌──────────────────────────────────────────────┐
│  ← Back                                   ✕  │
│         ✦  AI-powered Resume                 │
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
│  [React ×] [Node.js ×]  [+ Add skill]       │
│  Suggested: TypeScript · AWS · Docker        │
│                                              │
│  Anything else? (optional)                   │
│  ┌────────────────────────────────────┐     │
│  │  Achievements, certs, career goals │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ▼  Targeting a specific job? (optional)     │  ← collapsed by default
│  ┌────────────────────────────────────┐     │
│  │  Paste the job description here…   │     │
│  │                                    │     │
│  └────────────────────────────────────┘     │
│  AI will tailor your resume to this role.    │
│                                              │
│  [Back]              [Generate Resume ✦]     │
│  Credits: 1                                  │
│  ● 66% Completed  ████████░░░░░░░░░         │
└──────────────────────────────────────────────┘
```

- Education: institution + degree (one entry, no dates)
- Skills: tag chip input; suggestions from a static job→skills map (MVP)
- Free-text: open field for achievements, certs, career goals
- **JD section**: collapsed by default with label "Targeting a specific job?";
  expands to a full textarea; helper text explains what it does
- All fields optional; "Generate Resume" always enabled
- Progress: 66%

---

## Tailor Mode — 3 Steps (symmetric with create mode)

Replaces `buildResumeFromJobDescription.js` entirely. Both modes now share the
same Step 1 so personal details are always captured — important when the user
doesn't provide an existing resume and the AI has nothing to pull a name from.

Step 1 is pre-filled from the Firebase user profile where available (name, email)
so returning users fly through it.

---

### Tailor Step 1 — Who You Are
*Same component as create mode Step 1, minus experience chips.*

```
┌──────────────────────────────────────────────┐
│  ✕                                           │
│         ✦  AI-powered Resume                 │
│                                              │
│    Tailor your resume to a job               │
│    A few details first — we'll handle        │
│    the rest.                                 │
│                                              │
│  First name *                                │
│  ┌────────────────────────────────────┐     │
│  │  Brian           (pre-filled)      │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Last name                                   │
│  ┌────────────────────────────────────┐     │
│  │  Test            (pre-filled)      │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Email                                       │
│  ┌────────────────────────────────────┐     │
│  │  brian@gmail.com (pre-filled)      │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Job title *                                 │
│  ┌────────────────────────────────────┐     │
│  │  e.g. Software Engineer            │     │
│  └────────────────────────────────────┘     │
│                                              │
│                         [Continue →]         │
│  ○ 0% Completed  ░░░░░░░░░░░░░░░░░░         │
└──────────────────────────────────────────────┘
```

- First name and job title: required
- Last name and email: optional but pre-filled from profile — most users won't
  need to touch this step at all
- No experience chips (not relevant for tailoring)
- Progress: 0%

---

### Tailor Step 2 — The Job
*JD required. "Continue" gated on it.*

```
┌──────────────────────────────────────────────┐
│  ← Back                                   ✕  │
│         ✦  AI-powered Resume                 │
│                                              │
│    Paste the job description                 │
│    We'll rewrite your resume to match it.    │
│                                              │
│  Job description *                           │
│  ┌────────────────────────────────────┐     │
│  │  Paste the job description here…   │     │
│  │                                    │     │
│  │                                    │     │
│  └────────────────────────────────────┘     │
│                                              │
│  Anything to highlight? (optional)           │
│  ┌────────────────────────────────────┐     │
│  │  Specific skills, certs, or        │     │
│  │  projects you want prioritised…    │     │
│  └────────────────────────────────────┘     │
│                                              │
│  [Back]                     [Continue →]     │
│  ● 33% Completed  ████░░░░░░░░░░░░░░░       │
└──────────────────────────────────────────────┘
```

- JD textarea: required; "Continue" disabled until non-empty
- "Anything to highlight": optional — skills/certs/projects to prioritise
- Progress: 33%

---

### Tailor Step 3 — Your Resume
*At least one source required.*

```
┌──────────────────────────────────────────────┐
│  ← Back                                   ✕  │
│         ✦  AI-powered Resume                 │
│                                              │
│    Which resume should we tailor?            │
│    Pick one, upload a file, or add           │
│    your experience manually.                 │
│                                              │
│  Your InstaResume resumes                    │
│  ┌────────────────────────────────────┐     │
│  │  ○  Software Engineer — v1         │     │
│  │  ○  Full Stack Resume — Draft      │     │
│  │  ○  Startup Resume                 │     │
│  └────────────────────────────────────┘     │
│                                              │
│  ─────────────────── or ──────────────────   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  📄  Upload a resume file            │   │
│  │      PDF · DOCX · TXT               │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ─────────────────── or ──────────────────   │
│                                              │
│  ▼  Add experience manually                  │  ← collapsible
│  Job title    Company     From      To        │
│  ┌────────┐ ┌────────┐ ┌──────┐ ┌──────┐   │
│  └────────┘ └────────┘ └──────┘ └──────┘   │
│  + Add another job                           │
│                                              │
│  [Back]              [Tailor Resume ✦]       │
│  Credits: 1                                  │
│  ● 50% Completed  █████████░░░░░░░░░         │
└──────────────────────────────────────────────┘
```

- **Pick from existing** — radio list of user's resumes in InstaResume; shown
  only if they have saved resumes (resolves roadmap item 19)
- **Upload** — PDF / DOCX / TXT; mutually exclusive with picking existing
- **Manual** — collapsible; job rows same as create mode Step 2; last resort
- "Tailor Resume" enabled as soon as any source is selected/filled
- Progress: 50%

---

## Loading Screen
*Shared between both modes.*

```
┌──────────────────────────────────────────────┐
│                                              │
│              ✦                              │
│           ═══════                            │
│                                              │
│   Building your resume…          (create)    │
│   Tailoring your resume…         (tailor)    │
│                                              │
│   You can still edit everything after.       │
│                                              │
└──────────────────────────────────────────────┘
```

Reuse `tailorResumeLoaderDialog`, pass mode-specific copy as a prop.

---

## Backend

### Create endpoint (new)

```
POST /secure/generative-ai/resume/create

{
  "firstName": "Brian",
  "jobTitle": "Software Engineer",
  "experienceLevel": "2-5 years",
  "workExperiences": [              // from manual rows
    { "title": "...", "company": "...", "from": "Jan 2022", "to": "Present" }
  ],
  "resumeText": "...",              // from file upload (replaces workExperiences)
  "education": { "institution": "...", "degree": "..." },
  "skills": ["React", "Node.js"],
  "additionalContext": "...",       // free-text extras
  "jobDescription": "..."           // optional JD from the collapsible
}
```

AI prompt: generate a complete resume; use JD to tailor if provided; write strong
placeholder content where background is missing.

### Tailor endpoint (existing, unchanged)

```
POST /secure/generative-ai/resume/tailor/jd
```

Existing request shape and prompt unchanged.

---

## Frontend File Plan

| File | Action |
|---|---|
| `src/pages/Resumes/aiResumeDialog/index.js` | Create — root dialog, `mode` prop, step router |
| `src/pages/Resumes/aiResumeDialog/StepWhoYouAre.js` | Create — **shared step 1** (name, email, job title; experience chips in create mode only) |
| `src/pages/Resumes/aiResumeDialog/StepBackground.js` | Create — create step 2 (upload OR manual jobs) |
| `src/pages/Resumes/aiResumeDialog/StepExtras.js` | Create — create step 3 (education, skills, free-text, collapsible JD) |
| `src/pages/Resumes/aiResumeDialog/StepTailorJd.js` | Create — tailor step 2 (JD required + highlight hint) |
| `src/pages/Resumes/aiResumeDialog/StepTailorResume.js` | Create — tailor step 3 (pick existing / upload / manual) |
| `src/pages/Resumes/aiResumeDialog/ProgressBar.js` | Create — shared % footer |
| `src/utils/service.js` | Edit — add `createResumeWithAI()` |
| `src/utils/index.js` | Edit — add `dialogKeys.aiResumeDialog` |
| `src/pages/Resumes/ResumeDialogs.js` | Edit — mount new dialog, retire old one |
| `src/pages/Resumes/resumes.js` | Edit — zero state hero → `aiResumeDialog` create mode |
| `src/pages/Resumes/MobileCreateSheet.js` | Edit — "Tailor" → `aiResumeDialog` tailor mode |
| `src/pages/Resumes/buildResumeFromJobDescription.js` | Delete (after new dialog ships) |

---

## Comparison

| | Old tailor dialog | resume.io | New create mode | New tailor mode |
|---|---|---|---|---|
| Screens | 1 long scroll | 7+ | 3 focused | 1 focused |
| JD | Required | None | Optional, collapsed | Required, prominent |
| Experience level | Not asked | Via job rows | Chip selector | N/A |
| Work history | Optional accordion | Required | Optional rows | Auto (from resume) |
| Education | Optional accordion | Optional | Optional, step 3 | N/A |
| Skills | Not asked | Tag input | Tag input + suggestions | N/A |
| Progress bar | No | Yes (%) | Yes (%) | No (single screen) |
| Upload path | PDF only | No | PDF/DOCX/TXT, skips step 3 | N/A |

---

## Future Items

- **Voice input** — Web Speech API or Whisper for the free-text / extras field
- **LinkedIn URL** — step 0 in create mode, optional
- **AI skill suggestions** — replace static job→skills map with a backend call
