export type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeInput = Pick<
  KnowledgeEntry,
  "title" | "content" | "sourceType" | "published"
>;
