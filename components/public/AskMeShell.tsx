"use client";

import { FormEvent, useState } from "react";

const suggestedQuestions = [
  "What projects have you worked on?",
  "What have you built with agentic AI?",
  "What kind of edge AI work have you done?",
];

type AskResponse = {
  answer: string;
  sources: Array<{ id: string; title: string }>;
  mode: "codex" | "mock" | "insufficient";
  model: string | null;
};

export function AskMeShell() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(nextQuestion: string) {
    const cleaned = nextQuestion.trim();
    if (!cleaned || loading) return;

    setQuestion(cleaned);
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleaned }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message || "Unable to answer right now.");
      }

      setResult(payload as AskResponse);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to answer right now.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <main className="public-shell">
      <section className="hero" aria-labelledby="ask-me-title">
        <p className="eyebrow">Professional knowledge, made conversational</p>
        <h1 id="ask-me-title">Ask Me</h1>
        <p className="intro">Ask me about my work, projects, demos, and technical interests.</p>

        <form className="question-box" onSubmit={submit}>
          <label htmlFor="question">What would you like to know?</label>
          <div className="question-row">
            <input
              id="question"
              name="question"
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask me anything about my work..."
              maxLength={400}
              disabled={loading}
            />
            <button type="submit" disabled={loading || question.trim().length === 0}>
              {loading ? "Thinking…" : "Ask"}
            </button>
          </div>
          <p className="helper">Answers use deliberately published sample knowledge only.</p>
        </form>

        <div className="suggestions">
          <h2>Suggested questions</h2>
          <div className="suggestion-list">
            {suggestedQuestions.map((suggestion) => (
              <button
                type="button"
                key={suggestion}
                onClick={() => void ask(suggestion)}
                disabled={loading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <section className="answer-panel" aria-live="polite" aria-busy={loading}>
          <div className="answer-heading">
            <h2>Answer</h2>
            {result?.mode === "mock" && <span className="mode-badge">Development mock</span>}
            {result?.mode === "codex" && <span className="mode-badge">Codex grounded</span>}
          </div>
          {loading && <p className="answer-placeholder">Finding relevant published knowledge…</p>}
          {error && <p className="error-message">{error}</p>}
          {!loading && !error && !result && (
            <p className="answer-placeholder">Your grounded answer will appear here.</p>
          )}
          {result && (
            <div className="answer-content">
              <p>{result.answer}</p>
              {result.sources.length > 0 && (
                <div className="answer-sources">
                  <strong>Published sources</strong>
                  <ul>
                    {result.sources.map((source) => (
                      <li key={source.id}>{source.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
