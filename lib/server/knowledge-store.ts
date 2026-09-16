import "server-only";

import { randomUUID } from "node:crypto";
import { createSeedKnowledge } from "@/lib/knowledge/seed";
import type {
  KnowledgeCreateInput,
  KnowledgeEntry,
  KnowledgeInput,
} from "@/lib/knowledge/types";

declare global {
  var __askMeKnowledgeStore: KnowledgeEntry[] | undefined;
}

function store() {
  globalThis.__askMeKnowledgeStore ??= createSeedKnowledge();
  return globalThis.__askMeKnowledgeStore;
}

function copy(entry: KnowledgeEntry): KnowledgeEntry {
  return { ...entry };
}

export function getPublishedKnowledge(): KnowledgeEntry[] {
  return store().filter((entry) => entry.published).map(copy);
}

export function getAllKnowledgeForAdmin(): KnowledgeEntry[] {
  return store()
    .map(copy)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function createKnowledge(input: KnowledgeCreateInput): KnowledgeEntry {
  const now = new Date().toISOString();
  const entry: KnowledgeEntry = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  store().push(entry);
  return copy(entry);
}

export function updateKnowledge(
  id: string,
  changes: Partial<KnowledgeInput>,
): KnowledgeEntry | null {
  const entry = store().find((candidate) => candidate.id === id);
  if (!entry) return null;

  Object.assign(entry, changes, { updatedAt: new Date().toISOString() });
  return copy(entry);
}

export function deleteKnowledge(id: string): boolean {
  const entries = store();
  const index = entries.findIndex((entry) => entry.id === id);
  if (index === -1) return false;

  entries.splice(index, 1);
  return true;
}
