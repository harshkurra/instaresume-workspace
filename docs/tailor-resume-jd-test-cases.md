# Tailor Resume — JD Input & Title-Mode Test Cases

Manual test cases for the "Tailor to a job" flow after the JD input redesign and title-based tailoring changes.

**What changed:**
- JD step has 3 tabs: Fetch from link, Generate from title, Paste text
- JD step is optional — user can skip it
- When skipped, backend tailors using `personalInfo.jobTitle` + `experienceLevel` directly (no intermediate generation)
- `getResumeBasedOnJDOnly` (no-resume path) now uses `experienceLevel` and role context when JD is empty
- Skills from JD are merged with existing skills; duplicates are removed
- `fromExistingResume` flag now reflects whether a resume was actually uploaded

---

## Setup — Personas to use across tests

| Persona | resumeText | JD | jobTitle | experienceLevel |
|---------|-----------|-----|----------|-----------------|
| **A** — Experienced with JD | Uploaded PDF resume | Full JD pasted | "Product Manager" | "5-10 years" |
| **B** — Experienced, skip JD | Uploaded PDF resume | Skipped | "Senior Software Engineer" | "5-10 years" |
| **C** — Fresher with JD | Manual background (no resume upload) | Full JD pasted | "Frontend Developer" | "Fresher" |
| **D** — Fresher, skip JD | Manual background (no resume upload) | Skipped | "Data Analyst" | "0-2 years" |
| **E** — No job title, skip JD | Uploaded PDF resume | Skipped | "" (blank) | "" (none selected) |

---

## 1. JD Input — Tab: Fetch from Link

**Entry:** Tailor dialog → Step 2 (Job Description) → "Fetch from link" tab

| # | Input | Expected |
|---|-------|----------|
| 1.1 | Paste a valid LinkedIn job URL and click Fetch | JD text fills in the textarea; "Imported — review and edit…" success message shown; fetch button shows green check |
| 1.2 | Paste a valid Greenhouse / Lever / Indeed URL | Same as 1.1 |
| 1.3 | Paste a URL from a site that blocks scrapers | Error alert: "This site blocks automated access…"; textarea unchanged |
| 1.4 | Paste a URL where the posting has expired / 404 | Error alert: "The job posting was not found…" |
| 1.5 | Paste a non-URL string (e.g. "hello") | Fetch button disabled; no API call |
| 1.6 | Fetch the same URL twice (cache hit) | Second fetch is instant (no loading spinner); same text returned; **no credit charge** |
| 1.7 | Edit the fetched text in the textarea | Edits persist; success indicator clears |
| 1.8 | Character count shown below textarea | Matches actual length; turns red at 3000 chars |

---

## 2. JD Input — Tab: Generate from Title

**Entry:** Tailor dialog → Step 2 → "Generate from title" tab

| # | Input | Expected |
|---|-------|----------|
| 2.1 | Job title field should pre-fill from Step 1 | Whatever the user typed in Step 1 "Target Job Title" appears pre-filled |
| 2.2 | Clear pre-filled title, type "Senior Data Scientist", click Generate | AI-generated JD fills the textarea; "Generated — review and edit…" shown; 1 AI credit deducted |
| 2.3 | Generate again for the exact same title | Served from Firestore cache; no additional credit deducted (credits unchanged) |
| 2.4 | Generate with experience level set to "Fresher" | Generated JD references entry-level responsibilities and graduate-level skills |
| 2.5 | Generate with experience level "10+ years" | Generated JD includes leadership, strategy, and senior-scope responsibilities |
| 2.6 | Type a title alias: "SWE" | Returns a Software Engineer JD (alias normalisation hits same cache as "Software Engineer") |
| 2.7 | Leave title blank, click Generate | Generate button is disabled; no API call |
| 2.8 | Run with 0 AI credits | Error clears; **purchase/upgrade dialog opens** (not an error alert) |
| 2.9 | Edit the generated JD in textarea | Edits persist; success indicator clears |

---

## 3. JD Input — Tab: Paste Text

**Entry:** Tailor dialog → Step 2 → "Paste text" tab

| # | Input | Expected |
|---|-------|----------|
| 3.1 | Paste a long JD | Text appears in textarea; character count updates |
| 3.2 | Paste text that exceeds 3000 chars | Input capped at 3000; char counter shows red `3000/3000` |
| 3.3 | Type < 50 characters and click Continue | Validation error inline on the textarea ("Too short…"); Continue blocked |

---

## 4. JD Step — Skip

**Entry:** Tailor dialog → Step 2 → Skip button

| # | Input | Expected |
|---|-------|----------|
| 4.1 | Click Skip with a valid job title in Step 1 | Moves to Step 3 without any JD required |
| 4.2 | Skip button is styled as a secondary outlined button | Visible border, consistent height with Continue button |
| 4.3 | Start typing a JD then click Skip | Dialog advances; any partial text in textarea is ignored |

---

## 5. Tailor — Path A: Existing Resume + Full JD (Persona A)

**Entry:** Existing resume card → Tailor to a job → upload/use existing resume in Step 3

| # | Input | Expected |
|---|-------|----------|
| 5.1 | Complete flow with full JD | Generated resume has updated professional summary, rewritten experience bullets, and a merged skill list |
| 5.2 | Skills in output | New JD-extracted skills appear at the top; skills already present in the original resume are **not duplicated** |
| 5.3 | Professional summary | Rewritten to align with the JD; HTML `<p>` tag wrapping; no raw `<p>` visible in editor |
| 5.4 | Work experience bullets | Rewritten to include keywords from the JD |
| 5.5 | Role targeting in output | Professional summary and skills reflect the target role (Product Manager in this case) |
| 5.6 | `fromExistingResume` flag | Template chosen is `AdvanceResume` (dark navy) — not `MadridResume` |
| 5.7 | RU credits | Deducted by 1 after successful generation |
| 5.8 | Free user JD limit (> 1500 chars) | Warning shown before generation; user prompted to upgrade |

---

## 6. Tailor — Path B: Existing Resume + Skip JD (Persona B)

| # | Input | Expected |
|---|-------|----------|
| 6.1 | Complete flow with JD skipped | Resume tailored without a JD; no extra AI generation step before tailoring |
| 6.2 | Professional summary | Rewritten toward "Senior Software Engineer" role (from Step 1 job title) |
| 6.3 | Experience bullets | Updated to align with typical Senior SWE skills |
| 6.4 | Skills | Typical SWE skills (TypeScript, System Design, etc.) added; existing skills retained without duplicates |
| 6.5 | Experience level reflected | Summary and skills appropriate for "5-10 years" seniority level |
| 6.6 | RU credits | Deducted by 1; no AI credits charged (no intermediate JD generation) |
| 6.7 | Template chosen | `AdvanceResume` (existing resume was uploaded) |
| 6.8 | Processing screen messages | Shows "Tailoring your resume for the role" variant (not the JD-specific copy) |

---

## 7. Tailor — Path C: No Resume (Manual Background) + Full JD (Persona C)

**Entry:** Tailor dialog → Step 3 → enter work experience manually (no file upload)

| # | Input | Expected |
|---|-------|----------|
| 7.1 | Complete flow with JD | Fresh resume created; personal info, education, and manually entered work experience all reflected |
| 7.2 | JD targeting | Experience bullets updated to match JD keywords; professional summary aligned to JD |
| 7.3 | Experience level "Fresher" with no work experience entered | `workExperiences` from AI moved to `internships` section in output |
| 7.4 | Template chosen | `MadridResume` (yellow) for fresher / no work experience; `AdvanceResume` for experienced |
| 7.5 | RU credits | Deducted by 1 |

---

## 8. Tailor — Path D: No Resume (Manual Background) + Skip JD (Persona D)

This is the most critical new path — previously the role context was lost.

| # | Input | Expected |
|---|-------|----------|
| 8.1 | Complete flow with JD skipped, "Data Analyst" title, "0-2 years" level | Resume created with Data Analyst framing; professional summary and skills reflect entry-level data analyst |
| 8.2 | Compare output with Path D but **blank job title** | Without job title, output is more generic (no role-specific keywords); verify it doesn't crash |
| 8.3 | Experience level "Fresher" | Fresher instructions followed: no fabricated work experience; internship/project framing |
| 8.4 | Experience level "5-10 years" | Experience bullets written with senior-scope language and quantifiable impact |
| 8.5 | Prompt sanity — check no "Here is the job Description: " with blank content | Should never appear in output; open Network tab and inspect request payload |
| 8.6 | Template chosen | `MadridResume` for fresher with no experience data |

---

## 9. Edge Cases

| # | Scenario | Expected |
|---|----------|----------|
| 9.1 | Job title in Step 1 is blank, JD is provided | Tailors by JD only; no crash |
| 9.2 | Job title blank AND JD skipped (Persona E) | Resume tailored generically; no crash; no empty `Target role:` in prompt |
| 9.3 | JD fetched successfully, then user switches to Paste tab and clears text, then skips | Skip flow uses job title from Step 1; cleared text not sent |
| 9.4 | Network error mid-generation | Error step shown with message; "Go back" button visible; no stuck spinner |
| 9.5 | Out of RU credits (not AI credits) | 6001 code triggers payment dialog at Step 1 |
| 9.6 | Resume with duplicate skills pre-existing | After tailor, no additional duplicates introduced |
| 9.7 | Very long job title (100+ chars) | Does not break prompt or crash; truncation or graceful handling |
| 9.8 | JD contains HTML/markdown | Tailored output is clean; no injected HTML tags leak into wrong fields |

---

## 10. Credit Behavior Summary

| Flow | AI credits | RU credits |
|------|-----------|-----------|
| Fetch JD from URL | 0 | 0 |
| Generate JD from title (cache miss) | -1 | 0 |
| Generate JD from title (cache hit) | 0 | 0 |
| Tailor with JD (any path) | 0 | -1 |
| Tailor with skip JD | 0 | -1 |
| Full flow: Generate title + Tailor | -1 | -1 |
| Full flow: Fetch URL + Tailor | 0 | -1 |
| Full flow: Skip JD + Tailor | 0 | -1 |

---

## Common Checks

| Check | What to verify |
|-------|----------------|
| No raw markdown fences | No ` ```json `, ` ```html `, or ` ``` ` anywhere in the generated resume |
| No raw HTML tags | `<p>`, `<ul>`, `<li>` rendered as formatting in the editor — not visible as text |
| Skills not duplicated | Open the Skills section in the builder after tailor; no skill appears twice |
| Role context in output | Professional summary should mention or align with the target job title entered in Step 1 |
| Processing messages | Correct variant shown: JD messages vs. role-only messages depending on whether JD was provided |
| Template selection | `AdvanceResume` when existing resume uploaded; `MadridResume` when fresher with no work experience |
