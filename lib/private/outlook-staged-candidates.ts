import "server-only";

export type OutlookStagedCandidate = {
  title: string;
  content: string;
  sourceLabel: string;
  sourceDate: string;
  searchText: string;
};

const candidates: readonly OutlookStagedCandidate[] = [
  {
    title: "Financial Agentic AI demo",
    content:
      "Boris developed a Financial Agentic AI demo in which specialized Finance, Procurement, Risk, Compliance, and Resolution agents investigate purchase-order and invoice exceptions. The agents can request help, work in parallel, challenge findings, and escalate unresolved issues before producing an advisory recommendation, while a human retains authority over the final business decision.",
    sourceLabel: "Financial Agentic Warm-Up",
    sourceDate: "2026-09-03",
    searchText:
      "financial agentic ai demo invoices orders purchase procurement finance risk compliance resolution agents human decision",
  },
  {
    title: "Distributed AI across cloud, on-premises, and edge",
    content:
      "Boris designed the Financial Agentic demo to make distributed AI execution visible across cloud, local accelerated compute, and edge devices. The system can use Alibaba Cloud and Qwen Cloud remotely, DGX Spark for the local control plane and workers, and a mobile browser assistant that runs a small Qwen model locally with WebGPU. Mission Control and the DevOps interface expose where tasks executed and where model inference occurred.",
    sourceLabel: "Financial Agentic Warm-Up",
    sourceDate: "2026-09-03",
    searchText:
      "cloud on premises edge dgx spark alibaba qwen webgpu mobile browser distributed ai mission control devops inference provenance",
  },
  {
    title: "Arm Everywhere China Financial Agentic demo",
    content:
      "Boris presented and refined the Financial Agentic AI demo for Arm Everywhere China. The demo showcased multiple AI agents working together across different platforms, and the experience was localized for the China market to improve relevance and engagement.",
    sourceLabel: "Financial Agentic AI Demo: Arm Everywhere Recap",
    sourceDate: "2026-09-16",
    searchText:
      "arm everywhere china financial agentic ai demo localized localization multiple agents platforms engagement",
  },
];

function tokens(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 1);
}

export function searchStagedOutlookCandidates(query: string) {
  const queryTokens = tokens(query);
  if (queryTokens.length === 0) return [];

  return candidates.filter((candidate) => {
    const haystack = `${candidate.title} ${candidate.content} ${candidate.searchText}`.toLowerCase();
    return queryTokens.some((token) => haystack.includes(token));
  });
}
