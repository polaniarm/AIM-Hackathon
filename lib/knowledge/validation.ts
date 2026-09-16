import type { KnowledgeInput } from "./types";

type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, field: string, maxLength: number): ValidationResult<string> {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, message: `${field} is required.` };
  }

  const cleaned = value.trim();
  if (cleaned.length > maxLength) {
    return { ok: false, message: `${field} must be ${maxLength} characters or fewer.` };
  }

  return { ok: true, value: cleaned };
}

export function parseKnowledgeInput(value: unknown): ValidationResult<KnowledgeInput> {
  if (!isRecord(value)) return { ok: false, message: "A knowledge entry is required." };

  const title = cleanString(value.title, "Title", 120);
  if (!title.ok) return title;
  const content = cleanString(value.content, "Content", 4_000);
  if (!content.ok) return content;
  const sourceType = cleanString(value.sourceType ?? "manual", "Source type", 40);
  if (!sourceType.ok) return sourceType;

  if (typeof value.published !== "boolean") {
    return { ok: false, message: "Published must be true or false." };
  }

  return {
    ok: true,
    value: {
      title: title.value,
      content: content.value,
      sourceType: sourceType.value,
      published: value.published,
    },
  };
}

export function parseKnowledgePatch(value: unknown): ValidationResult<Partial<KnowledgeInput>> {
  if (!isRecord(value)) return { ok: false, message: "Changes are required." };

  const changes: Partial<KnowledgeInput> = {};
  if ("title" in value) {
    const title = cleanString(value.title, "Title", 120);
    if (!title.ok) return title;
    changes.title = title.value;
  }
  if ("content" in value) {
    const content = cleanString(value.content, "Content", 4_000);
    if (!content.ok) return content;
    changes.content = content.value;
  }
  if ("sourceType" in value) {
    const sourceType = cleanString(value.sourceType, "Source type", 40);
    if (!sourceType.ok) return sourceType;
    changes.sourceType = sourceType.value;
  }
  if ("published" in value) {
    if (typeof value.published !== "boolean") {
      return { ok: false, message: "Published must be true or false." };
    }
    changes.published = value.published;
  }

  if (Object.keys(changes).length === 0) {
    return { ok: false, message: "At least one supported change is required." };
  }

  return { ok: true, value: changes };
}
