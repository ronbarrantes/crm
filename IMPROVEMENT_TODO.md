# Code review todo

For review on October 1, 2026. Reviewed `main` at `04023f67782b223c761952e4c82e0a9847208ca9`.

This is a bounded source review of the capture, triage, meeting, idea, and data flows. The failure scenarios below follow from the code; they have not been reproduced in a running browser. CodeRabbit was unavailable because its CLI was signed out. This PR only records proposed work.

## High priority

- [ ] **1. Keep a failed capture from overwriting the next person's draft.**

  Evidence: [`src/routes/capture.tsx:33`](src/routes/capture.tsx#L33) clears the form before `capture` finishes. Its rejection handler unconditionally restores the earlier name, hook line, and photo. There is no limit on concurrent saves.

  Failure scenario: save person A, start typing person B while A's photo uploads, then let A's save fail. A replaces B's unsaved details. With multiple saves in flight, callbacks can also replace a newer status message.

  Proposed work: for the first fix, keep the draft and disable submission until the save finishes. Clear it only after success. If accepting another capture during a save remains a requirement, keep pending and failed captures separate from the current draft.

  Done when: a delayed failed save cannot change a newer draft; the failed person's text and photo remain available for retry; success messages correspond to completed saves. Verify with one controlled delayed upload failure.

- [ ] **2. Make debrief submission safe to repeat.**

  Evidence: [`convex/meetings.ts:52`](convex/meetings.ts#L52) accepts an already debriefed meeting, patches it, and inserts new signals and a new next step on every call. [`src/routes/meetings.$meetingId.debrief.tsx:21`](src/routes/meetings.$meetingId.debrief.tsx#L21) reloads meeting fields but initializes signals and next-step fields as a fresh form. A saved debrief URL remains accessible.

  Failure scenario: save a debrief, revisit its URL, and save again. The same meeting acquires another next step and can acquire duplicate signals. Its takeaways can also change without the form showing the existing related records.

  Proposed work: keep Phase 1 debriefs as a single submission. Enforce the planned-to-debriefed transition on the server and show a saved summary when reopening the page. A repeated submission must not append records. If editing is needed later, load and update existing signals and next steps explicitly.

  Done when: two submissions for one meeting leave one debrief's related records; reopening shows the saved state; a repeated request cannot overwrite the original. Verify the mutation with repeated and concurrent calls.

- [ ] **3. Preserve contact information and meeting context during merge.**

  Evidence: [`convex/people.ts:69`](convex/people.ts#L69) preserves the duplicate's hook line, one photo, and idea links, and reparents its related records. It then deletes the duplicate without preserving its personal notes, contact fields, flags, follow-up, or event context. If both people have photos, the duplicate's photo is deleted. The triage form's unsaved edits are also absent from the merge request at [`src/routes/inbox.tsx:179`](src/routes/inbox.tsx#L179).

  Failure scenario: capture an existing contact at a new event, attach a new business card, fill in details during triage, and merge. The new event context and card can disappear, and the form edits never reach the server.

  Proposed work: define a small, explicit merge policy. Fill missing contact fields, preserve both sets of notes and flags, and retain the new encounter's event/date context. Save triage edits as part of the merge transaction. Present conflicting contact values and photos before discarding them, or retain them in a minimal encounter record if both must remain available.

  Done when: merging complementary records preserves their useful information and all related meetings, signals, and next steps. Conflicting values and photos require an explicit choice. Verify a merge with complementary fields, conflicting photos, and unsaved triage edits.

- [ ] **4. Confirm mutations before announcing success or discarding input.**

  Evidence: [`src/routes/inbox.tsx:131`](src/routes/inbox.tsx#L131) calls `updatePerson` and immediately announces completion and selects the next person. Its merge handler does the same. [`src/routes/ideas.$ideaId.tsx:109`](src/routes/ideas.$ideaId.tsx#L109) clears a new belief before `addBelief` resolves. [`src/routes/meetings.new.tsx:49`](src/routes/meetings.new.tsx#L49) awaits the save but suppresses the error.

  Failure scenario: a triage save fails after the app says the person was triaged, or a belief save fails after its text disappears. A failed meeting save gives the user no explanation.

  Proposed work: await these writes, disable their submit controls while pending, and keep the draft on failure. Announce success and navigate only after confirmation. Show a local error with a retry action. Use the existing debrief save handler as the basic pattern rather than introducing a general mutation framework.

  Done when: rejected triage, merge, belief, and meeting writes keep their input and show an error; confirmed writes advance once. Verify these handlers with rejected promises.

- [ ] **5. Protect idea autosaves from lost drafts and stale array writes.**

  Evidence: [`src/components/ui.tsx:152`](src/components/ui.tsx#L152) types `onSave` as returning `void` and does not track its promise. On blur, its effect can reset the draft to the old `value` before the server confirms the edit. [`src/routes/ideas.$ideaId.tsx:79`](src/routes/ideas.$ideaId.tsx#L79) saves the entire question array from the last server snapshot for each individual question edit.

  Failure scenario: edit question 1, blur, then edit question 2 before the first write appears in the live query. The second array write can contain the old question 1 and undo that edit. A failed description save can reset the text without an error.

  Proposed work: keep a local draft for the idea's editable fields and save it with one explicit Save action. This avoids coordinating several independent blur saves. Retain the draft on failure and track confirmed versus unsaved values.

  Done when: editing two questions on a slow connection preserves both changes; a failed save preserves the description and questions and supports retry. Verify with delayed and rejected saves.

## Medium priority

- [ ] **6. Enforce event expiry when a capture is saved.**

  Evidence: [`src/lib/store.ts:14`](src/lib/store.ts#L14) computes the current event using the clock during render, with no expiry timer or resume handler. [`convex/people.ts:16`](convex/people.ts#L16) checks event ownership but not `endsAt`.

  Failure scenario: leave Capture open across midnight without a data update. Its old event can remain selected, and the next save sends that expired event ID. The server accepts it, so the contact is tagged to yesterday's event.

  Proposed work: recompute event mode at expiry and when the app resumes. Check expiry on the server when associating a new capture. If the event has ended, save the contact without that event and make the resulting state clear.

  Done when: a capture after midnight cannot attach an expired event even if the client sends a stale ID; the banner updates after expiry or resume. Verify with a controlled clock and an expired event passed directly to the mutation.

## Review order and limits

Start with capture safety, debrief submission, and merge preservation because they can lose information or change the evidence history. Then address write confirmation and idea editing. Decide whether simultaneous captures and editable debriefs are required before adding machinery for either.

Keep the single owner-scoped query in `convex/data.ts` for now. It reads all seven tables and resolves every person's photo URL, but this review has no measured size or latency problem to justify splitting it. Leave style cleanup and Phase 2 features out of this todo. Add the focused checks above when implementing each fix; a documentation-only PR does not need a build or new tests.
