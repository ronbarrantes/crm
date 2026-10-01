import { Link, createFileRoute } from "@tanstack/react-router";
import { Camera, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Field } from "~/components/ui";
import { time } from "~/lib/format";
import {
  activeEvent,
  capture,
  endEvent,
  inbox,
  startEvent,
  useData,
} from "~/lib/store";

export const Route = createFileRoute("/capture")({ component: Capture });

function Capture() {
  const data = useData();
  const event = activeEvent(data);
  const [name, setName] = useState("");
  const [hook, setHook] = useState("");
  const [photo, setPhoto] = useState<{ file: File; preview: string }>();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const tonight = data.people.filter((p) => event && p.eventId === event.id);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim() || !hook.trim()) {
      setError(
        !name.trim()
          ? "Add a name or a quick description."
          : "Add one line to remember them by.",
      );
      return;
    }
    // One save at a time: the draft stays put (read-only) until the server confirms,
    // so a failure can never land on top of the next person's details.
    const savedName = name.trim();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const { eventDropped } = await capture({
        name: savedName,
        hookLine: hook.trim(),
        photo: photo?.file,
        eventId: event?.id,
      });
      setName("");
      setHook("");
      setPhoto(undefined);
      setStatus(
        eventDropped
          ? `Saved ${savedName}. Tonight’s event had already ended, so they weren’t tagged with it.`
          : `Saved ${savedName}. Ready for the next person.`,
      );
    } catch {
      setError(`Couldn’t save ${savedName}. Your entry is still here. Check your connection and try again.`);
    } finally {
      setSaving(false);
      nameRef.current?.focus();
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="sr-only">Capture</h1>
      <EventBanner />

      <form
        onSubmit={save}
        noValidate
        className="mt-4 flex flex-col gap-4"
        aria-describedby={error ? "capture-error" : undefined}
      >
        <Field label="Name or description" htmlFor="name">
          <input
            ref={nameRef}
            id="name"
            className="field text-lg"
            placeholder="Sam, or “blue jacket, cleaning biz”"
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
            value={name}
            readOnly={saving}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={!!error && !name.trim()}
          />
        </Field>
        <Field label="One line to remember them" htmlFor="hook">
          <textarea
            id="hook"
            rows={2}
            className="field resize-none text-lg"
            placeholder="Ex-engineer, owns a farm, likes craft beer"
            enterKeyHint="done"
            value={hook}
            readOnly={saving}
            onChange={(e) => setHook(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) save(e);
            }}
            aria-invalid={!!error && !hook.trim()}
          />
        </Field>

        <div className="flex items-center gap-3">
          <input
            ref={fileRef}
            id="photo"
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPhoto({ file, preview: URL.createObjectURL(file) });
              e.target.value = "";
            }}
          />
          {photo ? (
            <div className="flex items-center gap-3">
              <img
                src={photo.preview}
                alt="Photo to attach"
                className="size-16 rounded-xl object-cover"
              />
              <Button variant="ghost" disabled={saving} onClick={() => setPhoto(undefined)}>
                <X aria-hidden className="size-4" /> Remove photo
              </Button>
            </div>
          ) : (
            <Button disabled={saving} onClick={() => fileRef.current?.click()}>
              <Camera aria-hidden className="size-5" /> Photo of card or badge
            </Button>
          )}
        </div>

        {error && (
          <p
            id="capture-error"
            role="alert"
            className="text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          aria-disabled={saving}
          className="min-h-14 rounded-2xl bg-accent text-lg font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-70"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <p
          role="status"
          aria-live="polite"
          className="flex min-h-6 items-center justify-center gap-1.5 text-sm text-ok"
        >
          {status && <Check aria-hidden className="size-4" />}
          {status}
        </p>
      </form>

      {tonight.length > 0 && (
        <section aria-labelledby="tonight" className="mt-4">
          <h2 id="tonight" className="label mb-2">
            Captured tonight · {tonight.length}
          </h2>
          <ul className="divide-y divide-rule rounded-2xl border border-rule bg-card">
            {tonight.map((p) => (
              <li
                key={p.id}
                className="flex items-baseline justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-medium">{p.name}</span>{" "}
                  <span className="text-ink-2">· {p.hookLine}</span>
                </span>
                <span className="shrink-0 text-ink-2">{time(p.metAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-center text-sm text-ink-2">
        Captures land in your{" "}
        <Link
          to="/inbox"
          className="font-medium text-accent underline underline-offset-4"
        >
          Inbox ({inbox(data).length})
        </Link>{" "}
        for triage later.
      </p>
    </div>
  );
}

function EventBanner() {
  const data = useData();
  const event = activeEvent(data);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");

  if (event) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-rule bg-soft px-4 py-3 text-on-soft">
        <p className="min-w-0 text-sm">
          <span className="label block text-on-soft/80">
            Tonight · ends at midnight
          </span>
          <span className="font-semibold">{event.name}</span>
          {event.place && <span> · {event.place}</span>}
        </p>
        <Button variant="ghost" onClick={() => endEvent(event.id)} className="text-on-soft">
          End
        </Button>
      </div>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-dashed border-rule-strong px-4 text-left text-sm text-ink-2 hover:bg-soft"
      >
        <span>
          <span className="font-medium text-ink">At an event?</span> Tag every
          capture with it.
        </span>
        <span aria-hidden>+</span>
      </button>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-2xl border border-rule bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        startEvent(name.trim(), place.trim());
        setEditing(false);
      }}
    >
      <Field label="Event" htmlFor="ev-name">
        <input
          id="ev-name"
          autoFocus
          className="field"
          placeholder="Business meetup"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="Place" htmlFor="ev-place">
        <input
          id="ev-place"
          className="field"
          placeholder="South Charlotte"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
      </Field>
      <p className="text-xs text-ink-2">Turns off automatically at midnight.</p>
      <div className="flex gap-2">
        <Button type="submit" variant="primary">
          Start event
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
