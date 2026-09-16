"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { KnowledgeEntry, KnowledgeInput } from "@/lib/knowledge/types";

const emptyForm: KnowledgeInput = {
  title: "",
  content: "",
  sourceType: "manual",
  published: false,
};

export function AdminShell({ initialEntries }: { initialEntries: KnowledgeEntry[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [form, setForm] = useState<KnowledgeInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [outlookQuery, setOutlookQuery] = useState("financial agentic");
  const [outlookStatus, setOutlookStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function edit(entry: KnowledgeEntry) {
    setEditingId(entry.id);
    setForm({
      title: entry.title,
      content: entry.content,
      sourceType: entry.sourceType,
      published: entry.published,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function importFromOutlook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setOutlookStatus("");

    try {
      const response = await fetch("/api/admin/outlook/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: outlookQuery }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to import Outlook knowledge.");

      const imported = payload.entries as KnowledgeEntry[];
      if (imported.length > 0) {
        setEntries((current) => [...imported, ...current]);
        setOutlookStatus(
          `${imported.length} unpublished candidate${imported.length === 1 ? "" : "s"} added for review.`,
        );
      } else if (payload.duplicatesSkipped > 0) {
        setOutlookStatus("Matching Outlook candidates are already in the knowledge list.");
      } else {
        setOutlookStatus("No staged Outlook knowledge matched that topic.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to import Outlook knowledge.");
    } finally {
      setBusy(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const url = editingId ? `/api/admin/knowledge/${editingId}` : "/api/admin/knowledge";
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to save entry.");

      const saved = payload.entry as KnowledgeEntry;
      setEntries((current) =>
        editingId
          ? current.map((entry) => (entry.id === saved.id ? saved : entry))
          : [saved, ...current],
      );
      resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save entry.");
    } finally {
      setBusy(false);
    }
  }

  async function patchEntry(id: string, changes: Partial<KnowledgeInput>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/knowledge/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Unable to update entry.");
      const updated = payload.entry as KnowledgeEntry;
      setEntries((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update entry.");
    } finally {
      setBusy(false);
    }
  }

  async function removeEntry(entry: KnowledgeEntry) {
    if (!window.confirm(`Delete “${entry.title}”?`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/knowledge/${entry.id}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error?.message || "Unable to delete entry.");
      }
      setEntries((current) => current.filter((candidate) => candidate.id !== entry.id));
      if (editingId === entry.id) resetForm();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete entry.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Private workspace</p>
            <h1>Ask Me Admin</h1>
            <p>Curate what the public answering system is allowed to know.</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </header>

        <aside className="persistence-notice" role="note">
          <strong>Demo storage:</strong> changes are process-local. They reset when the server
          restarts and may differ between deployed instances; seeded knowledge always reloads.
        </aside>

        <form className="admin-form" onSubmit={importFromOutlook}>
          <div className="section-heading">
            <div>
              <h2>Import from Outlook</h2>
              <p>
                Search the private candidate staging set created from bounded Outlook retrieval.
                Every imported candidate starts unpublished and requires explicit review.
              </p>
            </div>
          </div>
          <label>
            Search/topic
            <input
              value={outlookQuery}
              onChange={(event) => setOutlookQuery(event.target.value)}
              maxLength={120}
              placeholder="agentic AI"
              required
            />
          </label>
          {outlookStatus && <p>{outlookStatus}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Importing…" : "Find knowledge"}
          </button>
        </form>

        <form className="admin-form" onSubmit={save}>
          <div className="section-heading">
            <h2>{editingId ? "Edit knowledge" : "Add knowledge"}</h2>
            {editingId && (
              <button className="text-button" type="button" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
          <label>
            Title
            <input
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              maxLength={120}
              required
            />
          </label>
          <label>
            Content
            <textarea
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              maxLength={4000}
              rows={6}
              required
            />
          </label>
          <div className="form-row">
            <label>
              Source type
              <input
                value={form.sourceType}
                onChange={(event) => setForm({ ...form, sourceType: event.target.value })}
                maxLength={40}
                required
              />
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.published}
                onChange={(event) => setForm({ ...form, published: event.target.checked })}
              />
              Publish immediately
            </label>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Saving…" : editingId ? "Save changes" : "Create entry"}
          </button>
        </form>

        <section className="knowledge-section">
          <div className="section-heading">
            <h2>Knowledge entries</h2>
            <span>{entries.length} total</span>
          </div>
          <div className="knowledge-list">
            {entries.map((entry) => (
              <article className="knowledge-card" key={entry.id}>
                <div className="knowledge-card-heading">
                  <div>
                    <span className={entry.published ? "status published" : "status private"}>
                      {entry.published ? "Published" : "Unpublished"}
                    </span>
                    <span className="source-type">{entry.sourceType}</span>
                    <h3>{entry.title}</h3>
                  </div>
                  <div className="card-actions">
                    <button type="button" onClick={() => edit(entry)} disabled={busy}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void patchEntry(entry.id, { published: !entry.published })}
                      disabled={busy}
                    >
                      {entry.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" onClick={() => void removeEntry(entry)} disabled={busy}>
                      Delete
                    </button>
                  </div>
                </div>
                {entry.sourceType === "outlook" && entry.sourceLabel && (
                  <p>
                    <strong>Imported from Outlook:</strong> {entry.sourceLabel}
                    {entry.sourceDate ? ` (${entry.sourceDate})` : ""}
                  </p>
                )}
                <p>{entry.content}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
