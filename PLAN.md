# Fieldnotes: a personal CRM for learning from every conversation

> Working name: **Fieldnotes** (not final; check availability before launch).
> Status: product plan. Built as a product for sale from day one; the founder is the first user.

---

## 0. Instructions for the coding agent

1. Read this whole document before writing any code.
2. **Treat this as a commercial product**, not a personal tool. Every user has their own private account and data. Build accounts, data isolation, export and deletion properly from the start.
3. **Stack (decided):**
   - **TanStack Start** (React, TypeScript) for the app
   - **Convex** for the database, backend functions and file storage
   - **Clerk** for authentication
   - Installable web app (PWA), mobile-first
4. Propose an implementation plan for **Phase 1 only** (§11) and confirm it with the owner before building. Don't build Phase 2 or 3 features unless asked.
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

- The app opens straight to the **capture screen** (home-screen shortcut).
- **Event mode:** set "Tonight: Business meetup, South Charlotte" once. Every capture is tagged automatically with event, date and place.
- **Minimum to save:** a name (or a description like "guy in blue jacket, cleaning biz") plus **one hook line** ("ex-bioengineer, now finance, likes craft beer").
- **Optional in the same screen:** a photo (business card, badge), a tag, a quick voice memo (Phase 2).
- Save → back to a blank capture screen for the next person.
- **Must work offline** (venues often have bad signal) and sync when back online.
- Everything lands in the **Inbox** for triage.

**"Swap" QR (Phase 2):** the user's phone shows a QR code. The other person scans it and lands on a short page asking for name, email or phone, and "what do you do?" Their entry goes straight into the user's Inbox, tagged with the current event. Optionally they can save the user's contact card. No typing for the user, and it's a natural reason to follow up. (This page is also a subtle marketing surface for the product; see §12.)

### 7.2 Triage (the same night)

The Inbox shows the event's captures. For each one:

- Confirm it's a new person, or **merge** with an existing one
- Fill in details: company, role, contact info, personal notes
- Link to one or more **ideas** (or none)
- Set a **follow-up** (default: within 48 hours)
- Optionally draft the follow-up message

Goal: an empty Inbox by the next morning.

### 7.3 Meeting prep: the Brief (readable in 30 seconds on a phone)

- Who they are and **how we met** (event, date, introduced by)
- Personal details (family, hobbies, background)
- **Last conversation's top 3 takeaways**
- **Open next steps** both ways (what I owe them, what they owe me)
- **Key Questions** for their segment or linked ideas
- **Intent check:** "What did they say this meeting is for?" If blank or vague, prompt: _"Consider asking what they have in mind before you meet."_

### 7.4 Debrief after a meeting (guided, about 3 minutes)

1. **Top 3 takeaways** (required)
2. **Key Questions progress:** for each question, answered / partly / not asked, plus a short note
3. **Signals:** quick-add notes with signal-type chips, optionally linked to a belief as _supports_ or _contradicts_
4. **Honesty check:**
   - "Did I get facts about their past, or compliments and hypotheticals?"
   - "Did I pitch too early?"
   - "Were they pitching _me_?" (flag)
5. **Next step:** type (none / time / introduction / money), description, owner, due date. If "none," the app gently notes it.
6. **People mentioned:** quick-create stub contacts ("offered to introduce me to their accountant")
7. **Personal notes:** anything human worth remembering

### 7.5 Keep in touch

- Each person has a **cadence** based on relationship stage (defaults, e.g., friend: monthly, contact: quarterly; editable).
- A **"Reach out"** list shows who's due.
- A **Gives** log records what the user has done for them.

### 7.6 Weekly idea review

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

The People list can sort by an optional "needs attention" order (follow-up due, open next steps, strong problem with no next step), with the badges visible so the reasoning is clear.

---

## 9. Data model (conceptual, not a schema)

Every record belongs to exactly one **account** (the user). No record is ever readable by another account.

- **Account / User**: profile, settings (cadence defaults), plan (for billing later)
- **Person**: name, photo, hook line, role, company, industry, contact info, personal notes, relationship stage, cadence, flags, tags, how met (event, date, introduced by), source (capture / swap / manual)
- **Organization** (light, optional): name, industry, notes
- **Event**: name, date, place, notes
- **Capture** (Inbox item): raw text, photo, audio (later), event, timestamp, status (new / triaged / merged)
- **Conversation**: person(s), date, type (event, coffee, call, demo), stated intent, top 3 takeaways, Key Questions progress, honesty-check answers, "they pitched me" flag, notes
- **Signal**: conversation, person, type (§6.1), text (a direct quote when possible), linked idea(s), linked belief plus supports or contradicts
- **Idea**: name, description, status, segments, beliefs, Key Questions
- **Belief**: idea, statement, confidence (manual, with evidence counts shown)
- **Segment**: idea, description
- **Next step**: conversation, owner (me or them), type, description, due date, done
- **Give**: person, date, what the user did
- **Person link**: person A → person B (introduced by, mentioned by)
- **Reminder**: person, due date, reason

---

## 10. Screens

1. **Capture** (default screen on mobile)
2. **Inbox** (triage)
3. **People** (search; filters: due, stage, idea, flag)
4. **Person** (profile plus a timeline of conversations, signals, gives and next steps)
5. **Brief** (pre-meeting)
6. **Debrief** (post-meeting form)
7. **Ideas** (list with status)
8. **Idea** (evidence board: beliefs, signals, segments, Key Questions)
9. **Events** (past events and who the user met)
10. **Settings** (profile, cadence defaults, export, delete account)
11. **Onboarding** (first-run: create a first idea with Key Questions, set up event mode, add a first person; offer sample data)

---

## 11. Scope and phases

### Phase 1: MVP (goal: the founder uses it at his next meeting)

- Sign up / sign in (Clerk), with strict per-account data isolation (Convex)
- Capture screen with event mode (text + photo)
- Offline capture with a local queue that syncs when back online; installable PWA
- Inbox and triage, including merge
- People list and Person page
- Conversation debrief: top 3, signals with type chips, honesty check, next step
- Meeting Brief
- Ideas with beliefs, segments and Key Questions
- Follow-up list (due next steps and reminders)
- Export all data (JSON and CSV) and delete account
- Short onboarding with optional sample data

### Phase 2

- Swap QR page for contact exchange
- Voice memo capture
- Idea evidence board with supports and contradicts counts
- Keep-in-touch cadences and the Reach out list
- Gives log
- Person-to-person links (intros and mentions)

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

1. **Offline sync:** Convex expects a connection. What's the approach for offline capture (e.g., a local IndexedDB outbox that syncs on reconnect), and how are conflicts handled?
2. **PWA with TanStack Start:** service worker setup, install prompt, and how photo capture behaves on iOS and Android.
3. **Photo storage:** Convex file storage with access checked per account; image compression on the device before upload.
4. **Voice memos in Phase 1?** Or text and photo only to start?
5. **Swap QR:** should scanning also offer the user's contact card automatically? What spam protection does the public page need?
6. **Sample data:** ship a demo dataset for onboarding? (Suggested contents in §14.)
7. **Name:** keep "Fieldnotes" or rename?

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
