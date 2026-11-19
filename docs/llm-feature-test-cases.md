# LLM Feature Test Cases (Frontend)

Manual test cases for every AI-powered flow. Run these after any backend model config change or LLM-related fix.

---

## 1. Resume — Tailor to a Job (JD)

**Entry point:** Resumes page → "Tailor to a job" button on an existing resume

| # | Test case | Expected |
|---|-----------|----------|
| 1.1 | Paste a real JD and submit | Resume updates with rewritten experience bullets and skills; no `\`\`\`json` or `\`\`\`html` visible anywhere |
| 1.2 | Paste a very short JD (< 50 words) | Still generates; no crash |
| 1.3 | Paste a JD that exceeds the free-user character limit (>1500 chars) | Warning shown, user prompted to upgrade |
| 1.4 | Submit with no JD text | Validation error shown before API call |
| 1.5 | Check AI credits before and after | Credits deducted by exactly 1 |

---

## 2. Resume — Improve ATS Score

**Entry point:** Builder → ATS Score panel → "Improve score" action

| # | Test case | Expected |
|---|-----------|----------|
| 2.1 | Run improve on a resume with weak keyword match | Experience and skills sections update; professional summary updates |
| 2.2 | HTML in experience bullets renders correctly (no raw `<p>`, `<ul>` tags visible) | Rich text rendered in editor |
| 2.3 | Credits deducted correctly | -1 AI credit |

---

## 3. Resume — Inline Text Actions

**Entry point:** Builder → click any text section → AI toolbar (improve, fix grammar, make longer, shorter, simplify, quantify)

| # | Test case | Expected result |
|---|-----------|-----------------|
| 3.1 | Improve writing on a work experience bullet | Rewritten text appears; no markdown fences |
| 3.2 | Fix grammar/spelling on text with deliberate typos | Corrected text; no extra formatting artifacts |
| 3.3 | Make longer on a short bullet | Text expands roughly 2× |
| 3.4 | Make shorter on a long paragraph | Text halves roughly |
| 3.5 | Simplify writing on technical jargon | Simpler phrasing returned |
| 3.6 | Quantify writing on a vague bullet | Metrics/numbers added |
| 3.7 | Run any action on an empty section | Graceful error or disabled state — no crash |
| 3.8 | Credits deducted for each action | -1 per action |

---

## 4. Resume — Suggestions (Summary / Bullets / Skills)

**Entry point:** Builder → Professional Summary / Work Experience / Skills field → AI suggestion button

| # | Test case | Expected |
|---|-----------|----------|
| 4.1 | Request professional summary suggestions for a given job title | List of suggestions appears; clean text, no fences |
| 4.2 | Request work experience bullet suggestions | Bullet list returned as HTML `<ul><li>` rendered correctly |
| 4.3 | Request skills suggestions | Skills list populated; no raw JSON array visible |
| 4.4 | Request internship bullet suggestions (fresher mode) | Internship-appropriate bullets returned |

---

## 5. Cover Letter — Generate from Resume

**Entry point:** Cover Letters tab → CREATE NEW → "Create from a resume" → select a resume

| # | Test case | Expected |
|---|-----------|----------|
| 5.1 | Select a resume with full experience data | Cover letter generated; no ` ```html ` at top, no ` ``` ` at bottom |
| 5.2 | Select a resume with minimal data (no experience) | Cover letter still generates without crash |
| 5.3 | Add company name and hiring manager before generating | Both reflected in the generated letter |
| 5.4 | Generated content renders correctly in editor (paragraphs, bullet list) | No raw HTML tags visible |
| 5.5 | Credits deducted | -1 AI credit |

---

## 6. Cover Letter — Generate Content Inline

**Entry point:** Cover letter editor → "Generate content" / AI button within the editor

| # | Test case | Expected |
|---|-----------|----------|
| 6.1 | Generate for a Software Engineer role | Content has `<p>` paragraphs and `<ul><li>` bullets; renders in editor |
| 6.2 | No ` ```html ` fence in output | Clean HTML only |
| 6.3 | Credits deducted | -1 AI credit |

---

## 7. Resignation Letter — Generate Content Inline

**Entry point:** Resignation letter editor → AI generate button

| # | Test case | Expected |
|---|-----------|----------|
| 7.1 | Generate with notice period and last working date filled | Both details appear in generated letter |
| 7.2 | Generate with reason field empty | Generates without crashing; letter is generic |
| 7.3 | No ` ```html ` or ` ``` ` in output | Clean HTML only |
| 7.4 | Credits deducted | -1 AI credit |

---

## 8. Interview Questions

**Entry point:** Resume → Interview Questions panel (if available)

| # | Test case | Expected |
|---|-----------|----------|
| 8.1 | Generate for a given role and JD | 5 questions + answers returned; renders correctly |
| 8.2 | Answers render as rich text (no raw HTML) | `<p>`, `<ul>` tags rendered, not shown as text |
| 8.3 | Load previously generated questions | Loads from storage without crash (no JSON parse error) |
| 8.4 | Credits deducted | -1 AI credit |

---

## 9. Resume Upload / Parse (PDF, DOCX, LinkedIn)

**Entry point:** CREATE NEW → "Import a resume" → PDF/DOCX or LinkedIn

| # | Test case | Expected |
|---|-----------|----------|
| 9.1 | Upload a standard PDF resume | Parsed data populates builder fields correctly |
| 9.2 | Upload a DOCX resume | Same as above |
| 9.3 | Upload LinkedIn data export ZIP | Data parsed; personal info and experience populated |
| 9.4 | Upload a scanned PDF (image-only, no text layer) | Graceful error message, no crash |
| 9.5 | Upload an unrelated file (e.g. a photo) | Validation error shown |
| 9.6 | RU credits deducted for upload | -1 RU credit |

---

## Common Checks (Run for Every Flow Above)

| Check | What to verify |
|-------|---------------|
| No raw markdown fences | No ` ```html `, ` ```json `, or ` ``` ` visible anywhere in the UI |
| No raw HTML tags | `<p>`, `<ul>`, `<li>` etc. rendered as formatting, not as text |
| Credit deduction | AI/RU credits decrease by expected amount after each action |
| Error handling | Network errors / timeouts show a user-friendly message, not a blank screen or console error |
| Free user limits | Free-tier users see upgrade prompt when limits exceeded, not a crash |
