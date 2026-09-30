# Fieldnotes: a personal CRM for learning from every conversation

> Working name: **Fieldnotes** (not final; check availability before launch).
> Status: Phase 1 locked (2026-09-30). Built for sale eventually; for now it's an MVP for the founder, who is the only user. Scope is in §11; design and accessibility in §16.

---

## 0. Instructions for the coding agent

1. Read this whole document before writing any code.
2. **MVP for the founder first, product later.** Every record belongs to one account and is checked on every query from day one (cheap now, painful later). Export, account deletion, onboarding and open sign-up wait for the "Before launch" phase (§11).
3. **Stack (decided):**
   - **TanStack Start** (React, TypeScript) for the app
   - **Convex** for the database, backend functions and file storage
   - **Clerk** for authentication (sign-in only; sign-up restricted to the owner)
   - **Tailwind v4 + Radix primitives** for UI; native `<input type="date">` / `datetime-local` for dates
   - Installable web app (PWA), mobile-first for capture, dashboards on desktop
   - Hosted on **Vercel**
   - `../paperkoi` may be used as a reference for Clerk ↔ Convex wiring only. Don't copy its structure, components or design.
4. Build **Phase 1 only** (§11), in the order listed there, so whatever exists at any point is usable at a meetup. Don't build later-phase features unless asked.
5. Resolve the open questions in §13 with the owner as they come up.
6. Follow the naming rules in §15. Product copy, UI text and marketing must use this product's own vocabulary.
7. When in doubt, pick the simpler option and mention the tradeoff.

---

## 1. One-liner

**A personal CRM that remembers people _and_ what you learned from them, so every conversation moves a relationship forward and shows whether your ideas are real.**

---

## 2. Who it's for

**Primary customers:** people whose work depends on learning from conversations and building relationships:

- Early-stage founders validating ideas
- Freelancers and consultants finding clients through networking
- Anyone who goes to meetups and events to explore opportunities

**First user:** the founder, a software engineer exploring several business ideas through local meetups. The product should solve his problem first, in ways that obviously apply to the customers above.

---

## 3. The problem

- **Details get forgotten:** names, how you met, the one thing they said that mattered.
- **Notes are scattered** across phones, notebooks, chat apps and memory.
- **Conversations feel good but produce noise.** Compliments and "that's cool" feel like progress but aren't evidence. People leave meetings believing an idea is validated when they only heard politeness.
- **There's no clear view of which ideas have real evidence** behind them, or where that evidence came from.
- **Relationships fade** without follow-up. Many users want real relationships, not just a list of leads.
- **Meetings with unclear intent waste time.** For example, a networking "coffee" that turns out to be a sales or recruitment pitch. Checking the other person's intent before meeting prevents this.

---

## 4. What makes it different

| Tool type      | Tracks                                        | Core question                                                             |
| -------------- | --------------------------------------------- | ------------------------------------------------------------------------- |
| Sales CRM      | Deals and pipeline stages                     | "Will they buy?"                                                          |
| Personal CRM   | People and birthdays                          | "When did I last talk to them?"                                           |
| **Fieldnotes** | **People + conversations + what you learned** | **"What do I actually know now, who told me, and what's the next step?"** |

Three connected layers:

1. **People**: the relationship (stranger → friend).
2. **Conversations**: the evidence (facts, problems, next steps, noise).
3. **Ideas**: what you believe, with each belief supported or contradicted by specific conversations.

Signals from conversations **roll up** to ideas. Over time, each idea shows its evidence: "7 conversations, 4 with a real problem, 2 next steps committed, and here are the quotes."

Around every meeting there's a loop: **Prep → Talk → Debrief → Follow up.**

---

## 5. Product principles

- **Capture in seconds, enrich later.** At an event, speed beats completeness.
- **Facts over noise.** Make it easy to tell the difference, and a little uncomfortable to log only compliments.
- **Every conversation ends with a next step**, or is honestly marked as having none.
- **People first, not leads.** A person can relate to several ideas or none. Friendship is a valid outcome.
- **Private by default.** Users store information about other people. It's never shared, and export and deletion are easy.
- **No AI required.** The core works without it. AI helpers are optional later (Phase 3).
- **Mobile-first for capture**, desktop-friendly for review.
- **Opinionated but gentle.** The product nudges good habits (debrief, next steps, honesty checks) without lecturing.

---

## 6. Product vocabulary

| Term              | Meaning                                                                                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Idea**          | Something the user is exploring (e.g., "Document collection tool for bookkeepers").                                                                                                             |
| **Belief**        | A statement about an idea that might be true or false (e.g., "Bookkeepers lose hours chasing client documents in tax season").                                                                  |
| **Segment**       | A specific type of person for an idea (e.g., "solo bookkeepers with 50+ clients"). Specific beats "everyone."                                                                                   |
| **Key Questions** | The three most important things to learn from a segment, planned before a conversation.                                                                                                         |
| **Signal**        | A tagged note from a conversation. The unit of evidence.                                                                                                                                        |
| **Noise**         | Compliments, generic claims ("I usually…") and hypotheticals ("I would buy that"). Logged, but not counted as evidence.                                                                         |
| **Next step**     | A concrete move forward the other person agrees to. Types: **Time** (another meeting, a trial), **Introduction** (connects you to someone, vouches for you), **Money** (a deposit, a purchase). |
| **Stalled**       | A contact with repeated friendly conversations and no next steps. Surfaced, not hidden.                                                                                                         |
| **Give**          | Something the user did for a contact (an intro, a tip, a resource). Keeps relationships two-way.                                                                                                |
| **Intent**        | What the other person said the meeting is for.                                                                                                                                                  |

### 6.1 Signal types (tag chips)

- **Problem**: something they struggle with, ideally a real, recent example
- **Goal**: what they're trying to achieve
- **Obstacle**: what's in the way
- **Workaround**: what they do today to cope (a strong sign the problem is real)
- **Money**: what they pay for today, budgets, who decides purchases
- **Context**: background, how their work operates
- **Emotion**: strong feelings (excited, frustrated, embarrassed)
- **Request**: something they asked for (a clue, not a spec)
- **Mention**: a person or company they named (a possible intro)
- **Noise**: compliments, hypotheticals, generic claims (tagged so they're discounted)

---

## 7. Core workflows

### 7.1 Quick capture at an event (target: under 10 seconds, one hand)

- One tap from **Today** (the home screen). While event mode is on, the app opens straight to Capture.
- **Event mode (minimal):** set "Tonight: Business meetup, South Charlotte" once. Every capture is tagged with the event, date and place. It **turns off automatically at midnight local time** and can be ended early. No separate Events screen in Phase 1.
- **Minimum to save:** a name (or a description like "guy in blue jacket, cleaning biz") plus **one hook line** ("ex-bioengineer, now finance, likes craft beer").
- **Optional in the same screen:** a photo (business card, badge), compressed on the device and stored in Convex. Voice memos are Phase 2.
- Save → back to a blank capture screen for the next person.
- **Online only.** No offline queue (decided; see §13).
- Saving creates a **Person marked "needs triage"**. There is no separate Capture record; the **Inbox** is the list of people needing triage.

**"Swap" QR (Phase 2):** the user's phone shows a QR code. The other person scans it and lands on a short page asking for name, email or phone, and "what do you do?" Their entry goes straight into the user's Inbox, tagged with the current event. Optionally they can save the user's contact card. No typing for the user, and it's a natural reason to follow up. (This page is also a subtle marketing surface for the product; see §12.)

### 7.2 Triage (the same night)

The Inbox lists people marked "needs triage" (tonight's first). For each one:

- Keep as a new person, or **merge** into an existing one (hook line, photo and event fold into the existing person; the duplicate is deleted)
- Fill in details: company, role, contact info, personal notes
- Link to one or more **ideas** (or none)
- Set a **follow-up** (default: within 48 hours)
- Mark done → leaves the Inbox

Goal: an empty Inbox by the next morning.

The relationship loop: **meet → capture → triage → plan meeting → meet → debrief → next step → plan the next meeting → …** until it becomes a product, a customer, a friend, or honestly nothing.

### 7.3 Planning a meeting

- From a person's page: **Plan meeting**. A meeting (Conversation) is created _before_ it happens, with status **planned**.
- Fields: date/time, type (coffee, call, demo, event), **intent** (what they said it's for), and **my 3 questions** for this meeting.
- If the person is linked to an idea, the 3 questions are pre-filled from that idea's Key Questions and are editable.
- Unplanned conversations (a chance chat) can be debriefed directly; the questions part is just empty.

### 7.4 Meeting prep: the Brief (readable in 30 seconds on a phone)

Read before the meeting, then put the phone away. Nothing is typed during the conversation.

- Who they are and **how we met** (event, date, introduced by)
- Personal details (family, hobbies, background)
- **My 3 questions** for this meeting
- **Last conversation's top 3 takeaways**
- **Open next steps** both ways (what I owe them, what they owe me)
- **Intent check:** "What did they say this meeting is for?" If blank or vague, prompt: _"Consider asking what they have in mind before you meet."_

### 7.5 Debrief after a meeting (one form, about 3 minutes)

A single scrolling form, not a step-by-step wizard. Opening a planned meeting's debrief marks it **debriefed** when saved.

1. **My 3 questions:** for each, answered / partly / not asked, plus what I learned
2. **Top 3 takeaways** (required)
3. **Signals:** quick-add notes with signal-type chips, optionally linked to an idea
4. **Honesty check** (three toggles):
   - "Did I get facts about their past, or compliments and hypotheticals?"
   - "Did I pitch too early?"
   - "Were they pitching _me_?" (sets the flag)
5. **Next step:** type (none / time / introduction / money), description, owner, due date. If "none," the app gently notes it. If "time," offer **Plan it now**, which creates the next planned meeting.
6. **Personal notes:** anything human worth remembering

Phase 2: link signals to a belief as _supports_ / _contradicts_; "people mentioned" stub contacts.

### 7.6 Keep in touch (Phase 2)

- Each person has a **cadence** based on relationship stage (defaults, e.g., friend: monthly, contact: quarterly; editable).
- A **"Reach out"** list shows who's due.
- A **Gives** log records what the user has done for them.

### 7.7 Weekly idea review

Phase 1: each idea has a name, description, status, up to 3 Key Questions, a list of beliefs, and the signals linked to it. The rest below (counts per belief, segments) is Phase 2.

For each idea:

- **Beliefs** with counts of supporting and contradicting signals, each linked to the quote and conversation
- Conversations by **segment** (am I talking to the right people?)
- **Next steps earned** (the strongest evidence)
- A **"What changed my mind this week"** note
- **Key Questions**, editable as learning moves on
- **Status:** Exploring / Building evidence / Committed / Parked

---

## 8. How to judge a contact: multiple axes, not one score

A single "lead score" would give false precision. Show simple badges instead:

| Axis                            | Values                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| **Relationship**                | Stranger → Acquaintance → Contact → Friend                                              |
| **Problem strength (per idea)** | None / Mild / Active (has a workaround) / Urgent (already spending time or money on it) |
| **Progress**                    | Strongest next step so far: none / time / introduction / money                          |
| **Access**                      | Decision-maker? Can they buy? Can they introduce me to buyers?                          |
| **Flags**                       | Pitching me, Stalled, Not a fit, Great connector                                        |

**Phase 1 badges:** Relationship (set manually), Progress (computed from the person's strongest next step), and Flags (Pitching me, Not a fit, Great connector). Problem strength, Access and the automatic "Stalled" flag are Phase 2.

The People list can sort by an optional "needs attention" order (follow-up due, open next steps, strong problem with no next step), with the badges visible so the reasoning is clear.

---

## 9. Data model (conceptual, not a schema)

Every record belongs to exactly one **account** (the user). No record is ever readable by another account.

- **Account / User**: profile, settings (cadence defaults), plan (for billing later)
**Phase 1:**

- **Account / User**: the Clerk user; every record carries its owner ID
- **Person**: name, photo, hook line, role, company, contact info, personal notes, relationship stage, flags, linked ideas, how met (event, date, introduced by), **needs triage** (true for fresh captures), follow-up date, source (capture / manual)
- **Event**: name, date, place, ends at (midnight local)
- **Conversation** (meeting): person, status (**planned / debriefed**), date/time, type (event, coffee, call, demo), stated intent, **my 3 questions** (each with answered / partly / not asked + note), top 3 takeaways, honesty-check answers, notes
- **Signal**: conversation, person, type (§6.1), text (a direct quote when possible), linked idea(s)
- **Idea**: name, description, status, Key Questions (up to 3)
- **Belief**: idea, statement
- **Next step**: conversation, owner (me or them), type, description, due date, done

**Later phases:** Organization, Segment, belief links on signals (supports / contradicts), confidence, Give, Person link, cadence, Reminder, plan/limits for billing. No separate Capture record: captures are People with "needs triage."

---

## 10. Screens

**Phase 1:**

1. **Sign in** (no sign-up page)
2. **Today** (home): Capture button, upcoming meetings (→ Brief), due / overdue next steps and follow-ups, Inbox count. A multi-column dashboard on desktop.
3. **Capture** (event mode banner, name, hook line, photo)
4. **Inbox** (triage and merge)
5. **People** (search; filters: due, stage, idea, flag)
6. **Person** (profile, badges, timeline of meetings, signals and next steps; Plan meeting)
7. **Plan meeting**
8. **Brief** (pre-meeting)
9. **Debrief** (post-meeting form)
10. **Ideas** (list with status)
11. **Idea** (description, Key Questions, beliefs, linked signals)
12. **Settings** (theme, sign out)

**Navigation:** on phones, a bottom tab bar: **Today · People · ＋Capture · Ideas · Inbox**, with Capture as the larger center button. On desktop, a left sidebar with the same items; People and Ideas use list + detail split views.

**Later:** Events (Phase 2); full evidence board (Phase 2); Settings for cadence defaults, export and delete account, and Onboarding with sample data (Before launch).

---

## 11. Scope and phases

### Phase 1: MVP (goal: built 2026-09-30, used at the meetup on 2026-10-01)

Build in this order, deploying to Vercel as soon as there's something to deploy:

1. Sign in (Clerk, sign-up restricted to the owner), per-account data checks in every Convex function; installable PWA shell; app layout and navigation
2. Capture with minimal event mode (text + photo)
3. Inbox and triage, including merge
4. People list and Person page with badges
5. Ideas with Key Questions and beliefs
6. Plan meeting and Brief
7. Debrief (my 3 questions, top 3, signals, honesty check, next step, Plan it now)
8. Today screen / dashboard

Development uses the fictional sample data in §14 (seeded in dev only).

### Phase 2

- Offline capture (IndexedDB outbox, append-only so no conflicts)
- Events screen
- Segments; signals linked to beliefs; idea evidence board with supports and contradicts counts
- Problem strength and Access badges; automatic "Stalled" flag
- "People mentioned" stub contacts and person-to-person links (intros and mentions)
- Keep-in-touch cadences and the Reach out list
- Gives log
- Swap QR page for contact exchange
- Voice memo capture

### Before launch

- Open sign-up
- Onboarding with optional sample data
- Export all data (JSON and CSV) and delete account
- Name, trademark and domain check; Clerk production instance

### Phase 3 (optional AI helpers)

- Transcribe voice memos into notes
- Suggest signal tags from free-text notes
- Flag likely noise ("I would…", compliments)
- Draft follow-up messages
- Calendar integration for automatic Briefs
- Import contacts or a LinkedIn CSV

### Later: commercial

- Pricing and billing
- Landing page and waitlist
- Public help docs using the product's own vocabulary

### Non-goals

- Team or shared workspaces
- Sales pipeline stages, deal values, revenue forecasting
- Email inbox sync
- Mass outreach, sequences, automated cold messaging
- Public profiles

---

## 12. Product and business considerations

- **Positioning:** "The CRM for people who learn from conversations." Differentiated from sales CRMs (no deal pipeline) and simple personal CRMs (evidence and ideas, not just reminders).
- **Growth hook:** the Swap QR page is seen by people at events, many of them founders and freelancers who are potential users. A small, tasteful "Made with Fieldnotes" note there could bring in users without being pushy.
- **Pricing:** decide later. Likely a free tier (limited contacts or ideas) plus a paid plan. Design the data model so plans and limits can be added without migration pain.
- **Trust:** users store information about other people. Clear privacy policy, no data selling, no training AI on user data, easy export and deletion. Get proper advice on privacy obligations (e.g., CCPA, GDPR) before selling broadly.
- **Name:** check trademark and domain availability before launch.

---

## 13. Open questions for the owner

1. ~~**Offline sync**~~ **Resolved:** online only in Phase 1. Offline capture moves to Phase 2.
2. **PWA with TanStack Start:** service worker setup, install prompt, and how photo capture behaves on iOS and Android. (Technical; resolve while building.)
3. ~~**Photo storage**~~ **Resolved:** Convex file storage, access checked per account, compressed on the device before upload.
4. ~~**Voice memos in Phase 1?**~~ **Resolved:** no; text and photo only. Voice is Phase 2.
5. **Swap QR:** should scanning also offer the user's contact card automatically? What spam protection does the public page need? (Phase 2.)
6. ~~**Sample data**~~ **Resolved:** used in development now; onboarding sample data moves to Before launch.
7. ~~**Name**~~ **Resolved:** keep "Fieldnotes" as the working name; check before launch.

---

## 14. Sample data (demo account and development)

Generic, fictional sample data for onboarding and development. **Never commit the owner's real contacts or notes to the repository.**

### Ideas

**Document collection tool for bookkeepers**

- Beliefs:
  - Bookkeepers lose significant time chasing client documents during tax season.
  - Email is "good enough" for low-volume firms; the pain grows with client volume.
  - Needing client signatures is a key missing piece.
- Segment: high-volume bookkeeping and tax practices
- Key Questions:
  1. Tell me about the last time a client was late with documents. What happened and what did it cost?
  2. What have you tried or paid for to fix it, and why did it stick or not?
  3. What do clients need to sign, and how do you handle that today?

**Lead generation for local service businesses**

- Beliefs:
  - Small service owners' biggest problem is getting more clients.
  - Many lose leads by responding slowly.
- Segments: cleaning companies; bookkeepers and accountants
- Key Questions:
  1. Where did your last few new clients come from?
  2. When someone asks for a quote, who responds and how fast?
  3. Have you paid for marketing before, and what happened?

**Job checklist for cleaning companies**

- Belief: owners need quality control and proof of work, not just a printed list.
- Segment: small, new cleaning businesses
- Key Questions:
  1. What happens today when a cleaner misses something?
  2. Is the checklist for training, quality control, or showing clients?
  3. How do you and your cleaners communicate during a job?

### People (fictional)

- **Sam Rivera**, cleaning business owner. Met at a business meetup; meeting scheduled; wants a job checklist; also needs more clients. Relationship: Acquaintance, goal Friend.
- **Jordan Blake**, "finance" contact. Met at the same meetup; the meeting turned out to be a recruitment pitch. Flag: _Pitching me_. Demonstrates the intent check and flags.
- **Priya Shah**, bookkeeper with 80+ clients. Problem strength: Urgent. Next step: agreed to a 20-minute demo (Time).

---

## 15. Naming and attribution rules (internal; do not ship)

- The capture-and-debrief method draws on well-known customer-discovery practices. **Don't reference any specific book, author or methodology by name** in UI text, marketing, help docs, onboarding or code comments that ship to users.
- **Don't copy or closely paraphrase** distinctive phrases, lists or examples from existing books or courses. Use the product's own vocabulary (§6) and write original copy.
- Concepts like "ask about past behavior, not future hypotheticals" are general practice and fine to express in our own words.

---

## 16. Design and accessibility (decided)

**Look:** a calmer take on the owner's site (ronb.co). It should feel related to the site without looking like part of it.

- **Keep from ronb.co:** Mona Sans (variable), system monospace for small labels, violet as the single accent, the 4 / 8 / 16 / 24 / 32 / 48 spacing scale, its dark-mode palette.
- **Tone down:** borders use the light rule gray, not black. Primary buttons are violet, not black; secondary buttons are outlined or soft lavender. Headings at medium weight (500–600), normal width. A faint warm off-white background with white cards. Violet only for the main action and the active tab.
- **Starting tokens (light):** paper `#fbfaf8`, card `#fff`, ink `#111015`, ink-2 `#5a5764`, rule `#e3e0e8`, accent `#5130d8`, soft `#e2d9ff`, ok `#1a9a58`.
- **Starting tokens (dark):** paper `#0e0d13`, ink `#f2eff8`, ink-2 `#aaa4b9`, rule `#262330`, accent `#b6a2ff`, soft `#1d1929`, ok `#3fd88a`.
- Light and dark mode, following the system setting with a manual override in Settings.

**Accessibility (WCAG 2.2 AA minimum):** full keyboard support, correct labels and landmarks for screen readers, visible focus, touch targets of at least 44px, respects reduced motion, and never relies on color alone (signal chips and badges always carry text).

**Devices:** Capture is designed for one-handed use on a phone. Review, planning and ideas are designed as dashboards on a laptop.
