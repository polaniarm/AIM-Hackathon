import type { KnowledgeEntry } from "./types";

const SEEDED_AT = "2026-09-16T00:00:00.000Z";

const seedKnowledge: readonly KnowledgeEntry[] = [
  {
    id: "sample-agentic-ai",
    title: "Agentic AI prototypes",
    content:
      "Sample portfolio knowledge: hackathon prototypes explored bounded AI agents that coordinate tools, preserve human oversight, and turn complex workflows into reliable demos.",
    sourceType: "sample",
    published: true,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  },
  {
    id: "sample-edge-ai",
    title: "Edge AI experimentation",
    content:
      "Sample portfolio knowledge: edge AI work focused on running useful inference near the device, especially where latency, privacy, connectivity, and resource constraints matter.",
    sourceType: "sample",
    published: true,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  },
  {
    id: "sample-arm-work",
    title: "Arm platform exploration",
    content:
      "Sample portfolio knowledge: technical experiments used Arm-based systems to explore efficient AI workloads, developer experience, and practical on-device demonstrations.",
    sourceType: "sample",
    published: true,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  },
  {
    id: "sample-local-ai",
    title: "Local and on-device AI",
    content:
      "Sample portfolio knowledge: local AI prototypes investigated private, responsive experiences that keep inference close to users and reduce dependence on cloud connectivity.",
    sourceType: "sample",
    published: true,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  },
  {
    id: "sample-demos",
    title: "Demo-driven technical projects",
    content:
      "Sample portfolio knowledge: projects are shaped into small end-to-end demos that make technical capability visible, test risky assumptions early, and remain dependable during live presentations.",
    sourceType: "sample",
    published: true,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  },
  {
    id: "private-planning-note",
    title: "Private planning note",
    content:
      "PRIVATE_SENTINEL_DO_NOT_EXPOSE. This sample private note represents unreviewed source material that must never enter public retrieval.",
    sourceType: "private-sample",
    published: false,
    createdAt: SEEDED_AT,
    updatedAt: SEEDED_AT,
  },
];

export function createSeedKnowledge(): KnowledgeEntry[] {
  return seedKnowledge.map((entry) => ({ ...entry }));
}
