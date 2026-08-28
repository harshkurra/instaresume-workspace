# "Create with AI" Flow — Design Spec

New lightweight dialog for zero state — replaces the existing "Tailor resume as
per job description" dialog when triggered from the zero state hero card.

The existing tailor dialog stays unchanged for its current use case (tailoring an
existing resume to a JD). This is a separate, new entry point.

---

## Problem with the current dialog for zero state

The "Tailor resume as per job description" dialog (Image #20–22) has these issues
when used as a first-resume creation flow:

1. **Wrong title and framing** — "Tailor your resume as per job description"
   implies the user already has a resume. Zero state users don't.
2. **JD is required and takes most of the screen** — a first-time user doesn't
   have a job description in mind; they just want a good resume.
3. **Scrollable, multi-section layout** — YOUR DETAILS → JOB INFORMATION → YOUR
   RESUME → Add Experience → Add Education is too many steps for a cold start.
4. **Cluttered inputs** — phone number, writing style, email all distract from the
   core job: generate a good resume.

---

## New Flow — "Create your resume with AI"

### Overview

2-step compact dialog. No JD. User tells us their role and optionally gives
background context (either by uploading an existing resume or typing a short bio).
AI generates a complete resume draft.

---

### Step 1 — Your Role

```
┌──────────────────────────────────────────┐
│  ✕                      1 of 2  ● ○      │
│                                          │
│  Let's build your resume                 │
│  Tell us your role — we'll write the     │
│  rest.                                   │
│                                          │
│  Your name                               │
│  ┌─────────────────────────────────┐    │
│  │  First name                     │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Job title *                             │
│  ┌─────────────────────────────────┐    │
│  │  e.g. Software Engineer         │    │
│  └─────────────────────────────────┘    │
│                                          │
│  Experience level                        │
│  ┌────────┐ ┌───────┐ ┌───────┐        │
│  │ Fresher│ │ 0–2 y │ │ 2–5 y │ ...   │
│  └────────┘ └───────┘ └───────┘        │
│                                          │
│                          [Next  →]       │
└──────────────────────────────────────────┘
```

**Fields:**
- First name (optional — used to personalise the resume header)
- Job title (required)
- Experience level pill selector — single select:
  `Fresher` · `0–2 yrs` · `2–5 yrs` · `5–10 yrs` · `10+ yrs`

**UX notes:**
- No email, phone, last name at this stage — they fill those in the builder
- Experience level chips auto-select "Fresher" if nothing chosen (safe default)
- "Next" is enabled as soon as job title is non-empty

---

### Step 2 — Your Background

```
┌──────────────────────────────────────────┐
│  ← Back                 2 of 2  ● ●      │
│                                          │
│  Add your background (optional)          │
│  The more we know, the better the        │
│  resume. Skip to go with a template.     │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  📄                              │   │
│  │  Drop your resume here           │   │
│  │  PDF · DOCX · TXT                │   │
│  │  [Browse files]                  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ─────────────── or ───────────────      │
│                                          │
│  Describe yourself in a few sentences    │
│  ┌──────────────────────────────────┐   │
│  │  e.g. 5 years as a React dev,   │   │
│  │  built e-commerce platforms,     │   │
│  │  led a 4-person team…            │   │
│  └──────────────────────────────────┘   │
│                                          │
│  Credits: 1    [Skip  →]  [Generate →]  │
└──────────────────────────────────────────┘
```

**Fields:**
- File drop zone — PDF / DOCX / TXT (same parsing as existing import flow)
- OR free-text bio (textarea, ~4 rows, placeholder guides the user)
- Both are optional — "Skip" generates a clean template-based resume for the role

**UX notes:**
- If file is uploaded, text area hides (they're mutually exclusive)
- "Skip" is a legitimate path — just creates a role-appropriate blank resume
- Credit count shown in footer, same as existing dialog
- "Generate" button label: `Generate Resume ✦` (match existing teal button style)

---

### Loading State

Reuse the existing `tailorResumeLoaderDialog` with copy updated to:
- "Building your resume…" instead of "Tailoring your resume…"

---

## Backend Changes

### New endpoint

```
POST /secure/generative-ai/resume/create
```

**Request body:**
```json
{
  "jobTitle": "Software Engineer",
  "yearsOfExperience": "2-5",
  "firstName": "Brian",
  "resumeText": "...",          // if file uploaded — extracted text
  "backgroundText": "..."       // if typed bio provided
}
```

**Why a new endpoint, not the existing tailor/jd:**
- The tailor prompt is built around diffing user resume vs. JD — wrong framing
- The create prompt should be: "Generate a complete, realistic resume for a
  [yearsOfExperience] [jobTitle]. Use the background provided to personalise it.
  If no background is provided, write a strong generic version for the role."
- Different system prompt, different output shape expectations

**Response:** same resume JSON format as existing tailor endpoint
```json
{
  "text": { ...resumeJSON },
  "credits": 0,
  "resumeId": "abc123"
}
```

**Credit cost:** 1 credit (same as tailor)

### Reuse what you can

- PDF/DOCX/TXT text extraction — already exists in `extractTextFromPdf` /
  existing import service
- Resume JSON save + navigate to builder — same as tailor flow post-success
- Credit deduction middleware — no changes

---

## Frontend Files to Create / Change

| File | Action | Notes |
|---|---|---|
| `src/pages/Resumes/createResumeDialog/` | Create new folder | New dialog component |
| `src/pages/Resumes/createResumeDialog/index.js` | Create | Main 2-step dialog |
| `src/pages/Resumes/createResumeDialog/StepRole.js` | Create | Step 1 component |
| `src/pages/Resumes/createResumeDialog/StepBackground.js` | Create | Step 2 component |
| `src/utils/service.js` | Edit | Add `createResumeWithAI()` API call |
| `src/utils/index.js` | Edit | Add `dialogKeys.createResumeDialog` |
| `src/pages/Resumes/ResumeDialogs.js` | Edit | Mount new dialog on the key |
| `src/pages/Resumes/resumes.js` | Edit | Zero state hero onClick → new dialog key |
| `src/pages/Resumes/MobileCreateSheet.js` | Edit | "Tailor an existing resume" stays; new key for zero state path |

---

## Key Differences from Existing Dialog

| | Existing "Tailor" dialog | New "Create" dialog |
|---|---|---|
| Title | Tailor your resume as per job description | Let's build your resume |
| JD field | Required | Removed entirely |
| Steps | Single long scrollable form | 2 short screens |
| Experience level | Not asked | Chip selector |
| Background | Upload OR add experience/education fields | Upload OR free-text bio |
| Email / Phone | Asked upfront | Skipped (fill in builder) |
| Empty submit | Generates generic JD-matched resume | Generates role-appropriate blank |
| Trigger | "Tailor an existing resume" in create menu | Zero state hero card only |

---

## Open Questions

1. Should "Create with AI" from the **create menu** (non-zero-state, when user
   already has resumes) go to the new dialog or the existing tailor dialog?
   Recommendation: keep existing tailor dialog there; new dialog is zero-state only.

2. Does the backend AI prompt need the experience level mapped to years string,
   or a human-readable label? (e.g. `"2-5"` vs `"2–5 years of experience"`)

3. Should "Skip" on step 2 still cost a credit? Probably yes — it still calls the
   backend to generate a role-appropriate template.
