export type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  sourceType: string;
  sourceLabel?: string;
  sourceDate?: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeInput = Pick<
  KnowledgeEntry,
  "title" | "content" | "sourceType" | "published"
>;

export type KnowledgeCreateInput = KnowledgeInput &
  Pick<KnowledgeEntry, "sourceLabel" | "sourceDate">;
